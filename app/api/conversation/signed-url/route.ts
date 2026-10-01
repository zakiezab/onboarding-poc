import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

// The browser needs a short-lived signed WebSocket URL to talk to ElevenLabs
// directly — it can't hold ELEVENLABS_API_KEY itself (NFR-04). This route is
// the only place that key touches the realtime conversation path; everything
// after this is the browser talking to ElevenLabs' WebSocket on its own.
export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY must be set' }, { status: 500 });
  }
  if (!AGENT_ID) {
    return NextResponse.json(
      { error: 'ELEVENLABS_AGENT_ID must be set — create the Agent in the ElevenLabs dashboard first' },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
    { headers: { 'xi-api-key': API_KEY } },
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: 'ElevenLabs request failed', status: upstream.status, detail },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as { signed_url: string };
  return NextResponse.json({ signedUrl: data.signed_url });
}
