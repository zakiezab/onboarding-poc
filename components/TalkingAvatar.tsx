'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { SpeechPayload } from '@/lib/elevenlabs';

export type AvatarMood = 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'disgust' | 'love' | 'sleep';

/** Word-level timing for a chunk of streamed audio, same shape /api/tts returns. */
export type StreamWords = { words: string[]; wtimes: number[]; wdurations: number[] };

/** One word of the current caption line, and whether playback has reached it yet. */
export type CaptionWord = { text: string; spoken: boolean };

/**
 * Incremental updates for a karaoke-style caption line, driven by
 * TalkingHead's own per-word onSubtitles callback (verified against its
 * source — see the comment on the onsubtitles argument passed to
 * speakAudio/streamStart below) rather than a timer we'd have to guess the
 * sync for ourselves.
 */
export type CaptionAction =
  | { type: 'reset' }
  | { type: 'append'; words: string[] }
  | { type: 'advance' };

export type TalkingAvatarHandle = {
  /** Speak a passage. Resolves when the last sentence finishes playing. */
  speak: (text: string, mood?: AvatarMood) => Promise<void>;
  /** Cut off mid-sentence and reset the mouth. */
  stop: () => void;
  isReady: () => boolean;
  /** Begin a realtime streaming session (live conversation). PCM16 audio only. */
  streamStart: (sampleRate: number) => Promise<void>;
  /** Feed one chunk of raw PCM16 audio, with word timings for lip-sync. */
  streamAudio: (pcm16: ArrayBuffer, words?: StreamWords) => void;
  /** Barge-in: clear buffered audio immediately, keep the session open for more. */
  streamInterrupt: () => void;
  /** End the streaming session entirely (conversation over). */
  streamStop: () => void;
  /** The analyser node both the scripted and streaming paths already play
   *  through — for an audio-reactive visualizer, not a second audio graph. */
  getAudioAnalyser: () => AnalyserNode | null;
  /** Clear the caption line. Streaming has no "new sentence" boundary of its
   *  own (chunks just keep arriving), so the caller — RealtimeConversation,
   *  which does know when a new agent turn starts — calls this explicitly. */
  resetCaption: () => void;
};

type Props = {
  /** URL of a GLB with the 52 ARKit blendshapes + Oculus visemes. */
  avatarUrl: string;
  onStateChange?: (state: AvatarState) => void;
  /** Caption line updates, word-synced to actual audio playback — the sole
   *  transcript signal now (this superseded the old sentence-only callback). */
  onCaption?: (action: CaptionAction) => void;
  className?: string;
};

export type AvatarState = 'loading' | 'ready' | 'speaking' | 'error';

