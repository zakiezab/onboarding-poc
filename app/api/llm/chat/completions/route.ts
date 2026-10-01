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

type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function toAnthropicMessages(messages: OpenAIMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

function sseChunk(id: string, model: string, delta: Record<string, string>, finishReason: string | null) {
  const payload = {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY must be set' }, { status: 500 });
  }

  let body: { messages?: OpenAIMessage[]; stream?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const { messages, stream } = body;
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
  const system = buildSystemPrompt(
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
        });

        anthropicStream.on('text', (text) => {
          controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, { content: text }, null)));
        });

        await anthropicStream.finalMessage();

        controller.enqueue(encoder.encode(sseChunk(id, MODEL_ID, {}, 'stop')));
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
