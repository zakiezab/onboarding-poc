import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSystemPrompt, type Hire } from '@/lib/onboarding-script';

export const runtime = 'nodejs';

const API_KEY = process.env.ANTHROPIC_API_KEY;

// Sonnet 5: this is short, grounded Q&A (a system prompt with a handful of
// documents, a short question, a 2-3 sentence spoken answer), not a task that
// benefits from the top-tier model, and it's latency-sensitive since the
// hire is waiting for a spoken reply.
const MODEL_ID = 'claude-sonnet-5';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// The "onboarding documents" buildSystemPrompt() grounds answers in: the
// master script (company-wide) plus the hire's department file, if one
// exists yet. A missing department file isn't an error here — the system
// prompt already instructs Claude to say so rather than guess.
async function loadDocuments(department: string): Promise<string> {
  const parts: string[] = [];

  try {
    const script = await readFile(path.join(process.cwd(), 'content', 'onboarding-script.md'), 'utf8');
    parts.push(script);
  } catch {
    // Master script not present; continue with whatever else is available.
  }

  try {
    const slug = slugify(department);
    const dept = await readFile(path.join(process.cwd(), 'content', 'departments', `${slug}.md`), 'utf8');
    parts.push(dept);
  } catch {
    // No department file yet.
  }

  return parts.join('\n\n---\n\n');
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY must be set' }, { status: 500 });
  }

  let body: { question?: unknown; hire?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const { question, hire } = body as { question?: string; hire?: Hire };

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Provide a non-empty "question" field' }, { status: 400 });
  }
  if (!hire || typeof hire !== 'object' || typeof hire.department !== 'string') {
    return NextResponse.json({ error: 'Provide a "hire" object' }, { status: 400 });
  }

  const documents = await loadDocuments(hire.department);
  const system = buildSystemPrompt(hire, documents);
  const client = new Anthropic({ apiKey: API_KEY });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: question }],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Claude request failed', detail: message }, { status: 502 });
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  const answer = textBlock?.type === 'text' ? textBlock.text.trim() : '';

  if (!answer) {
    return NextResponse.json({ error: 'No answer generated' }, { status: 502 });
  }

  return NextResponse.json({ answer });
}