/* eslint-disable @typescript-eslint/no-explicit-any */
type TalkingHeadInstance = any;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const TalkingAvatar = forwardRef<TalkingAvatarHandle, Props>(function TalkingAvatar(
  { avatarUrl, onStateChange, onCaption, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHeadInstance>(null);

  // Bumped on stop() so an in-flight speak() loop knows to abandon itself
  // rather than keep queueing sentences at a listener who interrupted.
  const runIdRef = useRef(0);
  // Resolves the current speak()'s wait-out-the-audio promise early when
  // stop() interrupts it (e.g. the Skip button) — otherwise that promise
  // only resolves after the original, now-irrelevant audio duration, and
  // callers awaiting speak() (playBeat) would stay "busy" long after the
  // audio was actually cut off.
  const speakStopRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<AvatarState>('loading');
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback(
    (next: AvatarState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  useEffect(() => {
    let cancelled = false;
    let head: TalkingHeadInstance = null;

    async function boot() {
      if (!containerRef.current) return;

      try {
        // Dynamic import: TalkingHead touches window/WebGL at module scope, so
        // it cannot be imported at the top level in a Next.js app.
        //
        // Loaded via the browser import map (see app/layout.tsx), not the npm
        // package specifier: TalkingHead's own lip-sync loader does a fully
        // dynamic import(path + lang + '.mjs') that Turbopack/webpack cannot
        // statically resolve. webpackIgnore skips bundling this import so the
        // browser resolves "talkinghead" natively against the real static
        // file, letting that internal relative import work as the library
        // (see its own examples/*.html) expects.
        const mod: any = await import(/* webpackIgnore: true */ 'talkinghead');
        const TalkingHead = mod.TalkingHead ?? mod.default;

        if (cancelled) return;

        head = new TalkingHead(containerRef.current, {
          // We synthesise via our own /api/tts route, so the built-in Google
          // TTS path is never used. The constructor still wants the field.
          ttsEndpoint: '/api/tts-unused',
          lipsyncModules: ['en'],
          cameraView: 'upper',
          avatarMood: 'neutral',
          // Idle motion keeps the avatar from reading as a frozen mannequin
          // between turns. Too high and it looks twitchy on a static shot.
          avatarIdleEyeContact: 0.6,
          avatarIdleHeadMove: 0.4,
          avatarSpeakingEyeContact: 0.85,
        });

        await head.showAvatar({
          url: avatarUrl,
          body: 'F',
          avatarMood: 'neutral',
          lipsyncLang: 'en',
        });

        if (cancelled) {
          head.stop?.();
          return;
        }

        headRef.current = head;
        updateState('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('[TalkingAvatar] failed to initialise', err);
        setError(err instanceof Error ? err.message : 'Avatar failed to load');
        updateState('error');
      }
    }

    boot();

    return () => {
      cancelled = true;
      runIdRef.current += 1;
      try {
        headRef.current?.stop?.();
      } catch {
        /* teardown is best effort */
      }
      headRef.current = null;
    };
  }, [avatarUrl, updateState]);

  // One TTS call for the whole passage, not one per sentence. Splitting text
  // into per-sentence /api/tts calls (even prefetched ahead of playback, as
  // this used to do) still produces N independently-synthesised clips —
  // ElevenLabs has no idea sentence 2 follows sentence 1, so each clip gets
  // its own fresh intonation and the join between them reads as a stop/start
  // no matter how tight the gap is. A single call gets one continuous clip
  // with real cross-sentence prosody, which is what actually fixes it.
  const speak = useCallback(
    async (text: string, mood: AvatarMood = 'neutral') => {
      const head = headRef.current;
      if (!head) return;

      runIdRef.current += 1;
      const runId = runIdRef.current;

      updateState('speaking');

      try {
        head.setMood?.(mood);

        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
        if (runId !== runIdRef.current) return;

        const payload = (await res.json()) as SpeechPayload;

        // Decode on TalkingHead's own AudioContext so playback time and the
        // viseme scheduler share one clock. A separate context drifts.
        const audioBuffer: AudioBuffer = await head.audioCtx.decodeAudioData(
          base64ToArrayBuffer(payload.audio),
        );
        if (runId !== runIdRef.current) return;

        onCaption?.({ type: 'reset' });
        onCaption?.({ type: 'append', words: payload.words });

        await new Promise<void>((resolve) => {
          head.speakAudio(
            {
              // Must be a bare AudioBuffer, not an array: TalkingHead's playAudio()
              // treats an array as raw PCM chunks to concatenate, not decoded audio.
              audio: audioBuffer,
              words: payload.words,
              wtimes: payload.wtimes,
              wdurations: payload.wdurations,
            },
            { lipsyncLang: 'en' },
            // Fires once per word, scheduled against the same clock as lip-sync
            // (verified in node_modules/@met4citizen/talkinghead — speakAudio
            // schedules a 'subtitles' animation task at r.wtimes[i] for every
            // word), so this is real audio-synced timing, not a guessed one.
            () => onCaption?.({ type: 'advance' }),
          );

          // TalkingHead has no completion promise, so wait out the audio —
          // unless stop() resolves this early first (see speakStopRef).
          const timeoutId = setTimeout(() => {
            speakStopRef.current = null;
            resolve();
          }, audioBuffer.duration * 1000);
          speakStopRef.current = () => {
            clearTimeout(timeoutId);
            speakStopRef.current = null;
            resolve();
          };
        });
      } catch (err) {
        console.error('[TalkingAvatar] speak failed', err);
        setError(err instanceof Error ? err.message : 'Speech failed');
      } finally {
        if (runId === runIdRef.current) updateState('ready');
      }
    },
    [onCaption, updateState],
  );

  const stop = useCallback(() => {
    runIdRef.current += 1;
    const head = headRef.current;
    if (!head) return;
    try {
      head.stopSpeaking?.();
      head.setMood?.('neutral');
    } catch {
      /* no-op */
    }
    speakStopRef.current?.();
    updateState('ready');
    onCaption?.({ type: 'reset' });
  }, [updateState, onCaption]);

  // Live-conversation streaming path (real-time duplex): separate from
  // speak()/stop() above, which drive the scripted sentence-batched path.
  // TalkingHead's streamStart/streamAudio/streamInterrupt/streamStop are
  // dedicated public methods for exactly this — see the comment on
  // speakSentence's `audio` field for why the batched path can't just reuse
  // this (bare AudioBuffer vs raw PCM16 are genuinely different inputs).
  const streamStart = useCallback(async (sampleRate: number) => {
    const head = headRef.current;
    if (!head) return;
    runIdRef.current += 1; // cancel any in-flight scripted speak()
    updateState('speaking');
    await head.streamStart(
      { sampleRate, lipsyncType: 'words', lipsyncLang: 'en' },
      undefined,
      () => updateState('ready'),
      // Same verified per-word callback as speakAudio above (streamStart's
      // internal _processLipsyncData schedules the identical 'subtitles'
      // animation task, just offset by the stream's audioStart instead of 0).
      () => onCaption?.({ type: 'advance' }),
    );
  }, [updateState, onCaption]);

  const streamAudio = useCallback((pcm16: ArrayBuffer, words?: StreamWords) => {
    const head = headRef.current;
    if (!head) return;
    if (words?.words.length) onCaption?.({ type: 'append', words: words.words });
    head.streamAudio({
      audio: pcm16,
      words: words?.words,
      wtimes: words?.wtimes,
      wdurations: words?.wdurations,
    });
  }, [onCaption]);

  const resetCaption = useCallback(() => onCaption?.({ type: 'reset' }), [onCaption]);

  const streamInterrupt = useCallback(() => {
    headRef.current?.streamInterrupt?.();
  }, []);

  const streamStop = useCallback(() => {
    headRef.current?.streamStop?.();
    updateState('ready');
  }, [updateState]);

  const getAudioAnalyser = useCallback(() => {
    return (headRef.current?.audioAnalyzerNode as AnalyserNode | undefined) ?? null;
  }, []);

  useImperativeHandle(ref, () => ({
    speak,
    stop,
    isReady: () => Boolean(headRef.current),
    streamStart,
    streamAudio,
    streamInterrupt,
    streamStop,
    getAudioAnalyser,
    resetCaption,
  }), [speak, stop, streamStart, streamAudio, streamInterrupt, streamStop, getAudioAnalyser, resetCaption]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{ width: '100%', height: '100%', minHeight: 380 }}
      />

      {state === 'loading' && (
        <p style={overlay}>Loading your guide…</p>
      )}

      {state === 'error' && (
        <p style={{ ...overlay, color: '#E8A0A0' }}>
          {error ?? 'The avatar could not load.'} Continue in text below.
        </p>
      )}
    </div>
  );
});

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  margin: 0,
  fontSize: '0.9rem',
  color: 'rgba(244, 241, 234, 0.6)',
  pointerEvents: 'none',
};

export default TalkingAvatar;
