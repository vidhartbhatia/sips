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

- **Stories (blog posts):** use the `publish-post` skill. She can hand you a doc, notes or a
  voice-memo transcript. Stories stay MDX files in `content/blog/`.
- **Cafe reviews:** she captures them on her phone at oursips.com/admin/capture, right at the
  cafe: photos, cafe, drinks (scores optional), overall score, verdict, note. It saves a private
  draft and opens its edit page, where she finishes and publishes it later (usually on her
  laptop). Your part is the words: help her write the verdict (one line) and the story (1–4
  short paragraphs) in her voice, which she pastes into the form. Photo guidance is in
  `publish-post` ("Review photos"): window light, a 3:2 landscape hero first, drinks 4:5 at
  about 45°, three or more photos. Don't submit or publish reviews for her without her OK.

### Finishing and publishing a review

The flow is **capture → edit → Preview → Publish**:

1. **Capture** on her phone (`/admin/capture`). It always saves a private draft.
2. **Edit** at `/admin/review/<id>/edit` (the admin dashboard links her drafts). Here she adds or
   fixes drinks, attaches photos to drinks, picks the cover (the big photo at the top), and
   writes the verdict and story.
3. **Preview** (the link on the edit page, `/admin/review/<id>/preview`) shows the real review
   page, exactly as visitors will see it. A banner at the top says it's a draft that only she
   can see. Open it in the browser pane and show her both desktop and mobile.
4. **Publish** from the edit page.

What to tell her along the way:

- **"Score every drink before publishing: Cortado"** means that drink has no score yet.
  Drafts can leave scores empty; publishing needs an overall score and a 1–5 score on every
  drink. The preview banner names the drinks that still need one.
- **Alt text:** each photo has a caption field in the edit form. It's what screen readers
  read and what shows if the image fails to load. One plain sentence ("Cortado on the window
  ledge"). If she leaves it empty the site writes a generic one, so it's worth a few seconds.
- **Unpublishing is safe.** It takes the review off the public site and back to a draft;
  nothing is deleted. She can fix it and publish again.
- Visitors only see published reviews, and a cafe only appears on the site once it has one.

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
