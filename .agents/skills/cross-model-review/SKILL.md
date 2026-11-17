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

`codex review --base` can't take custom instructions, so use `exec` and have it read the diff:

```bash
codex exec -m gpt-6-astra -s read-only \
  "Review this branch: run git diff main...HEAD. Check correctness, security (auth/RLS/service-role misuse) and the rules in AGENTS.md. List findings by severity with file:line. No style nits. Under 500 words."
```

For a quick default review with no custom focus, use `codex review --base main` (or `--uncommitted`).

## Consult on a question

```bash
codex exec -m gpt-6-astra -s read-only \
  "Context: <2-3 lines>. Question: <decision>. Options: A) ... B) ... Recommend one, with the main risk."
```

## Rules

- Always use the read-only sandbox (`codex review` is read-only by default). Never let Codex
  edit files or push.
- Run it in the background if it may take more than about 2 minutes.
- Its output is a reviewer's opinion. Verify each finding against the code before acting,
  then report which ones you accepted or rejected and why.
- Don't send `.env` contents or secrets in the prompt.
