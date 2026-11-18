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

- **Run it through `scripts/with-timeout.sh`.** It closes stdin (otherwise `codex exec` can
  wait on input forever), sets a hard time limit that kills the whole process tree, and
  returns non-zero on timeout (124) or if `codex` can't start (127).
- **Pin the head SHA** and re-run after any new commit. A review of an older commit doesn't
  count.

```bash
SHA=$(git rev-parse HEAD)
scripts/with-timeout.sh 900 codex exec -m gpt-6-astra -s read-only \
  "Review commit range main...$SHA: run git diff main...$SHA. Check correctness, security (auth/RLS/service-role misuse) and the rules in AGENTS.md. List findings by severity with file:line. No style nits. Under 500 words."
```

Report the reviewed SHA in the PR. If HEAD moves, review again.

## Visible changes: design review, scaled to the change

| Change | Before merge |
|---|---|
| Copy, a colour, a spacing tweak | Desktop and 375px screenshots of the spot, shown to V. or L. |
| A new or reworked page or component | Screenshots of every changed page at both widths, an impeccable `critique` against `.impeccable.md`, and one vision review from another model family (Codex: "the three most important problems a designer would fix", no compliments), then V. or L. sees the screenshots |
| Launch gate (P1 PR L) | The full procedure across all public pages, with real reviews |

- Take screenshots at the head SHA, with real or fixture content. Don't commit them: show them
  in chat or an artifact, and the CI `playwright-report` artifact holds the test evidence.
- Fix the real problems and list the rejected ones with a reason. One round, unless a problem
  is serious.

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
