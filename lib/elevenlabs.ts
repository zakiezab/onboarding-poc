/**
 * ElevenLabs returns CHARACTER-level alignment. TalkingHead wants WORD-level
 * timings. This module owns that conversion, plus the shared types.
 */

export type ElevenLabsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type ElevenLabsTimestampResponse = {
  audio_base64: string;
  alignment: ElevenLabsAlignment | null;
  normalized_alignment: ElevenLabsAlignment | null;
};

/** The shape TalkingHead's speakAudio() expects (times in milliseconds). */
export type WordTiming = {
  words: string[];
  wtimes: number[];
  wdurations: number[];
};

export type SpeechPayload = WordTiming & {
  /** base64-encoded mp3 */
  audio: string;
};

/**
 * Collapse character alignment into word alignment.
 *
 * Whitespace ends a word. Punctuation stays attached to the word it follows,
 * which matters: TalkingHead's lip-sync module reads the word text to pick
 * visemes, and a bare "," as its own entry produces a visible jaw twitch.
 */
export function toWordTimings(alignment: ElevenLabsAlignment): WordTiming {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  const words: string[] = [];
  const wtimes: number[] = [];
  const wdurations: number[] = [];

  let current = '';
  let startSec = 0;
  let endSec = 0;

  const flush = () => {
    if (!current) return;
    words.push(current);
    wtimes.push(Math.round(startSec * 1000));
    wdurations.push(Math.max(1, Math.round((endSec - startSec) * 1000)));
    current = '';
  };

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];

    if (/\s/.test(ch)) {
      flush();
      continue;
    }

    if (!current) startSec = character_start_times_seconds[i];
    current += ch;
    endSec = character_end_times_seconds[i];
  }

  flush();

  return { words, wtimes, wdurations };
}

/**
 * Realtime alignment shape from the Conversational AI WebSocket's
 * audio_event.alignment — same idea as ElevenLabsAlignment above, but
 * milliseconds + duration instead of seconds + start/end, because it's a
 * genuinely different endpoint (see docs/api-reference/agents-platform).
 */
export type RealtimeAlignment = {
  chars: string[];
  char_start_times_ms: number[];
  char_durations_ms: number[];
};

/** Same collapse as toWordTimings(), adapted for the realtime shape's units. */
export function toWordTimingsFromRealtimeAlignment(alignment: RealtimeAlignment): WordTiming {
  const { chars, char_start_times_ms, char_durations_ms } = alignment;

  const words: string[] = [];
  const wtimes: number[] = [];
  const wdurations: number[] = [];

  let current = '';
  let startMs = 0;
  let endMs = 0;

  const flush = () => {
    if (!current) return;
    words.push(current);
    wtimes.push(Math.round(startMs));
    wdurations.push(Math.max(1, Math.round(endMs - startMs)));
    current = '';
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (/\s/.test(ch)) {
      flush();
      continue;
    }

    if (!current) startMs = char_start_times_ms[i];
    current += ch;
    endMs = char_start_times_ms[i] + char_durations_ms[i];
  }

  flush();

  return { words, wtimes, wdurations };
}
