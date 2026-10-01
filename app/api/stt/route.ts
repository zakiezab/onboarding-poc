import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_KEY = process.env.ELEVENLABS_API_KEY;

// scribe_v2 is ElevenLabs' speech-to-text model. This is a one-shot HTTP
// call (record, stop, transcribe), not a streaming session, so it doesn't
// need the WebSocket gateway the FSD excludes for live voice conversation.
const MODEL_ID = 'scribe_v2';

type ElevenLabsSttResponse = {
  text: string;
};

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY must be set' }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Body must be multipart/form-data' }, { status: 400 });
  }

  const file = form.get('audio');
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'Provide a non-empty "audio" file field' }, { status: 400 });
  }

  const upstreamForm = new FormData();
  upstreamForm.set('model_id', MODEL_ID);
  upstreamForm.set('file', file, 'speech.webm');

  const upstream = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: upstreamForm,
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: 'ElevenLabs request failed', status: upstream.status, detail },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as ElevenLabsSttResponse;

  if (!data.text || !data.text.trim()) {
    return NextResponse.json({ error: 'No speech detected' }, { status: 502 });
  }

  return NextResponse.json({ text: data.text.trim() });
}
