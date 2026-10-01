import type { AvatarMood } from '@/components/TalkingAvatar';

export type Hire = {
  firstName: string;
  role: string;
  department: string;
  managerName: string;
  buddyName: string;
  startDate: string;
};

export type Beat = {
  id: string;
  /** Short label for the progress rail. */
  label: string;
  /** Written for the ear. Keep sentences under ~18 words. */
  say: (h: Hire) => string;
  mood?: AvatarMood;
  /** Marks a checklist item complete when this beat finishes. */
  completes?: string;
  /** Offered as tappable prompts while this beat is on screen. */
  prompts?: string[];
  /**
   * When true, the department markdown file is read aloud here instead of a
   * fixed line. See content/departments/<slug>.md
   */
  departmentSlot?: boolean;
};

export const CHECKLIST = [
  { id: 'accounts', label: 'Accounts and tools' },
  { id: 'company', label: 'How Mobizinc works' },
  { id: 'team', label: 'Your department' },
  { id: 'week-one', label: 'Your first week' },
  { id: 'support', label: 'Where to get help' },
] as const;

export const SCRIPT: Beat[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    mood: 'happy',
    say: (h) =>
      `Hi ${h.firstName}, welcome to Mobizinc. I'm here to walk you through your first morning, ` +
      `so you don't have to piece it together from a stack of documents. ` +
      `This takes about fifteen minutes. Stop me any time to ask something.`,
    prompts: ['How long will this take?', 'Can I do this later?'],
  },
  {
    id: 'accounts',
    label: 'Your accounts',
    say: (h) =>
      `First, the housekeeping. Your email, your Slack and your Teams accounts are already set up, ` +
      `which is how you got into this portal. ` +
      `If anything is missing by the end of today, tell ${h.buddyName} rather than waiting it out.`,
    completes: 'accounts',
    prompts: ['What if Slack is not working?', 'Which tools will I actually use?'],
  },
  {
    id: 'company',
    label: 'What we do',
    say: () =>
      `Mobizinc is a digital transformation consultancy. In plain terms, enterprises across the globe ` +
      `hire us when their systems no longer match how they want to work. ` +
      `We design the change, then we build it. Most of our clients stay with us for years, not weeks.`,
    prompts: ['Who are our clients?', 'What does a typical project look like?'],
  },
  {
    id: 'how-we-work',
    label: 'How we work',
    say: () =>
      `Two things shape how we work. We ship in small increments rather than long silent builds, ` +
      `and we say what we actually think in front of clients. ` +
      `That second one takes some getting used to, and it is the thing people say made the difference.`,
    completes: 'company',
    prompts: ['What does shipping in increments mean here?', 'How are teams structured?'],
  },
  {
    id: 'department',
    label: 'Your department',
    departmentSlot: true,
    say: (h) => `Now, your department. You're joining ${h.department} as ${h.role}.`,
    completes: 'team',
    prompts: ['Who else is on the team?', 'What will I work on first?'],
  },
  {
    id: 'people',
    label: 'Your people',
    say: (h) =>
      `Two names worth remembering today. ${h.managerName} is your manager, and you'll have a one to one this week. ` +
      `${h.buddyName} is your buddy for the first month. ` +
      `Ask ${h.buddyName} the questions that feel too small to raise with anyone else. That's the whole point of the role.`,
    prompts: [`What does a buddy do?`, `When do I meet my manager?`],
  },
  {
    id: 'week-one',
    label: 'Your first week',
    say: () =>
      `Your first week is deliberately light. Read into your project, sit in on the meetings, meet the team. ` +
      `Nobody expects output from you this week. ` +
      `By Friday you should be able to explain what your team does and who your client is.`,
    completes: 'week-one',
    prompts: ['What should I read first?', 'Which meetings should I join?'],
  },
  {
    id: 'support',
    label: 'Getting help',
    mood: 'happy',
    say: (h) =>
      `Last thing. If something is unclear, ask early. ${h.buddyName} first, then ${h.managerName}, then HR. ` +
      `I'm here too, so come back and ask me anything this week. ` +
      `Your call with HR is next, and they'll pick up anything I haven't covered.`,
    completes: 'support',
    prompts: ['How do I book time off?', 'Who do I contact in HR?'],
  },
];

/**
 * The system prompt for the Q&A path. Every answer is grounded in the
 * onboarding documents; anything outside them gets handed to a human.
 */
export function buildSystemPrompt(hire: Hire, documents: string): string {
  return `You are the onboarding guide for Mobizinc, a digital transformation consultancy in Kuala Lumpur.

You are speaking out loud to a new hire on their first morning. Your replies are
sent to a text-to-speech engine, so write for the ear: short sentences, no lists,
no markdown, no headings. Two or three sentences is usually enough.

The new hire:
- Name: ${hire.firstName}
- Role: ${hire.role}
- Department: ${hire.department}
- Manager: ${hire.managerName}
- Buddy: ${hire.buddyName}
- Start date: ${hire.startDate}

Rules:
- Answer only from the onboarding documents below. Do not infer company policy.
- If the answer is not in the documents, say so plainly and point them to their
  buddy, their manager, or the HR call. Never guess.
- Never discuss salary, contract terms, performance management or anything
  disciplinary. Redirect those to HR without answering.
- Speak warmly but do not gush. This person is starting a job, not being sold one.

Onboarding documents:
${documents}`;
}
