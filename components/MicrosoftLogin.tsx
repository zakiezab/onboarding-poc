'use client';

import { theme as t, radius } from '@/lib/theme';

type Props = {
  /** Mimics a unique per-hire HR invite link: the name and department are
   *  already resolved before this screen renders, not collected here. */
  firstName: string;
  department: string;
  onLogin: () => void;
};

/** Cosmetic only — no real auth, no credentials. Clicking just proceeds. */
export default function MicrosoftLogin({ firstName, department, onLogin }: Props) {
  return (
    <div style={s.wrap}>
      <h1 style={s.title}>You&apos;re invited, {firstName}.</h1>
      <p style={s.body}>
        This link is yours — it already knows you&apos;re joining {department}. Sign in to continue.
      </p>
      <button type="button" onClick={onLogin} style={s.msButton} className="btn-ms">
        <MicrosoftLogo />
        Login using Microsoft
      </button>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.85rem',
    padding: '2.75rem',
    textAlign: 'center',
    // A vignette centered on the text rather than the old bottom-heavy
    // fade — legible over whatever reference content is behind it either way.
    background:
      'radial-gradient(560px circle at center, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.55) 55%, rgba(8,8,10,0.15) 100%)',
  },
  title: {
    fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: '-0.015em',
    color: t.text,
  },
  body: { margin: 0, maxWidth: '44ch', fontSize: '0.95rem', lineHeight: 1.6, color: t.textMuted },
  msButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.65rem',
    borderRadius: radius.sm,
    padding: '0.75rem 1.35rem',
    fontSize: '0.9rem',
  },
};
