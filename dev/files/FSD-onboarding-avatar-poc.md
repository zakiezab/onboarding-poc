# Functional Specification — Onboarding Avatar Portal (POC)

| | |
|---|---|
| **Project** | New-hire onboarding portal with interactive voice guide |
| **Phase** | Proof of concept |
| **Owner** | Zakie, Mobizinc |
| **Version** | 0.2 — reflects the built POC |
| **Date** | 16 September 2026 |
| **Status** | Built and demoable. This revision documents what actually ships, superseding v0.1 (drafted before build) |

---

## 0. Revision note

v0.1 was written before build and described a 3D on-screen avatar, a plain
greeting screen, interrupt-to-advance controls, and a document corpus with no
live Q&A. The build diverged from that draft in several deliberate,
user-directed ways as the POC was demoed and iterated on. This revision
brings the document back in line with what exists. Section 15 lists every
material change from v0.1, with the reason for each.

## 1. Purpose

HR currently onboards every new hire through a manual sequence: provision
email, create the ServiceNow profile, set up Slack and Teams, then deliver a
live briefing covering company direction, vision, expectations and
department context. The briefing is substantially the same every time.

This POC tests one question: **can an interactive voice guide deliver the
repeatable part of that briefing well enough that a new hire finds it useful
and HR finds it accurate?**

