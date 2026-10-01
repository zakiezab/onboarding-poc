# Onboarding script — day one

This is the master copy for HR review. The code in `lib/onboarding-script.ts`
mirrors it. Edit here first, agree the wording, then port it across.

Placeholders in `{braces}` are filled from the hire record.

**Writing rule:** this is spoken, not read. Sentences under about 18 words.
No lists, no jargon, no sentence that needs a second pass to parse. If you would
not say it out loud to someone across a desk, rewrite it.

Total runtime: roughly 4 minutes of speech across 8 beats, plus questions.

---

## 1. Welcome

> Hi {firstName}, welcome to Mobizinc. I'm here to walk you through your first
> morning, so you don't have to piece it together from a stack of documents.
> This takes about fifteen minutes. Stop me any time to ask something.

Sets the contract: short, guided, interruptible.

---

## 2. Your accounts

> First, the housekeeping. Your email, your Slack and your Teams accounts are
> already set up, which is how you got into this portal. If anything is missing
> by the end of today, tell {buddyName} rather than waiting it out.

Marks **Accounts and tools** complete.

The last sentence exists because new hires sit on broken access for days rather
than bother anyone. Naming the person to tell is what makes it happen.

---

## 3. What we do

> Mobizinc is a digital transformation consultancy. In plain terms, enterprises
> across the globe hire us when their systems no longer match how they want
> to work. We design the change, then we build it. Most of our clients stay with
> us for years, not weeks.

Deliberately not the website copy. A new hire needs to be able to explain the
company to a friend by Friday.

---

## 4. How we work

> Two things shape how we work. We ship in small increments rather than long
> silent builds, and we say what we actually think in front of clients. That
> second one takes some getting used to, and it is the thing people say made the
> difference.

Marks **How Mobizinc works** complete.

Two values, not seven. Seven means none get remembered.

---

## 5. Your department

> Now, your department. You're joining {department} as {role}.

Then the department's own HR file is read aloud. One file per department at
`content/departments/<slug>.md`.

Marks **Your department** complete.

Each department file should answer, in order: what the team is responsible for,
who is on it, what the current project is, and what the new hire will touch
first. Around 150 to 250 spoken words. Wrap that part in
`<!-- spoken -->` and `<!-- /spoken -->` so the rest of the file stays as
reference material for questions without being read out.

---

## 6. Your people

> Two names worth remembering today. {managerName} is your manager, and you'll
> have a one to one this week. {buddyName} is your buddy for the first month.
> Ask {buddyName} the questions that feel too small to raise with anyone else.
> That's the whole point of the role.

Naming the buddy's purpose out loud is what gives permission to use them.

---

## 7. Your first week

> Your first week is deliberately light. Read into your project, sit in on the
> meetings, meet the team. Nobody expects output from you this week. By Friday
> you should be able to explain what your team does and who your client is.

Marks **Your first week** complete.

"Nobody expects output from you this week" is the line to keep. It removes the
anxiety that makes week one unproductive in the first place.

---

## 8. Getting help

> Last thing. If something is unclear, ask early. {buddyName} first, then
> {managerName}, then HR. I'm here too, so come back and ask me anything this
> week. Your call with HR is next, and they'll pick up anything I haven't
> covered.

Marks **Where to get help** complete.

Ends by handing over rather than closing down. The HR call is now a conversation
about this person, not a recital of the same five topics.

---

## Questions

While any beat is on screen the hire can ask anything. Answers come from the
onboarding documents only.

Hard boundaries, enforced in the system prompt:

- Salary, contract terms, performance management, anything disciplinary →
  redirect to HR without answering.
- Anything not in the documents → say so, point to the buddy or the HR call.
  Never infer policy.

Every unanswered question should be logged. That log is the content roadmap for
the next version — it tells you exactly what HR forgot to write down.

---

## Department file template

Copy this into `content/departments/<slug>.md`:

```markdown
# Engineering

<!-- spoken -->
The engineering team builds what the consulting side designs. There are
fourteen of us across two squads, working mostly in TypeScript and Next.js.

Right now the team is midway through a platform rebuild for a logistics client
in Singapore. It goes live in March.

In your first fortnight you'll pair with someone on the smaller internal tools
squad before joining client work. That's deliberate, so you can break things
somewhere safe.
<!-- /spoken -->

## Reference

Not read aloud, but available when the new hire asks a question.

- Code review: two approvals, no self-merge to main.
- On-call: shared rota, you join after month three.
- Stand-up: 9:30am, fifteen minutes, camera optional.
```
