#!/bin/sh
# Stop hook: when the agent finishes a turn with uncommitted TypeScript changes, run the
# typecheck so "done" claims are backed by a passing check (AGENTS.md: verify before done).
# Fast no-op when no .ts/.tsx files changed. Exit 2 = block stopping and show Claude the errors.
input=$(cat)
# Avoid loops: if Claude is already continuing because of this hook, let it stop.
printf '%s' "$input" | grep -q '"stop_hook_active": *true' && exit 0

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
changed=$( { git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null; } | grep -E '\.(ts|tsx)$' | head -1)
[ -z "$changed" ] && exit 0
[ -d node_modules ] || exit 0

if ! out=$(npm run -s typecheck 2>&1); then
  printf 'Typecheck failed on uncommitted changes. Fix these before finishing:\n%s\n' "$(printf '%s' "$out" | tail -30)" >&2
  exit 2
fi
exit 0
