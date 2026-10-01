import { NextRequest, NextResponse } from 'next/server';
import {
  toWordTimings,
  type ElevenLabsTimestampResponse,
  type SpeechPayload,
} from '@/lib/elevenlabs';

export const runtime = 'nodejs';

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const API_KEY = process.env.ELEVENLABS_API_KEY;

// eleven_turbo_v2_5 is the low-latency model. eleven_v3 does NOT support the
// timestamp endpoints, so it is not an option here — without timings there is
// no lip-sync.
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5';

export async function POST(req: NextRequest) {
  if (!API_KEY || !VOICE_ID) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set' },
      { status: 500 },
    );
  }

  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Provide a non-empty "text" field' }, { status: 400 });
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        // mp3_44100_128 decodes reliably in every browser. Lower bitrates save
        // bandwidth but decode slower on mid-range Android, which is where the
        // latency actually hurts.
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          speed: 0.98,
        },
      }),
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: 'ElevenLabs request failed', status: upstream.status, detail },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as ElevenLabsTimestampResponse;

  // normalized_alignment maps to the text ElevenLabs actually spoke after it
  // expands things like "Q3" or "24/7". Prefer it — raw alignment can drift
  // out of sync with the audio wherever normalisation kicked in.
  const alignment = data.normalized_alignment ?? data.alignment;

  if (!alignment) {
    return NextResponse.json(
      { error: 'No alignment returned — lip-sync would be silent' },
      { status: 502 },
    );
  }

  const payload: SpeechPayload = {
    audio: data.audio_base64,
    ...toWordTimings(alignment),
  };

  return NextResponse.json(payload);
}
