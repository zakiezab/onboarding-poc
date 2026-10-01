'use client';

import { useEffect, useRef } from 'react';
import type { CaptionWord } from '@/components/TalkingAvatar';
import { theme as t } from '@/lib/theme';

type Props = {
  /** Word-synced to playback — see TalkingAvatar's onCaption, driven by
   *  TalkingHead's own per-word callback, not a timer we'd guess the sync for. */
  words: CaptionWord[];
};

// Line height is set explicitly in rem (rather than a unitless multiplier)
// so this can size the viewport off it directly instead of guessing a pixel
// height that would drift if the font size ever changes.
const LINE_HEIGHT_REM = 1.65;
const VISIBLE_LINES = 2;

/** The single STT/transcript display — sits inline next to the orb in the
 *  bottom control bar (see page.tsx), not duplicated inside the orb itself.
 *  Capped to 2 lines: a beat's full passage can run well past that, so this
 *  auto-scrolls to keep whatever's currently being spoken in view instead of
 *  growing the bar or leaving the reader behind. */
export default function SpeechCaption({ words }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (words.length === 0) {
      // A new caption just started (see TalkingAvatar's onCaption 'reset') —
      // don't leave it scrolled to where the previous one ended.
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
      return;
    }
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [words]);

  // The *last* spoken word, not the first unspoken one — scrolls to reveal
  // what was just said rather than jumping ahead of the audio.
  const lastSpokenIndex = words.reduce((acc, w, i) => (w.spoken ? i : acc), -1);

  return (
    <div ref={viewportRef} style={s.viewport}>
      {words.length === 0 ? (
        <p style={s.line}>
          <span style={s.pending}>…</span>
        </p>
      ) : (
        <p style={s.line}>
          {words.map((w, i) => (
            <span
              key={i}
              ref={i === lastSpokenIndex ? activeRef : undefined}
              style={w.spoken ? s.spoken : s.pending}
            >
              {w.text}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  viewport: {
    width: '100%',
    height: `calc(${LINE_HEIGHT_REM}rem * ${VISIBLE_LINES})`,
    overflow: 'hidden',
  },
  line: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: `${LINE_HEIGHT_REM}rem`,
    textAlign: 'left',
  },
  spoken: { color: t.text, transition: 'color 200ms ease' },
  pending: { color: t.textFaint, transition: 'color 200ms ease' },
};
