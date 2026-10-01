'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TalkingAvatarHandle } from '@/components/TalkingAvatar';
import { toWordTimingsFromRealtimeAlignment, type RealtimeAlignment } from '@/lib/elevenlabs';
import type { ReferenceVariant } from '@/components/ReferencePanel';
import { theme as t } from '@/lib/theme';

// The one client tool this agent is expected to have (configured in the
// ElevenLabs dashboard, not here — see its "Tools" section). Checked against
// this allowlist before touching page.tsx's state, since the parameter value
// is dashboard-configured text, not something our own types can constrain.
const REFERENCE_VARIANTS: ReadonlySet<string> = new Set(['presentation', 'video', 'org-chart', 'people']);

// Wire formats verified directly against ElevenLabs' docs before writing this
// (see the FSD's own instruction not to guess vendor APIs) — server messages
// nest fields under "<type>_event" (e.g. audio_event.audio_base_64,
// user_transcription_event.user_transcript); the client sends bare-keyed
// messages for audio ({ user_audio_chunk: "<base64>" }) and typed ones for
// everything else ({ type: "pong", event_id }).

type ConnState = 'idle' | 'connecting' | 'live' | 'error';

type Props = {
  avatarRef: React.RefObject<TalkingAvatarHandle | null>;
  /** Lets the scripted walkthrough (page.tsx) pause itself while live mode runs. */
  onLiveChange?: (live: boolean) => void;
  /** Mic-side analyser, for the orb — a separate audio graph from the avatar's
   *  own, since mic input goes to the WebSocket, never through TalkingHead. */
  onMicAnalyser?: (analyser: AnalyserNode | null) => void;
  onAgentSpeakingChange?: (speaking: boolean) => void;
  /** The agent called its show_reference client tool — see REFERENCE_VARIANTS. */
  onShowReference?: (variant: ReferenceVariant) => void;
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" fill="currentColor" />
      <path
        d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21a1 1 0 1 0 2 0v-3.07A7 7 0 0 0 19 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function RealtimeConversation({
  avatarRef,
  onLiveChange,
  onMicAnalyser,
  onAgentSpeakingChange,
  onShowReference,
}: Props) {
  const [state, setState] = useState<ConnState>('idle');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const agentSpeakingRef = useRef(false);

  const setAgentSpeaking = useCallback(
    (speaking: boolean) => {
      agentSpeakingRef.current = speaking;
      onAgentSpeakingChange?.(speaking);
    },
    [onAgentSpeakingChange],
  );

  const stopConversation = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    micStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    micStreamRef.current = null;
    workletRef.current?.disconnect();
    workletRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    micAnalyserRef.current = null;
    onMicAnalyser?.(null);
    setAgentSpeaking(false);
    avatarRef.current?.streamStop();
    setState('idle');
    onLiveChange?.(false);
  }, [avatarRef, onLiveChange, onMicAnalyser, setAgentSpeaking]);

  // Tear down cleanly if the component unmounts mid-conversation.
  useEffect(() => () => stopConversation(), [stopConversation]);

  const startConversation = useCallback(async () => {
    setError(null);
    setState('connecting');

    try {
      const signedRes = await fetch('/api/conversation/signed-url');
      if (!signedRes.ok) {
        const body = await signedRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Could not get a signed URL (${signedRes.status})`);
      }
      const { signedUrl } = (await signedRes.json()) as { signedUrl: string };

      const ws = new WebSocket(signedUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));

          await avatarRef.current?.streamStart(16000);

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;

          // Must be 16000 Hz to match ElevenLabs' required input rate — the
          // worklet converts format (Float32 -> PCM16) but doesn't resample.
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          audioCtxRef.current = audioCtx;
          await audioCtx.audioWorklet.addModule('/audio/pcm-capture-worklet.js');

          const source = audioCtx.createMediaStreamSource(stream);
          const worklet = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');
          workletRef.current = worklet;
          worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            ws.send(JSON.stringify({ user_audio_chunk: arrayBufferToBase64(e.data) }));
          };
          source.connect(worklet);

          // Tapped off the same mic source, purely for the orb visualizer —
          // doesn't affect what gets sent over the WebSocket.
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.1;
          source.connect(analyser);
          micAnalyserRef.current = analyser;
          onMicAnalyser?.(analyser);

          setState('live');
          onLiveChange?.(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't access your microphone.");
          setState('error');
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case 'ping': {
            const pingEvent = msg.ping_event as { event_id: number };
            ws.send(JSON.stringify({ type: 'pong', event_id: pingEvent.event_id }));
            break;
          }
          case 'user_transcript': {
            // Barge-in: the hire started talking, so cut the avatar off now
            // rather than waiting for it to finish its current sentence.
            if (agentSpeakingRef.current) {
              avatarRef.current?.streamInterrupt();
              avatarRef.current?.resetCaption();
              setAgentSpeaking(false);
            }
            break;
          }
          case 'client_tool_call': {
            // Wire format verified against ElevenLabs' client-events docs —
            // not the SDK's clientTools callback shape, since this component
            // talks the raw WebSocket protocol directly (see the file-top note).
            const { tool_name, tool_call_id, parameters } = msg.client_tool_call as {
              tool_name: string;
              tool_call_id: string;
              parameters?: Record<string, unknown>;
            };
            console.log('[debug] client_tool_call', tool_name, JSON.stringify(parameters));

            if (tool_name === 'show_reference') {
              const variant = parameters?.type;
              if (typeof variant === 'string' && REFERENCE_VARIANTS.has(variant)) {
                onShowReference?.(variant as ReferenceVariant);
                ws.send(
                  JSON.stringify({ type: 'client_tool_result', tool_call_id, result: 'shown', is_error: false }),
                );
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'client_tool_result',
                    tool_call_id,
                    result: `Unknown reference type "${String(variant)}"`,
                    is_error: true,
                  }),
                );
              }
            } else {
              ws.send(
                JSON.stringify({
                  type: 'client_tool_result',
                  tool_call_id,
                  result: `Unknown tool "${tool_name}"`,
                  is_error: true,
                }),
              );
            }
            break;
          }
          case 'audio': {
            const { audio_base_64, alignment } = msg.audio_event as {
              audio_base_64: string;
              alignment?: RealtimeAlignment;
            };
            const pcm = base64ToArrayBuffer(audio_base_64);
            const words = alignment ? toWordTimingsFromRealtimeAlignment(alignment) : undefined;
            // Streaming has no "new sentence" event of its own — chunks just
            // keep arriving — so the first chunk since the agent was last
            // silent is what marks a new turn, and that's when the caption
            // line from the previous turn should clear.
            if (!agentSpeakingRef.current) {
              avatarRef.current?.resetCaption();
            }
            avatarRef.current?.streamAudio(pcm, words);
            setAgentSpeaking(true);
            break;
          }
          default:
            break;
        }
      };

      ws.onerror = () => {
        setError('Connection to the live guide failed.');
        setState('error');
      };

      ws.onclose = (e) => {
        console.log('[debug] ws closed code=' + e.code + ' reason=' + e.reason);
        setState((prev) => (prev === 'live' || prev === 'connecting' ? 'idle' : prev));
        onLiveChange?.(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the live conversation.');
      setState('error');
    }
  }, [avatarRef, onLiveChange, onMicAnalyser, onShowReference, setAgentSpeaking]);

  return (
    <div style={s.wrap}>
      <button
        type="button"
        className={state === 'live' ? 'mic-btn mic-btn-live' : 'mic-btn'}
        disabled={state === 'connecting'}
        onClick={state === 'idle' ? startConversation : stopConversation}
        aria-pressed={state === 'live'}
        aria-label={state === 'live' ? 'End live conversation' : 'Start live conversation'}
      >
        <MicIcon />
      </button>

      <span style={s.micCaption}>
        {state === 'connecting' ? 'Connecting…' : state === 'live' ? 'Tap to end' : 'Tap to talk'}
      </span>

      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' },
  micCaption: { fontSize: '0.8rem', color: t.textFaint },
  error: { fontSize: '0.8rem', color: t.redSoft, margin: 0 },
};
