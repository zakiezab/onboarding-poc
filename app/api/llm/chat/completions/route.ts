import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSystemPrompt } from '@/lib/onboarding-script';
import { COMPANY_FACTS } from '@/lib/department-visuals';

export const runtime = 'nodejs';

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_ID = 'claude-sonnet-5';

// This endpoint exists to be called by ElevenLabs' Conversational AI
// ("Custom LLM"), not by our own frontend — it has to speak OpenAI's
// chat-completions wire format exactly, because that's the only contract
// ElevenLabs' agent orchestration knows how to call. See
// https://elevenlabs.io/docs/agents-platform/customization/llm/custom-llm
//
// We always build our own system prompt here and ignore whatever the
// ElevenLabs dashboard has configured for it — a dashboard text field isn't
// a place to keep documents in sync with content/departments/*.md. This
// still can't ground answers in a *specific* hire (no session/hire link
// confirmed for this channel yet — see the still-open item on dynamic
// variables), so it loads every department file plus the company-wide
// facts, rather than nothing at all.
async function loadAllDocuments(): Promise<string> {
  const parts: string[] = [];

  try {
    parts.push(await readFile(path.join(process.cwd(), 'content', 'onboarding-script.md'), 'utf8'));
  } catch {
    // Master script not present; continue with whatever else is available.
  }

  const factsText = COMPANY_FACTS.map((f) => `${f.label}: ${f.value} (${f.detail})`).join('\n');
  parts.push(`# Mobizinc at a glance\n\n${factsText}`);

  try {
    const dir = path.join(process.cwd(), 'content', 'departments');
    const files = await readdir(dir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      parts.push(await readFile(path.join(dir, file), 'utf8'));
    }
  } catch {
    // No department files yet.
  }

  return parts.join('\n\n---\n\n');
}

// Messages in a live conversation's history can include a turn that was a
// pure tool call (no spoken content) — content comes back null for those,
// not an empty string, hence `content: string | null` rather than assuming
// every message has text. A turn where the model called a tool also carries
// `tool_calls`, and the result of that call comes back as its own
// `role: "tool"` message — both unverified-by-docs shapes, but confirmed
// directly against a captured real request from ElevenLabs (see git history
// around the temporary debug capture this was diagnosed with).
type OpenAIToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
};

// ElevenLabs forwards the agent's configured tools (client tools included —
// from its side a client tool is just another OpenAI-shaped function the
// custom LLM can call; what ElevenLabs does with the resulting tool_calls
// is its own business) in this exact shape. Verified against ElevenLabs'
// custom-LLM docs before writing — see the FSD's instruction not to guess
// vendor wire formats.
type OpenAITool = {
  type: 'function';
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

// Anthropic has no "tool" role — a tool's result is a `tool_result` content
// block inside a *user* message, and a model's own tool call is a
// `tool_use` block inside its *assistant* message (which can carry a text
// block alongside it). ElevenLabs, going the other way, sometimes splits one
// logical assistant turn (spoken text, then the tool call) into two
// consecutive OpenAI-shaped assistant messages — confirmed from the same
// captured request — so consecutive assistant messages get merged into one
// here rather than left as two, which is also what was leaving the
// conversation ending on a bare assistant turn and tripping Anthropic's
// "must end with a user message" rule.
function toAnthropicMessages(messages: OpenAIMessage[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      result.push({ role: 'user', content: m.content ?? '' });
      continue;
    }

    if (m.role === 'tool') {
      result.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: m.tool_call_id ?? '', content: m.content ?? '' }],
      });
      continue;
    }

    if (m.role === 'assistant') {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (m.content) blocks.push({ type: 'text', text: m.content });
      for (const tc of m.tool_calls ?? []) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          // Malformed arguments from upstream — call it with no input rather
          // than drop the whole turn.
        }
        blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
      }
      if (blocks.length === 0) continue;

      const prev = result[result.length - 1];
      if (prev?.role === 'assistant' && Array.isArray(prev.content)) {
        prev.content.push(...blocks);
      } else {
        result.push({ role: 'assistant', content: blocks });
      }
    }
    // 'system' role is dropped — we always build our own system prompt.
  }

  return result;
}

function toAnthropicTools(tools: OpenAITool[] | undefined): Anthropic.Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools
    .filter((t) => t.type === 'function' && t.function?.name)
    .map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: (t.function.parameters as Anthropic.Tool['input_schema']) ?? {
        type: 'object',
        properties: {},
      },
    }));
}

function sseChunk(
  id: string,
  model: string,
  delta: Record<string, unknown>,
  finishReason: string | null,
) {
  const payload = {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

// OpenAI's tool_calls delta shape — what ElevenLabs' custom-LLM integration
// expects back when the model decides to call one of the tools it sent us
// (see toAnthropicTools above). One delta per tool_use block Claude produced.
function sseToolCallsChunk(
  id: string,
  model: string,
  toolCalls: Array<{ id: string; name: string; argumentsJson: string }>,
) {
  const delta = {
    tool_calls: toolCalls.map((tc, index) => ({
      index,
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.argumentsJson },
    })),
  };
  return sseChunk(id, model, delta, null);
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY must be set' }, { status: 500 });
  }

  let body: { messages?: OpenAIMessage[]; stream?: boolean; tools?: OpenAITool[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const { messages, stream, tools } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Provide a non-empty "messages" array' }, { status: 400 });
  }
  if (!stream) {
    return NextResponse.json(
      { error: 'This endpoint only supports stream: true (ElevenLabs requires SSE)' },
      { status: 400 },
    );
  }

  const documents = await loadAllDocuments();
  let system = buildSystemPrompt(
    {
      firstName: 'there',
      role: 'a new team member',
      department: 'your department',
      managerName: 'your manager',
      buddyName: 'your buddy',
      startDate: 'today',
    },
    documents,
  );

  const anthropicTools = toAnthropicTools(tools);
  if (anthropicTools) {
    // Only added when the agent actually has tools configured — /api/chat's
    // scripted path never sees this, since it calls buildSystemPrompt directly.
    system += `\n\nYou also have tools for showing visual material on screen (an org \
chart, slides, a video, or people cards). This is separate from the document-grounding \
rule above, which is about what you say, not what you can show — if a tool's \
description covers what the hire is asking to see, call it even if that specific \
thing isn't written in the documents. Call it as soon as they ask, don't ask \
permission first. Briefly say what you're pulling up in one short sentence, in the \
same turn as the call, since you won't get a second turn to narrate it afterwards.`;
  }

  const anthropicMessages = toAnthropicMessages(messages);

  const client = new Anthropic({ apiKey: API_KEY });
  const id = `chatcmpl-${Date.now()}`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, { role: 'assistant', content: '' }, null)));

      try {
        const anthropicStream = client.messages.stream({
          model: MODEL_ID,
          max_tokens: 1024,
          system,
          messages: anthropicMessages,
          ...(anthropicTools ? { tools: anthropicTools } : {}),
        });

        anthropicStream.on('text', (text) => {
          controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, { content: text }, null)));
        });

        const finalMessage = await anthropicStream.finalMessage();
        const toolUseBlocks = finalMessage.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );

        if (toolUseBlocks.length > 0) {
          controller.enqueue(
            encoder.encode(
              sseToolCallsChunk(
                id,
                MODEL_ID,
                toolUseBlocks.map((tc) => ({
                  id: tc.id,
                  name: tc.name,
                  argumentsJson: JSON.stringify(tc.input),
                })),
              ),
            ),
          );
          controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, {}, 'tool_calls')));
        } else {
          controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, {}, 'stop')));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