It is a feasibility test, not a pilot. Nothing in this document is intended
to run against real hires without a subsequent hardening phase — see
[Real-product architecture](#real-product-and-knowledge-base-diagrams) for
what that phase would add.

## 2. Scope

### In scope

- A single-page onboarding walkthrough narrated by a voice guide (an
  audio-reactive orb, not an on-screen avatar — see section 6.3).
- A mock Microsoft-login screen standing in for a real per-hire invite link.
- Eight scripted beats covering welcome, accounts, company, how we work,
  department, people, first week, and support.
- Per-department content sourced from existing HR files.
- Reference material (video, slide deck, org chart, people cards) shown
  alongside narration, keyed per beat.
- A combined progress bar / stepper that fills as the walkthrough advances.
- Playback controls: start, repeat, continue.
- A live, two-way voice conversation the hire can start at any point to ask
  free-form questions, grounded in the same HR documents.

### Out of scope

| Excluded | Why | Deferred to |
|---|---|---|
| ServiceNow integration | API access not yet confirmed; not needed to test the premise | Phase 1 |
| Real Microsoft Entra ID login | POC uses a mock login screen with a hardcoded invite | Phase 1 |
| Slack / Teams provisioning checks | Not needed to test the premise | Phase 1 |
| Database and persistence | POC runs one seeded hire; no state survives reload | Phase 1 |
| Vector search / RAG | Corpus fits in the context window | When corpus exceeds ~100k tokens |
| Mobile optimisation | Demo runs on desktop; a mobile layout issue (control bar overflow) is known and unresolved | Phase 2 |
| Analytics, admin CMS, multi-tenancy | Not required to answer the question | Later |

## 3. Success criteria

The POC succeeds if all four hold:

1. **SC-1** The guide completes all eight beats with audio narration and
   synchronised captions, without manual intervention, twice consecutively.
2. **SC-2** HR reviews the script and confirms the content is accurate and
   complete enough to replace the equivalent portion of their live briefing.
3. **SC-3** Three test users, at least one a recent joiner, complete the
   walkthrough and report it as clearer than reading the documents.
4. **SC-4** Swapping in a different department's HR file changes the
   department beat with no code change.

If SC-1 fails, the finding is that the voice-guide approach is not viable on
this stack — that is a valid and useful outcome, not a project failure.

## 4. Users

| Role | Involvement in POC |
|---|---|
| New hire | Primary user. Watches and advances the walkthrough, may ask it questions live. |
| HR | Owns the script and department content. Reviews for accuracy. |
| Reviewer / stakeholder | Watches the demo, decides whether Phase 1 proceeds. |

## 5. Functional requirements

### Session

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The portal opens on a mock Microsoft-login screen naming the hire and department, standing in for a real per-hire invite link. | Must |
| FR-02 | After login, a gate screen states the expected duration and requires an explicit "Start onboarding" click. Audio must not begin until then — autoplay is prohibited by browser policy and must not be attempted. | Must |
| FR-03 | The hire record (name, role, department, manager, buddy, start date) is derived from a single hardcoded invite (name + department); manager name and role are looked up from a small in-memory department table, and buddy name is picked at random from a fixed list. No real lookup, no persistence. | Must |
| FR-04 | Hire values are interpolated into the spoken script at runtime. | Must |

### Walkthrough

| ID | Requirement | Priority |
|---|---|---|
| FR-05 | The script consists of ordered beats, each with spoken text, an optional mood, and an optional checklist item it completes. | Must |
| FR-06 | Each beat's full text is sent to text-to-speech as one clip, returned with word-level timestamps. | Must |
| FR-07 | Continue advances to the next beat and plays it. It is disabled while the current beat's audio is playing — a beat can no longer be interrupted mid-speech. | Must |
| FR-08 | The user can replay the current beat via Repeat. | Must |
| FR-09 | Both Repeat and Continue are disabled while audio is playing (`busy`), and both are also disabled while a live conversation (FR-23) is active. Continue is additionally disabled on the last beat. | Must |
| FR-10 | Words appear as an on-screen karaoke-style caption, each word highlighting as it is actually spoken (driven by TalkingHead's per-word playback callback, not a fixed timer). | Must |
| FR-11 | ~~Suggested per-beat question chips~~ — removed. Free-form questions are handled by the live conversation (FR-23) instead. | — |

FR-07 through FR-09 are a deliberate reversal of v0.1's FR-07/FR-09, which
allowed Continue to interrupt speech in progress. The user asked for the
opposite: a beat must finish speaking before the hire can move on, so at
most one beat's audio is ever in flight and there is no race between an
interrupted beat and the next one to guard against.

### Reference material

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | Each beat may specify a reference-panel variant — video, slide presentation, org chart, or people cards — shown full-bleed behind the progress bar and control bar while that beat plays. | Must |
| FR-13 | The welcome beat plays an auto-looping, muted intro video. | Must |
| FR-14 | The company and how-we-work beats show a slide presentation (a self-contained HTML deck embedded via iframe, kept in sync with the spoken content by hand). | Must |
| FR-15 | The department beat shows an org chart for the hire's department. | Must |
| FR-16 | The people beat shows cards for the hire's manager and buddy. | Must |

### Voice guide

| ID | Requirement | Priority |
|---|---|---|
| FR-17 | Mouth/lip-sync animation is computed from word-level timings returned with the audio (via the TalkingHead engine), not audio amplitude — but the engine's 3D avatar output is not rendered on screen. | Must |
| FR-18 | The on-screen guide is an audio-reactive orb: its scale and glow respond to the currently-playing audio level (scripted narration or, in live mode, the live agent's voice / the hire's own microphone). | Must |
| FR-19 | The orb scales up while the guide is actively speaking, with a fixed-duration transition, without affecting the layout or position of sibling controls. | Should |
| FR-20 | If narration fails to load or play, the walkthrough continues with the on-screen caption text so the session is never blocked purely by a voice failure. | Must |

### Content

| ID | Requirement | Priority |
|---|---|---|
| FR-21 | Department content is stored as one markdown file per department at a predictable path derived from the department name. | Must |
| FR-22 | Markdown formatting is stripped before synthesis; only the marked spoken section is read aloud. | Must |
| FR-23 | HR can mark a subsection for narration; unmarked content remains available as reference but is not spoken. | Must |
| FR-24 | A missing department file returns a clear error naming the expected path; the department beat's spoken line still plays without the file's content appended. | Must |

### Live conversation

| ID | Requirement | Priority |
|---|---|---|
| FR-25 | At any point after Start, the hire can open a live, two-way voice conversation with the guide. | Must |
| FR-26 | While live mode is active, the scripted walkthrough's reference panel, Repeat, and Continue are all suppressed/disabled — live mode owns the guide exclusively. | Must |
| FR-27 | The live agent's answers are grounded only in the same HR documents used for scripted content (the full onboarding script plus every department file plus company facts) — no hire-specific session context is threaded through yet (see section 15). | Must |
| FR-28 | The hire's own microphone level and the live agent's voice level both drive the orb, depending on who is currently speaking. | Should |

### Progress

| ID | Requirement | Priority |
|---|---|---|
| FR-29 | A single combined progress bar and 5-step stepper is visible throughout, showing percentage complete and marking each milestone as its beat finishes. This replaces v0.1's separate checklist rail and progress bar — the user asked for the duplication removed. | Must |
| FR-30 | Progress is in-memory only and resets on reload. | Must |

## 6. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Time from beat request to audio start | Under 800ms |
| NFR-02 | Render frame rate, desktop | 30fps sustained |
| NFR-03 | API keys never reach the browser, except the short-lived ElevenLabs signed WebSocket URL issued per live session | Absolute |
| NFR-04 | Total spoken runtime for the eight beats | 4–6 minutes |
| NFR-05 | Browser support | Latest Chrome and Edge only |
| NFR-06 | Viewport | Desktop only — a known bug clips the bottom control bar off-screen below ~375px width; not fixed in this POC |

## 6.3 Note on "avatar"

The project name and `TalkingAvatar.tsx` both predate a mid-build decision:
the 3D avatar is kept mounted (it still drives lip-sync timing and exposes
an audio analyser node) but is never rendered. The only guide the hire sees
is `VoiceOrb.tsx`, an audio-reactive CSS/SVG orb. This was a deliberate
visual simplification, not a fallback — see section 15.

## 7. Architecture (as built)

Four tiers: browser, Next.js server, and two external vendors used directly
over HTTP/WebSocket from route handlers or, for live conversation, from the
browser itself.

**Browser** — Next.js App Router page. `TalkingAvatar.tsx` runs
TalkingHead.js over Three.js *headless* (mounted, never displayed) purely as
the audio/lip-sync/timing engine for scripted beats; `VoiceOrb.tsx` is the
only visible guide, reading an `AnalyserNode` off either the avatar engine
(scripted narration) or the live conversation's own audio graph (live mode).
`RealtimeConversation.tsx` opens a WebSocket directly from the browser to
ElevenLabs' Conversational AI once it has a signed URL from the server.

**Next.js server** — six route handlers (section 9): TTS proxy, STT proxy
(currently unused by any caller), department-file reader, ElevenLabs
signed-URL issuer, the ElevenLabs Custom-LLM bridge to Claude, and a
scripted-Q&A endpoint (currently unused — its only caller was removed when
per-beat question chips were replaced by live conversation).

**External — ElevenLabs** — text-to-speech with word timestamps (scripted
beats), and the Conversational AI Agents Platform over a signed WebSocket
(live mode). The agent's dashboard "Custom LLM" setting points at this app's
own `/api/llm/chat/completions` route rather than an ElevenLabs-hosted
model.

**External — Anthropic** — Claude (`claude-sonnet-5`) answers live-mode
questions, called from `/api/llm/chat/completions`, which translates
ElevenLabs' OpenAI-shaped chat-completions request into an Anthropic
`messages.stream` call and translates the response back to SSE chunks.

No database. No authentication (a mock login screen stands in for one).

### Key design decisions

| Decision | Rationale | Revisit when |
|---|---|---|
| HTTP timestamps endpoint for scripted beats, WebSocket for live mode | Scripted playback tolerates HTTP latency and needs no duplex channel; live conversation genuinely needs one, so it gets a real WebSocket rather than forcing everything through one transport | — |
| Hidden 3D avatar, visible orb | User-directed visual simplification after seeing the avatar rendered; the avatar engine's timing/lip-sync output is still the thing driving both the caption and (outside live mode) the orb, so it stayed mounted rather than being torn out | If a rendered avatar is wanted again, `TalkingAvatar.tsx`'s stage className is already there |
| Full documents in context, no retrieval | Corpus is small; removes a subsystem and gives better answers than chunked retrieval | Corpus exceeds the context window |
| Mock login instead of a seeded constant with a plain greeting | Demoing to stakeholders benefited from a screen that reads as "this is how a hire would actually get in," even though it's a hardcoded invite underneath | Phase 1, when a real Entra ID login replaces the mock |
| Continue cannot interrupt speech | User-directed reversal of v0.1: a beat must finish before advancing | — |
| `eleven_turbo_v2_5` | Lower latency, and supports the timestamp endpoints that `eleven_v3` does not | Only if lip-sync/caption quality proves inadequate |
| ElevenLabs Conversational AI with a Custom LLM pointed at Claude | Keeps content grounding, system-prompt rules, and document loading in this app's own code rather than duplicated in the ElevenLabs dashboard | — |

## 8. Data

### Hire record

Derived at login time from a hardcoded invite name + department
(`INVITE_NAME`, `INVITE_DEPARTMENT` in `app/page.tsx`), looked up against
`lib/session-seed.ts`'s department table for role/manager, with a buddy name
chosen at random from a fixed list.

| Field | Type | Example (current invite) |
|---|---|---|
| firstName | string | Tom John |
| role | string | a new team member |
| department | string | Creative & Multimedia |
| managerName | string | Zakie Zabar |
| buddyName | string | one of Priya / Danish / Mei Ling / Hakim, chosen at random |
| startDate | string | 14 September 2026 |

`role` is phrased to read naturally inside a spoken sentence. Manager names
are sourced from the actual HR documents where one is named for that
department (see `lib/session-seed.ts` for the per-department sourcing
notes); otherwise a role-title placeholder is used, never an invented name.

### Beat

Unchanged from v0.1: `id`, `label`, `say(hire) → string`, optional `mood`,
`completes`, `prompts` (now unused — see FR-11), `departmentSlot`.

### Department file

One markdown file per department, narrated section delimited by
`<!-- spoken -->` markers, 150–250 spoken words.

## 9. Interfaces

### POST /api/tts

Unchanged from v0.1. Proxies ElevenLabs `with-timestamps`, prefers
`normalized_alignment`. **Response** `{ audio, words, wtimes, wdurations }`.

### GET /api/department?name=

Unchanged from v0.1. **Response** `{ department, spoken, raw }`.

### POST /api/stt

Proxies ElevenLabs speech-to-text (`scribe_v2`). **Currently has no caller**
— live conversation uses ElevenLabs' own realtime STT inside the
Conversational AI WebSocket instead of this route. Kept for a possible
push-to-talk flow that doesn't use the agent platform.

**Request** multipart/form-data, field `audio`. **Response** `{ text }`.

### GET /api/conversation/signed-url

New in this build. Issues a short-lived signed WebSocket URL so the browser
can open ElevenLabs' Conversational AI session directly, without the
`ELEVENLABS_API_KEY` ever reaching the browser.

**Response** `{ signedUrl: string }`. **Errors** — 500 on missing
`ELEVENLABS_API_KEY`/`ELEVENLABS_AGENT_ID`, 502 on upstream failure.

### POST /api/llm/chat/completions

New in this build. The "Custom LLM" ElevenLabs' agent calls mid-conversation
— must speak OpenAI's chat-completions wire format (including SSE framing)
because that is the only contract the agent platform knows how to call.
Loads the full onboarding script, all department files, and company facts
on every call (no per-hire session binding yet — see section 15), builds
the system prompt via `buildSystemPrompt`, and streams a Claude
(`claude-sonnet-5`) response back as `chat.completion.chunk` SSE events.

**Request** `{ messages: {role, content}[], stream: true }` (only
`stream: true` is supported). **Errors** — 400 on a malformed body or
`stream` not `true`, 500 on missing `ANTHROPIC_API_KEY`.

### POST /api/chat

Unchanged from v0.1's scripted-Q&A design. **Currently has no caller** — its
only caller (follow-up question chips) was removed when free-form live
conversation replaced them. Kept in the repo, not wired into the current UI.

## 10. Error handling

| Condition | Behaviour |
|---|---|
| ElevenLabs TTS unavailable | Beat's caption text still renders; walkthrough continues without audio |
| Alignment missing from TTS response | Treated as a failure, not fallback to amplitude lip-sync |
| Department file missing | Department beat's fixed line still plays; file-derived content is simply not appended; error logged with the expected path |
| ElevenLabs Conversational AI WebSocket unavailable | Live mode cannot start; scripted walkthrough is unaffected since it does not depend on this path |
| Audio decode failure | Handled by the browser's audio pipeline; not specially guarded in this POC |

The principle carried over from v0.1: the walkthrough should always be able
to reach the end even if a voice-related subsystem degrades.

## 11. Security and privacy

- `ELEVENLABS_API_KEY` and `ANTHROPIC_API_KEY` are read only by server-side
  route handlers and are never sent to the browser. The one exception by
  design is the signed WebSocket URL from `/api/conversation/signed-url`,
  which is short-lived and scoped by ElevenLabs, not the raw key.
- The POC contains no real personal data. The current seeded hire (Tom
  John / Creative & Multimedia) is fictional.
- Sentence text is sent to ElevenLabs for TTS; live-conversation audio and
  transcripts pass through ElevenLabs' Conversational AI and Anthropic's
  API. Before any pilot with real hires, confirm both vendors' retention
  terms against PDPA obligations and document the answer.
- Transcript logging is not implemented in the POC, for either the scripted
  walkthrough or live conversation.

## 12. Assumptions and dependencies

| # | Assumption | Risk if wrong |
|---|---|---|
| A-1 | TalkingHead.js's timing/lip-sync engine is usable purely headless (never rendered) | Low — already proven in this build |
| A-2 | HR provides department files within week 1 | Working guide with nothing department-specific to say |
| A-3 | HR will review and approve the script wording | Content may be inaccurate in the demo |
| A-4 | ElevenLabs Conversational AI Agent stays in **Published** state in the dashboard | Live mode silently fails to connect — confirmed root cause of a past bug in this build |
| A-5 | ElevenLabs latency (TTS and Conversational AI) is acceptable for both scripted playback and live conversation | Falls back to pre-generated audio files for scripted beats; live mode has no fallback |

## 13. Acceptance test

1. Start the dev server with valid environment variables (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`, `ANTHROPIC_API_KEY`).
2. `POST /api/tts` with a test sentence returns non-empty `words` and `wtimes`.
3. `GET /api/department?name=Creative & Multimedia` returns `spoken` prose containing no markdown characters.
4. Open the onboarding page. The mock Microsoft-login screen shows the invited hire's name and department. No audio plays.
5. Click through login. The gate screen shows the hire's first name. Click "Start onboarding."
6. The welcome beat plays; the intro video autoplays and loops in the reference panel; captions highlight word by word in time with audio.
7. Continue and Repeat are both disabled while audio plays, and re-enable once it finishes.
8. Advance through all eight beats. The stepper marks each milestone at the right point and the percentage updates.
9. Open live conversation. Ask a question covered by an HR document; the agent answers from it. Ask something outside the documents; the agent declines and points to a human.
10. Close live conversation; scripted controls (Repeat/Continue) are usable again.
11. Replace `content/departments/creative-multimedia.md` with different content. Reload, log in, and reach the department beat. It speaks the new content. No code changed.
12. Rename the department file so it is missing. Reload and reach that beat. The session completes without crashing; the fixed line still plays.

## 14. Phase 1 (not this build)

<a id="real-product-and-knowledge-base-diagrams"></a>
See the accompanying architecture diagrams (published separately) for the
full Phase 1 plan: real ServiceNow-triggered onboarding, real Microsoft
Entra ID login with automatic department/manager/team resolution, and a
knowledge-base retrieval strategy for HR documents. In FSD terms, Phase 1
adds: real ServiceNow read integration for provisioning status and org
data; real Entra ID authentication; a hire-specific session bound into live
conversation (closing the FR-27 gap); transcript logging and an
unanswered-question report for HR; an HR-editable content source replacing
repo markdown; mobile support; a persistence layer.

## 15. Changes from v0.1

Recorded so a reviewer who only knows v0.1 can see what moved and why.

| Area | v0.1 | v0.2 (built) | Why |
|---|---|---|---|
| Visible guide | 3D avatar on screen | Audio-reactive orb; avatar engine kept headless for its timing/analyser output | User-directed visual simplification mid-build |
| Session start | Plain greeting screen naming the hire | Mock Microsoft-login screen, then a gate screen | Demo benefited from a login step that reads as a real per-hire invite |
| Continue button | Interrupts speech in progress (FR-07/FR-09) | Disabled until the current beat's audio finishes; cannot interrupt | Explicit user request, reversing the original design |
| Progress UI | Separate checklist rail + progress bar | One combined progress bar / stepper | User flagged the two as redundant |
| Voice input / live Q&A | Out of scope; question chips only as a non-functional affordance | Built: full two-way ElevenLabs Conversational AI session with a Claude-backed Custom LLM | Chips were removed; live conversation replaced them |
| Reference material | Not specified | Video / slide deck / org chart / people cards shown per beat in a dedicated panel | Added to make each beat visually concrete |
| External systems | "No external systems beyond the voice vendor," "No WebSocket" | Anthropic Claude is a second external system; ElevenLabs Conversational AI is WebSocket-based | Live conversation required both |
| Mobile | Out of scope, not tested | Out of scope, and now confirmed broken (control bar overflows at 375px) | Tested during this build; fix not yet scheduled |

---

## Sign-off

| Role | Name | Approves | Date |
|---|---|---|---|
| Build owner | Zakie | Sections 5–10 | |
| HR | | Sections 3, 8 (content), 11 | |
| Stakeholder | | Sections 2, 3, 14 | |
