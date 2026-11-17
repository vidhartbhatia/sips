---
name: sips-design-loop
description: How to work with L. (designer) on Sips in the Claude desktop app. Covers showing live previews, iterating on UI and UX, checking mobile, building features, and writing blog posts or cafe reviews. Use whenever L. asks to see, change, design, try, or publish anything on the site, or says "show me", "what does it look like", "try a version where…".
---

# The Sips design loop (Claude desktop app)

L. works in the Claude desktop app's Code tab, not a terminal. She reacts to what she *sees*. Your
job is to keep a live preview in front of her and turn her feedback into changes fast.

## First, every session

Run `git pull` (and `npm install` if `package.json` changed) before anything else, so she is working on V.'s latest changes, rules and skills. Do it silently.

## Always: keep the preview open

- Start the site with the app's preview tool using the `dev` config in `.claude/launch.json`
  (`npm run dev`, port 3000). It opens in the app's browser pane beside the chat. Don't send
  her to a terminal.
- After every change, reload and **show her a screenshot** of the exact spot that changed.
  Don't just describe it.
- Check mobile too: resize the pane to the mobile preset (375px). Most visitors are on phones,
  so show both widths when layout changes. Reset to desktop afterwards.
- If the dev server errors, read its logs and fix the problem yourself. Tell her in one plain
  sentence what happened.

## Iterating on look & feel

1. Restate what she wants in one line ("warmer cards, less boxy"). If she's vague, offer two or
   three concrete directions as screenshots rather than asking abstract questions.
2. Use the **impeccable** skills for the craft: critique, polish, typeset, colorize, arrange,
   delight. Stay inside "Ink & Paper" (`.impeccable.md`): CSS variables only, the existing
   fonts, restraint.
3. For platform questions (dialogs, popovers, animations, forms, accessibility), check the
   `modern-web-guidance` skill.
4. Make small, reversible steps. Commit each version she likes on the branch, so "go back to
   the earlier one" is easy (`git log`, `git restore`). Never lose her work.
5. Before calling it done: `npm run typecheck`, `npm run build`, and a quick contrast and
   keyboard check on what changed.

## New features

- Fine to build: new pages, sections, components, filters, animations, and UI that uses the
  data that already exists.
- If a feature needs a **new database field or table**, a new service, or login changes, stop.
  Explain in one or two sentences why it's a "check with V." item (see `AGENTS.md`) and offer
  a version that needs no backend change. She decides.
- Show a working preview before polishing.

## Real data warning

Local dev uses the **live** database. Anything she creates, edits or deletes in
`localhost:3000/admin` is real and shows on oursips.com. For UI experiments, change the code or
use made-up props. Don't create test cafes or reviews in the admin. If you need sample content,
ask her first.

## Writing

- **Blog posts:** use the `publish-post` skill. She can hand you a doc, notes or a voice-memo
  transcript.
- **Cafe reviews:** the fastest path is on her phone at oursips.com/admin/review/new, right at
  the cafe. If she gives you notes instead, draft the fields (1–5 rating, drinks or food with
  ratings, vibe tags, note) in her voice for her to paste. Don't submit reviews for her
  without her OK.

## Shipping

When she's happy with a change:

1. Run `npm run typecheck` and `npm run build`, then commit with a plain-English message.
2. Small, safe change: push to `main`. It's live in a couple of minutes. Open the live page
   and show her.
3. Big or risky change, or a "Check with V." item: push a branch and run `gh pr create`. Say
   what changed in human terms and share the Vercel preview link. V. reviews and merges.

## Talking to her

- Short, friendly, visual. One recommendation, not a menu of ten.
- No jargon. If a term is unavoidable, explain it in five words or fewer.
- Never make her run a command. If something needs her (a login or a password), say exactly
  what she'll see and what to click.
