---
name: cross-model-review
description: Get a second-opinion code review or design consult from OpenAI Codex (GPT-6.x) on the current branch or a question. Use before merging non-trivial changes, when stuck, or when a decision would benefit from a different model's view. Not for trivial edits.
---

# Cross-model review via Codex

Shell out to the Codex CLI, read-only. Requires `codex` logged in with a ChatGPT plan.

## Models

| Model | Use for |
|---|---|
| `gpt-6-astra` | Deep review, architecture or security questions (slower, costlier) |
| `gpt-6.1-sol` | Quick checks, small diffs, consults (current workhorse; the Codex default) |

Requires Codex CLI ≥ 0.169. Older clients reject the 6.1 models with `model_not_found`, so run
`codex update`.

## Review the branch diff

`codex review --base` can't take custom instructions, so use `exec` and have it read the diff.
Three things are mandatory, because each one bit us (see `docs/gotchas.md`):

- **Close stdin** (`< /dev/null`). Otherwise `codex exec` can wait on input forever.
- **Set a hard time limit.** macOS has no `timeout`, so use `perl -e 'alarm shift; exec @ARGV'`.
- **Pin the head SHA** and re-run after any new commit. A review of an older commit doesn't
  count.

```bash
SHA=$(git rev-parse HEAD)
perl -e 'alarm shift; exec @ARGV' 900 codex exec -m gpt-6-astra -s read-only \
  "Review commit range main...$SHA: run git diff main...$SHA. Check correctness, security (auth/RLS/service-role misuse) and the rules in AGENTS.md. List findings by severity with file:line. No style nits. Under 500 words." \
  < /dev/null
```

Report the reviewed SHA in the PR. If HEAD moves, review again.

## Visible changes: design review

A PR that changes what visitors or Lea see needs all of these before merge, at the head SHA:

1. **Screenshots** at desktop (1280–1440) and 375px of every page it changes, with real or
   fixture content. Don't commit them; attach the local paths in the PR.
2. **An impeccable critique** of those screenshots against `.impeccable.md` (the `impeccable`
   skill, `critique`).
3. **A vision review from another model family.** Give Codex the screenshot paths and
   `.impeccable.md`, and ask for the three most important problems a designer would fix. No
   compliments, no style-system rewrites. Run it with the same stdin and time-limit rules as
   above.
4. **A human look.** V. or L. sees the screenshots before a public-facing change merges.

Fix the real problems, list the rejected ones with a reason, and keep it to one round unless a
problem is serious. The launch gate (P1 PR L) runs the same procedure across all public pages.

For a quick default review with no custom focus, use `codex review --base main` (or `--uncommitted`).

## Consult on a question

```bash
codex exec -m gpt-6-astra -s read-only \
  "Context: <2-3 lines>. Question: <decision>. Options: A) ... B) ... Recommend one, with the main risk."
```

## Rules

- Always use the read-only sandbox (`codex review` is read-only by default). Never let Codex
  edit files or push.
- Run it in the background if it may take more than about 2 minutes, and never wait on it
  with a `pgrep -f "codex exec"` loop: the loop's own command line matches the pattern, so it
  never exits. Wait on the background task itself.
- Its output is a reviewer's opinion. Verify each finding against the code before acting,
  then report which ones you accepted or rejected and why.
- Don't send `.env` contents or secrets in the prompt.
