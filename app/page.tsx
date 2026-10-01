'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TalkingAvatar, {
  type TalkingAvatarHandle,
  type AvatarState,
  type CaptionWord,
  type CaptionAction,
} from '@/components/TalkingAvatar';
import MicrosoftLogin from '@/components/MicrosoftLogin';
import ReferencePanel, { type ReferenceVariant } from '@/components/ReferencePanel';
import RealtimeConversation from '@/components/RealtimeConversation';
import VoiceOrb from '@/components/VoiceOrb';
import SpeechCaption from '@/components/SpeechCaption';
import { LightRays } from '@/registry/magicui/light-rays';
import { CHECKLIST, SCRIPT, type Hire } from '@/lib/onboarding-script';
import { DEPARTMENTS, randomBuddyName } from '@/lib/session-seed';
import { theme as t, radius } from '@/lib/theme';

// Which reference material (if any) accompanies each beat. See
// components/ReferencePanel.tsx and lib/department-visuals.ts.
const PANEL_VISUALS: Record<string, ReferenceVariant> = {
  welcome: 'video',
  company: 'presentation',
  'how-we-work': 'presentation',
  department: 'org-chart',
  people: 'people',
};

const AVATAR_URL = '/avatars/guide.glb';

function ReloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5v14l10-7-10-7z" fill="currentColor" />
      <path d="M18 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="spin-icon">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Mimics a unique per-hire HR invite link, which already knows who's
// opening it — so there's no spoken/typed name capture or department picker
// (see MicrosoftLogin). Scoped to this one hire for now; a real link would
// decode this instead of hardcoding it.
const INVITE_NAME = 'Tom John';
const INVITE_DEPARTMENT = 'Creative & Multimedia';

