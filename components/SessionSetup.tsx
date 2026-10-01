'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TalkingAvatarHandle } from '@/components/TalkingAvatar';
import { DEPARTMENTS, randomBuddyName } from '@/lib/session-seed';
import type { Hire } from '@/lib/onboarding-script';
import { theme as t, radius } from '@/lib/theme';

type Phase = 'name-record' | 'name-transcribing' | 'name-confirm' | 'name-type' | 'department';

type Props = {
  avatarRef: React.RefObject<TalkingAvatarHandle | null>;
  onComplete: (hire: Hire) => void;
};

export default function SessionSetup({ avatarRef, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('name-record');
  const [name, setName] = useState('');
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Guards against React Strict Mode's double effect invocation re-triggering speech.
  const spokenPhaseRef = useRef<Phase | null>(null);

  useEffect(() => {
    if (phase === 'name-confirm' && spokenPhaseRef.current !== 'name-confirm') {
      spokenPhaseRef.current = 'name-confirm';
      avatarRef.current?.speak(`Did I hear that right? I heard ${name}. Is that correct?`, 'neutral');
    }
    if (phase === 'department' && spokenPhaseRef.current !== 'department') {
      spokenPhaseRef.current = 'department';
      avatarRef.current?.speak('Great. Which department are you joining?', 'neutral');
    }
  }, [phase, name, avatarRef]);

  const transcribe = useCallback(async (blob: Blob) => {
    try {
      const form = new FormData();
      form.set('audio', blob, 'speech.webm');
      const res = await fetch('/api/stt', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`STT failed: ${res.status}`);
      const { text } = (await res.json()) as { text: string };
      setName(text);
      setPhase('name-confirm');
    } catch {
      setError("Didn't catch that. Try again, or type your name instead.");
      setPhase('name-record');
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void transcribe(new Blob(chunksRef.current, { type: 'audio/webm' }));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Couldn't access your microphone. Type your name instead.");
      setPhase('name-type');
    }
  }, [transcribe]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPhase('name-transcribing');
  }, []);

  const confirmYes = useCallback(() => setPhase('department'), []);
  const confirmNo = useCallback(() => {
    setTypedName(name);
    setPhase('name-type');
  }, [name]);

  const submitTyped = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!typedName.trim()) return;
      setName(typedName.trim());
      setPhase('department');
    },
    [typedName],
  );

  const pickDepartment = useCallback(
    (label: string, role: string, managerName: string) => {
      onComplete({
        firstName: name,
        role,
        department: label,
        managerName,
        buddyName: randomBuddyName(),
        startDate: '14 September 2026',
      });
    },
    [name, onComplete],
  );

  return (
    <div style={s.wrap}>
      {phase === 'name-record' && (
        <>
          <h1 style={s.title}>What&apos;s your name?</h1>
          <p style={s.body}>Tap the button and say your first name.</p>
          {error && <p style={s.error}>{error}</p>}
          <div style={s.controls}>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              style={s.primaryButton}
              className="btn-primary"
            >
              {recording && <span style={s.recDot} className="rec-dot" />}
              {recording ? 'Stop recording' : 'Record my name'}
            </button>
            <button
              type="button"
              onClick={() => setPhase('name-type')}
              style={s.ghostButton}
              className="btn-ghost"
            >
              Type it instead
            </button>
          </div>
        </>
      )}

      {phase === 'name-transcribing' && <p style={s.body}>Listening…</p>}

      {phase === 'name-confirm' && (
        <>
          <h1 style={s.title}>I heard &ldquo;{name}&rdquo;</h1>
          <p style={s.body}>Is that right?</p>
          <div style={s.controls}>
            <button type="button" onClick={confirmYes} style={s.primaryButton} className="btn-primary">
              Yes, that&apos;s right
            </button>
            <button type="button" onClick={confirmNo} style={s.ghostButton} className="btn-ghost">
              No, let me type it
            </button>
          </div>
        </>
      )}

      {phase === 'name-type' && (
        <form onSubmit={submitTyped} style={s.controls}>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Your first name"
            autoFocus
            style={s.input}
            className="ask-input"
          />
          <button type="submit" style={s.primaryButton} className="btn-primary">
            Continue
          </button>
        </form>
      )}

      {phase === 'department' && (
        <>
          <h1 style={s.title}>Which department are you joining?</h1>
          <div style={s.deptGrid}>
            {DEPARTMENTS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => pickDepartment(d.label, d.role, d.managerName)}
                style={s.deptButton}
                className="dept-btn"
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '0.85rem',
    padding: '2.75rem',
    background: 'linear-gradient(0deg, rgba(8,8,10,0.97) 30%, rgba(8,8,10,0.15) 100%)',
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
  error: { margin: 0, fontSize: '0.85rem', color: t.redSoft },
  controls: { display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' },
  primaryButton: {
    borderRadius: radius.sm,
    padding: '0.75rem 1.35rem',
    fontSize: '0.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.55rem',
  },
  ghostButton: {
    borderRadius: radius.sm,
    padding: '0.75rem 1.1rem',
    fontSize: '0.9rem',
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#fff',
  },
  input: {
    borderRadius: radius.sm,
    padding: '0.7rem 1rem',
    fontSize: '0.9rem',
    minWidth: '16rem',
  },
  deptGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem' },
  deptButton: {
    borderRadius: radius.sm,
    padding: '0.65rem 1.1rem',
    fontSize: '0.88rem',
  },
};
