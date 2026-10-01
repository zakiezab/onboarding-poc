'use client';

import { useEffect, useRef } from 'react';
import type { TalkingAvatarHandle } from '@/components/TalkingAvatar';

type Props = {
  avatarRef: React.RefObject<TalkingAvatarHandle | null>;
  /** Analyser tapped off the mic capture graph in RealtimeConversation — a
   *  second, genuinely separate audio path from the avatar's own playback,
   *  since mic input never goes through TalkingHead at all. */
  micAnalyser: AnalyserNode | null;
  /** Whether the agent is currently speaking (drives which analyser wins). */
  agentSpeaking: boolean;
  /** Diameter in pixels — sits inline wherever it's placed now (the bottom
   *  control bar), not centered in its own full-region overlay. */
  size?: number;
};

export default function VoiceOrb({ avatarRef, micAnalyser, agentSpeaking, size = 200 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  // Smoothed toward the raw level each frame so the orb settles rather than
  // jittering on every audio sample.
  const smoothedRef = useRef(0);

  useEffect(() => {
    const dataArray = new Uint8Array(128);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const analyser = agentSpeaking ? avatarRef.current?.getAudioAnalyser() : micAnalyser;
      const el = wrapRef.current;
      if (!el) return;

      let target = 0;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        target = Math.min(1, sum / dataArray.length / 90); // empirically scaled
      }

      // Slow, asymmetric smoothing: rises a bit faster than it falls, so the
      // orb still feels responsive to a new word starting but settles calmly
      // between them instead of flickering with every sample.
      const rate = target > smoothedRef.current ? 0.18 : 0.06;
      smoothedRef.current += (target - smoothedRef.current) * rate;
      el.style.setProperty('--level', smoothedRef.current.toFixed(3));
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [avatarRef, micAnalyser, agentSpeaking]);

  return (
    // transform, not width/height — it scales the rendered pixels without
    // touching the layout box, so the bottom bar's size and every sibling's
    // position (caption, mic, reload, continue) stay put while this grows.
    <div
      ref={wrapRef}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        transform: agentSpeaking ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="voice-orb-sphere" style={{ width: '100%', height: '100%' }}>
        <div className="voice-orb-swirl-a" />
        <div className="voice-orb-swirl-b" />
        <div className="voice-orb-highlight" />
        <div className="voice-orb-rim" />
      </div>
    </div>
  );
}
