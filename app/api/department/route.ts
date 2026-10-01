import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

/**
 * One HR file per department, in content/departments/<slug>.md
 *
 * The file is written for HR to read and edit, so it contains headings,
 * bullets and links. None of that survives text-to-speech — it gets read out
 * as "hash hash Your team, dash, dash". So we strip the formatting here and
 * return prose.
 *
 * The `<!-- spoken -->` ... `<!-- /spoken -->` block is the opt-in escape
 * hatch: if HR marks a section, only that section is read aloud and the rest
 * of the file stays available as reference for the Q&A context.
 */

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// A heading or list item always starts its own sentence; a plain line inside
// a paragraph doesn't.
const isBlockStart = (line: string) => /^(#{1,6}\s|[-*+]\s|\d+\.\s)/.test(line);

function toSpoken(markdown: string): string {
  const marked = markdown.match(/<!--\s*spoken\s*-->([\s\S]*?)<!--\s*\/spoken\s*-->/i);
  const source = marked ? marked[1] : markdown;

  const stripped = source
    .replace(/^---[\s\S]*?---/, '')          // frontmatter
    .replace(/```[\s\S]*?```/g, '')          // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')    // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // links keep their text

  // HR writes these files hard-wrapped at a column width for readability, so
  // a single newline inside a paragraph is a soft wrap, not a sentence
  // break — only a blank line is a real paragraph boundary. Collapsing those
  // wrapped lines back into one line per paragraph *before* the "add a
  // period if missing" pass below is what stops a "." landing mid-sentence
  // at every wrap. Headings and list items are the exception: each one is
  // already its own line, wrapped or not, and stays its own sentence.
  const lines: string[] = [];
  for (const paragraph of stripped.split(/\n\s*\n/)) {
    let startOfParagraph = true;
    for (const raw of paragraph.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (startOfParagraph || isBlockStart(line)) {
        lines.push(line);
        startOfParagraph = false;
      } else {
        lines[lines.length - 1] += ` ${line}`;
      }
    }
  }

  return lines
    .map((l) => l.replace(/^#{1,6}\s+/, '').replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, ''))
    .map((l) => l.replace(/[*_`>|]/g, ''))    // inline marks and tables
    .filter(Boolean)
    .map((l) => (/[.!?]$/.test(l) ? l : `${l}.`))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'Provide ?name=<department>' }, { status: 400 });
  }

  const slug = slugify(name);
  const file = path.join(process.cwd(), 'content', 'departments', `${slug}.md`);

  try {
    const raw = await readFile(file, 'utf8');
    return NextResponse.json({ department: name, spoken: toSpoken(raw), raw });
  } catch {
    return NextResponse.json(
      { error: `No onboarding file found for "${name}" (expected content/departments/${slug}.md)` },
      { status: 404 },
    );
  }
}