export default function OnboardingPage() {
  const avatarRef = useRef<TalkingAvatarHandle>(null);

  // Set once the (mock) Microsoft login on MicrosoftLogin completes. Null
  // until then — same gate the rest of the page already used when this came
  // from SessionSetup instead.
  const [hire, setHire] = useState<Hire | null>(null);

  const [started, setStarted] = useState(false);
  // True from the "Start onboarding" click until the first beat's audio
  // actually begins — covers the TTS fetch/decode that used to happen
  // silently behind the just-revealed (and otherwise static-looking) main
  // screen. Scoped to the very first beat only: Skip already communicates
  // "busy" for every beat after that.
  const [preparing, setPreparing] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // True while RealtimeConversation owns the avatar — the scripted walkthrough
  // pauses its own controls rather than fighting it for control of the avatar.
  const [liveMode, setLiveMode] = useState(false);
  // Live mode shows an audio-reactive orb instead of the 3D avatar (kept
  // mounted underneath — audio playback and lip-sync state live there
  // regardless of whether its container is visible). Unifying the two is a
  // later pass, not this one.
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  // What the live voice bot last asked to show (via its show_reference client
  // tool) — a separate signal from PANEL_VISUALS, which is tied to the
  // scripted beat and doesn't apply once live mode takes over. Reset on
  // every fresh live session so a stale chart from last time doesn't linger.
  const [liveReferenceVariant, setLiveReferenceVariant] = useState<ReferenceVariant>(null);
  const handleLiveChange = useCallback((live: boolean) => {
    console.log('[debug] liveMode ->', live);
    setLiveMode(live);
    if (live) setLiveReferenceVariant(null);
  }, []);
  const handleShowReference = useCallback((variant: ReferenceVariant) => {
    console.log('[debug] liveReferenceVariant ->', variant);
    setLiveReferenceVariant(variant);
  }, []);

  // The 3D avatar stays mounted (for its audio/lip-sync engine — TTS
  // playback and the orb's analyser both come from it) but is never shown;
  // the orb is the only on-screen guide now. Outside live mode, its own
  // speaking/ready state is the only signal we have for "is the guide
  // talking right now", so it drives the orb. In live mode, RealtimeConversation
  // already reports that per-utterance from the websocket (finer-grained
  // than the avatar's own session-level state), so this must defer to it
  // rather than fight it — hence the ref instead of a closed-over liveMode.
  const liveModeRef = useRef(liveMode);
  useEffect(() => {
    liveModeRef.current = liveMode;
  }, [liveMode]);
  const handleAvatarStateChange = useCallback((avatarState: AvatarState) => {
    if (!liveModeRef.current) setAgentSpeaking(avatarState === 'speaking');
  }, []);

  // Karaoke-style caption line under the orb. Driven entirely by the actions
  // TalkingAvatar emits (see its onCaption) — 'append' queues newly-known
  // words as unspoken, 'advance' promotes the next unspoken word once
  // TalkingHead's own per-word callback says playback has reached it.
  const [captionWords, setCaptionWords] = useState<CaptionWord[]>([]);
  // Set just before the very first playBeat() call (see start()) and
  // consumed the moment speak() actually has audio ready to play — TalkingAvatar
  // fires its 'append' caption action right before calling head.speakAudio(),
  // which is the earliest reliable "audio is about to start" signal it
  // exposes. That's when the gate screen hands off to the main view, instead
  // of on the click itself.
  const revealOnSpeechRef = useRef(false);
  const handleCaption = useCallback((action: CaptionAction) => {
    if (action.type === 'append' && revealOnSpeechRef.current) {
      revealOnSpeechRef.current = false;
      setPreparing(false);
      setStarted(true);
    }
    setCaptionWords((prev) => {
      switch (action.type) {
        case 'reset':
          return [];
        case 'append':
          return [...prev, ...action.words.map((text) => ({ text, spoken: false }))];
        case 'advance': {
          const idx = prev.findIndex((w) => !w.spoken);
          if (idx === -1) return prev;
          const next = prev.slice();
          next[idx] = { ...next[idx], spoken: true };
          return next;
        }
        default:
          return prev;
      }
    });
  }, []);

  // Stands in for decoding the invite link — see INVITE_NAME/INVITE_DEPARTMENT.
  const handleLogin = useCallback(() => {
    const dept = DEPARTMENTS.find((d) => d.label === INVITE_DEPARTMENT);
    setHire({
      firstName: INVITE_NAME,
      role: dept?.role ?? 'a new team member',
      department: INVITE_DEPARTMENT,
      managerName: dept?.managerName ?? 'Your Team Lead',
      buddyName: randomBuddyName(),
      startDate: '14 September 2026',
    });
  }, []);

  const beat = SCRIPT[beatIndex];
  const isLast = beatIndex === SCRIPT.length - 1;

  // The Skip button lets next() fire a new playBeat while a previous one is
  // still in flight (interrupted mid-speech). Bumped on every playBeat call
  // so a stale call's post-await continuation — which stopped early thanks
  // to TalkingAvatar's own speakStopRef, but on the *old* beat's line — can
  // tell it's been superseded and skip marking its (unfinished) section done
  // or clearing busy out from under the new one.
  const beatRunIdRef = useRef(0);

  const playBeat = useCallback(async (index: number) => {
    if (!hire) return;
    const target = SCRIPT[index];
    if (!target) return;

    const runId = ++beatRunIdRef.current;
    setBusy(true);

    let line = target.say(hire);

    // Department slot: the HR file for this department is read aloud here.
    if (target.departmentSlot) {
      const res = await fetch(`/api/department?name=${encodeURIComponent(hire.department)}`);
      if (res.ok) {
        const { spoken } = (await res.json()) as { spoken: string };
        line = `${line} ${spoken}`;
      }
    }

    await avatarRef.current?.speak(line, target.mood);

    if (runId !== beatRunIdRef.current) return; // superseded by Skip — don't mark it done

    if (target.completes) {
      setDone((prev) => (prev.includes(target.completes!) ? prev : [...prev, target.completes!]));
    }
    setBusy(false);
  }, [hire]);

  const start = useCallback(async () => {
    // Browsers block audio until a user gesture, so the session must begin
    // behind this button. Do not autoplay on mount. The button itself shows
    // a loading state until handleCaption's 'append' check flips `started`
    // — see revealOnSpeechRef above.
    setPreparing(true);
    revealOnSpeechRef.current = true;
    await playBeat(0);
    // Safety net: if speak() never produced an 'append' (e.g. the TTS call
    // failed before returning any words), don't strand the user on a
    // stuck loading button — fall through to the main view regardless.
    revealOnSpeechRef.current = false;
    setPreparing(false);
    setStarted(true);
  }, [playBeat]);

  const next = useCallback(async () => {
    avatarRef.current?.stop();
    const nextIndex = Math.min(beatIndex + 1, SCRIPT.length - 1);
    setBeatIndex(nextIndex);
    await playBeat(nextIndex);
  }, [beatIndex, playBeat]);

  const repeat = useCallback(() => playBeat(beatIndex), [beatIndex, playBeat]);

  const progress = Math.round((done.length / CHECKLIST.length) * 100);

  return (
    <main style={s.page}>
      <div style={s.pageBackground}>
        <LightRays color="rgba(255, 59, 48, 0.22)" />
      </div>

      <div style={s.shell}>
        <header style={s.header}>
          <div style={s.brand}>
            <span style={s.brandDot} />
            <span style={s.wordmark}>Mobizinc</span>
          </div>
          <span style={s.day}>Day one &nbsp;·&nbsp; {hire?.startDate ?? '14 September 2026'}</span>
        </header>

        {/* One panel: the reference/media area fills it edge to edge, and
            the progress strip + control bar float on top of that as
            absolutely-positioned overlays, not rows sharing the space with
            it. See the wireframe this replaced it with. */}
        <section style={s.bigPanel}>
          {!hire && (
            <MicrosoftLogin
              firstName={INVITE_NAME}
              department={INVITE_DEPARTMENT}
              onLogin={handleLogin}
            />
          )}

          {hire && !started && (
            <div style={s.gate}>
              <h1 style={s.gateTitle}>Good morning, {hire.firstName}.</h1>
              <p style={s.gateBody}>
                Your accounts are ready. Your guide will walk you through the rest —
                about fifteen minutes, with sound.
              </p>
              <button
                type="button"
                onClick={start}
                disabled={preparing}
                style={preparing ? { ...s.primaryButton, opacity: 1 } : s.primaryButton}
                className="btn-primary"
              >
                {preparing ? (
                  <>
                    <SpinnerIcon />
                    Preparing your guide…
                  </>
                ) : (
                  'Start onboarding'
                )}
              </button>
            </div>
          )}

          {hire && started && (
            <ReferencePanel
              variant={liveMode ? liveReferenceVariant : (PANEL_VISUALS[beat.id] ?? null)}
              hire={hire}
            />
          )}

          <div style={s.progressBar}>
            <div style={s.progressHead}>
              <span style={s.progressLabel}>Progress</span>
              <span style={s.progressValue}>{progress}%</span>
            </div>

            {/* The stepper's own connectors are the progress bar now — a
                separate smooth track next to it duplicated the same number.
                The five milestones are the sidebar checklist used to list —
                same titles, now as a stepper instead of a vertical list. Each dot
                sits centered in its column, on top of a connector split into
                a before/after half (transparent at the very first/last edge)
                rather than one line that only follows the dot — that was
                what pinned the dot to the left instead of centering it. */}
            <ol style={s.stepper}>
              {CHECKLIST.map((item, i) => {
                const complete = done.includes(item.id);
                const prevComplete = i > 0 && done.includes(CHECKLIST[i - 1].id);
                return (
                  <li key={item.id} style={s.step}>
                    <div style={s.stepRow}>
                      <span
                        style={{
                          ...s.stepConnector,
                          background: i === 0 ? 'transparent' : prevComplete ? t.red : t.border,
                        }}
                      />
                      <span style={complete ? s.stepDotDone : s.stepDot} />
                      <span
                        style={{
                          ...s.stepConnector,
                          background:
                            i === CHECKLIST.length - 1 ? 'transparent' : complete ? t.red : t.border,
                        }}
                      />
                    </div>
                    <span style={{ ...s.stepLabel, color: complete ? t.text : t.textFaint }}>
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div style={s.bottomBar}>
            {/* Kept mounted but never shown — the orb is the only visible guide
                now, but this still owns the audio/lip-sync engine (TTS playback,
                the streaming session, and the analyser node the orb reads from).
                See components/TalkingAvatar.tsx if the 3D avatar is reintroduced later. */}
            <div style={s.hiddenAvatar}>
              <TalkingAvatar
                ref={avatarRef}
                avatarUrl={AVATAR_URL}
                onStateChange={handleAvatarStateChange}
                onCaption={handleCaption}
                className="avatar-stage"
              />
            </div>

            <VoiceOrb avatarRef={avatarRef} micAnalyser={micAnalyser} agentSpeaking={agentSpeaking} size={88} />

            <div style={s.captionSlot}>
              <SpeechCaption words={captionWords} />
            </div>

            {started && (
              <RealtimeConversation
                avatarRef={avatarRef}
                onLiveChange={handleLiveChange}
                onMicAnalyser={setMicAnalyser}
                onAgentSpeakingChange={setAgentSpeaking}
                onShowReference={handleShowReference}
              />
            )}

            {started && (
              <button
                type="button"
                onClick={repeat}
                disabled={busy || liveMode}
                style={s.iconButton}
                className="btn-ghost"
                aria-label="Say that again"
                title="Say that again"
              >
                <ReloadIcon />
              </button>
            )}

            {started && (
              <button
                type="button"
                onClick={next}
                disabled={isLast || liveMode}
                style={s.primaryButton}
                className="btn-primary"
              >
                {isLast ? 'Finished' : busy ? (
                  <>
                    Skip
                    <SkipIcon />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  // No side padding and a full-height flex column — the shell and the panel
  // both now go edge to edge; only the header keeps its own inset so its
  // text isn't flush against the viewport edge.
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: t.text,
  },
  // Pinned to the viewport rather than the page, so the glow stays put
  // under the content instead of scrolling away with it.
  pageBackground: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  // No maxWidth/margin — previously this centered a 1180px-wide column;
  // the panel below is meant to fill the full page now, so this just needs
  // to stack header + panel and stay above pageBackground.
  shell: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: `1px solid ${t.border}`,
    flexShrink: 0,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: t.red,
    boxShadow: `0 0 12px ${t.redGlow}`,
  },
  wordmark: {
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  day: { fontSize: '0.82rem', color: t.textFaint, letterSpacing: '0.01em' },
  // The reference/media content (MicrosoftLogin, the gate, or ReferencePanel
  // — each fills this via its own position:absolute;inset:0) sits directly
  // in this container, full bleed. The progress strip and control bar are
  // separate absolutely-positioned overlays on top of that, not rows that
  // share the space with it — hence position:relative here and no
  // flex/padding of its own. flex:1 (not a fixed minHeight) fills the rest
  // of the viewport below the header — 100% width and height of the page.
  bigPanel: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    // card-surface's fill, without the border that came with the class —
    // rarely seen anyway since MicrosoftLogin/the gate/ReferencePanel all
    // cover this completely, but it's the fallback if one of them doesn't.
    background: t.bgCard,
  },
  // Floating overlays need their own background — unlike the old in-flow
  // bars, whatever's behind them now is reference content (an iframe slide,
  // an org chart...), not a predictable plain surface, so a border alone
  // would leave the text sitting on top of it illegibly. Inset 20% left/right
  // (not a fixed rem) so both bars sit at ~60% width, centered, regardless
  // of the panel's own width.
  progressBar: {
    position: 'absolute',
    top: '1.25rem',
    left: '20%',
    right: '20%',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
    padding: '1.1rem 1.5rem 1.25rem',
    // Increased from radius.md — these float as their own cards now, not
    // in-flow bars, so a more generous curve reads better at that scale.
    borderRadius: 24,
    border: `1px solid ${t.border}`,
    background: 'rgba(8, 8, 10, 0.82)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  progressHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: t.textFaint,
    flexShrink: 0,
  },
  // The five milestones the old sidebar checklist listed vertically — same
  // CHECKLIST data and titles, laid out as a stepper instead.
  stepper: { display: 'flex', listStyle: 'none', margin: 0, padding: 0 },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  stepRow: { display: 'flex', alignItems: 'center', width: '100%' },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    border: `1.5px solid ${t.textFaint}`,
    flexShrink: 0,
  },
  stepDotDone: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: t.red,
    boxShadow: `0 0 8px ${t.redGlow}`,
    flexShrink: 0,
  },
  stepConnector: { flex: 1, height: 2, borderRadius: 999 },
  stepLabel: {
    fontSize: '0.72rem',
    lineHeight: 1.3,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    transition: 'color 200ms ease',
  },
  bottomBar: {
    position: 'absolute',
    // Increased from 1.25rem.
    bottom: '2.5rem',
    left: '20%',
    right: '20%',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '1.1rem',
    // Increased from 1rem 1.25rem.
    padding: '1.5rem 2rem',
    // Increased from radius.md — matches the progress bar above.
    borderRadius: 24,
    border: `1px solid ${t.border}`,
    // A red-tinted diagonal sweep instead of a flat fill, lower alpha
    // throughout than the progress bar's, and more blur — the orb card is
    // meant to feel like glass over the reference content, not a solid panel.
    background:
      'linear-gradient(135deg, rgba(255, 59, 48, 0.22) 0%, rgba(17, 17, 20, 0.55) 45%, rgba(8, 8, 10, 0.6) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  // TalkingHead still needs real pixel dimensions to initialise against (see
  // its own internal minHeight) even though nothing here is ever shown —
  // position:absolute pulls it out of the bottom bar's flex flow so that
  // doesn't add unwanted height to the row.
  hiddenAvatar: {
    visibility: 'hidden',
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
  captionSlot: { flex: 1, minWidth: 0 },
  gate: {
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
  gateTitle: {
    fontSize: 'clamp(1.65rem, 3vw, 2.25rem)',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: '-0.015em',
  },
  gateBody: {
    margin: 0,
    maxWidth: '42ch',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: t.textMuted,
  },
  progressValue: { fontSize: '0.82rem', fontWeight: 600, color: t.red, flexShrink: 0 },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderRadius: radius.sm,
    padding: '0.75rem 1.4rem',
    fontSize: '0.9rem',
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: radius.sm,
    flexShrink: 0,
  },
};
