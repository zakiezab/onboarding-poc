'use client';

import type { Hire } from '@/lib/onboarding-script';
import { theme as t, radius } from '@/lib/theme';
import OrgChartFlow from '@/components/OrgChartFlow';

// 'presentation' embeds a standalone HTML deck (see public/reference/) rather
// than a React-rendered one — a deliberately swappable slot: replace that
// file, or point the iframe at a different src, and nothing here changes.
export type ReferenceVariant = 'presentation' | 'video' | 'org-chart' | 'people' | null;

type Props = {
  variant: ReferenceVariant;
  hire: Hire | null;
};

export default function ReferencePanel({ variant, hire }: Props) {
  return (
    <div style={s.panel}>
      {variant === 'presentation' && (
        <iframe
          src="/reference/mobizinc-overview.html"
          title="Mobizinc overview"
          style={s.iframe}
        />
      )}
      {variant === 'video' && (
        // autoPlay requires muted — browsers block unmuted autoplay outright,
        // and there's no user gesture on this screen to unlock it with.
        <video
          src="/media/hero_showreel_2608_small.mp4"
          style={s.video}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {variant === 'org-chart' && hire && <OrgChartFlow hire={hire} />}
      {variant === 'people' && hire && <PeopleCard hire={hire} />}
      {(!variant || (variant !== 'presentation' && variant !== 'video' && !hire)) && <Idle />}
    </div>
  );
}

function Idle() {
  return (
    <div style={s.idle}>
      <span style={s.idleLabel}>Reference</span>
      <p style={s.idleBody}>Slides, org charts, and other material will show up here as the guide talks.</p>
    </div>
  );
}

function PeopleCard({ hire }: { hire: Hire }) {
  return (
    <div style={s.centered}>
      <span style={s.paneLabel}>Your people</span>
      <div style={s.peopleGrid}>
        <div style={s.personCard}>
          <span style={s.personAvatar}>{initials(hire.managerName)}</span>
          <span style={s.personName}>{hire.managerName}</span>
          <span style={s.personRole}>Manager</span>
        </div>
        <div style={s.personCard}>
          <span style={s.personAvatar}>{initials(hire.buddyName)}</span>
          <span style={s.personName}>{hire.buddyName}</span>
          <span style={s.personRole}>Buddy</span>
        </div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .replace(/^Your\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const s: Record<string, React.CSSProperties> = {
  // Absolute + inset:0, matching MicrosoftLogin/the gate screen (its
  // siblings in page.tsx's middleArea) — that resolves against the parent's
  // actual laid-out size even though the parent's own height comes from
  // flex-grow rather than a literal height, where a percentage height in
  // normal flow (what this used before) doesn't reliably resolve and let the
  // iframe's intrinsic size push past the parent instead.
  panel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  idle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    textAlign: 'center',
    padding: '0 2rem',
  },
  idleLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: t.textFaint,
  },
  idleBody: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: t.textMuted,
    maxWidth: '32ch',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
  },
  paneLabel: {
    fontSize: '0.74rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: t.textFaint,
  },
  peopleGrid: { display: 'flex', gap: '1.5rem' },
  personCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    border: `1px solid ${t.border}`,
    borderRadius: radius.md,
    padding: '1.5rem 2.25rem',
    background: t.bgElevated,
  },
  personAvatar: {
    width: '3.4rem',
    height: '3.4rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: t.redDim,
    color: t.redSoft,
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  personName: { fontSize: '1rem', fontWeight: 600, color: t.text, textAlign: 'center' },
  personRole: { fontSize: '0.76rem', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' },
};
