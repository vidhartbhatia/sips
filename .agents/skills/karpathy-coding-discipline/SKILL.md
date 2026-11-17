---
name: karpathy-coding-discipline
description: Use when writing or modifying production code — any task that produces TypeScript, SQL migrations, server actions, components, or test code. Enforces three discipline principles distilled from Andrej Karpathy's observations on LLM coding pitfalls — Think Before Coding, Simplicity First, Goal-Driven Execution. Counters the AI tendency to over-scaffold, add speculative abstractions, and declare "done" before behavior is verified. Sips-tuned. Skip for design exploration, planning docs, triage, and changelog writing.
license: MIT
metadata:
  source: forrestchang/andrej-karpathy-skills
  adapted_for: sips
  version: "1.0"
---

# Karpathy Coding Discipline

Three principles to keep code-writing agents honest. Adapted from [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — the original `Surgical Changes` principle is omitted because it's already enforced by the project's top-level system prompt and doesn't need a second copy.

Apply these BEFORE you touch a file. Re-read mid-task if you notice yourself drifting.

---

## 1. Think Before Coding

**The trap:** Jumping into the first viable implementation that comes to mind. Pattern-matching on the prompt rather than the actual problem.

**The discipline:**
- State your assumptions out loud before writing code. ("I'm assuming the rating recalculation should null-out when zero reviews remain — confirming.")
- If the task is ambiguous, present 2-3 interpretations briefly and pick one (or ask). Do not silently choose.
- Surface tradeoffs you noticed. ("This adds a round-trip per review — acceptable because admin-only.")
- **Push back on the user when the request is wrong.** If a fix would create worse problems than it solves, say so. Sycophancy is a bug.

**Sips-specific:**
- Before changing any `lib/actions/*` file, name the auth check, the RLS policy that backs it, and what happens on the unauthenticated path.
- Before touching `app/globals.css` or design tokens, name the deprecated tokens you might accidentally re-introduce (`text-brown`, `font-hand`, `hand-drawn-border`). They're forbidden.
- Before adding a Framer Motion animation, confirm `useMotionSafe()` is in the call.

---

## 2. Simplicity First

**The trap:** Reaching for abstraction before there's a second use case. Building a config system for one knob. Adding a hook because "we might need it later."

**The discipline:**
- **No speculative abstraction.** Build for the call site you have, not the one you imagine.
- **No premature factories, providers, or context wrappers** unless 2+ existing call sites need them.
- **If 200 lines could be 50, rewrite it.** Length is a liability, not a deliverable.
- **Inline beats abstracted** until proven otherwise. A 12-line helper used twice is not yet a utility.
- Prefer dumb code over clever code. The next agent reading this is likely a tired human at 11pm.

**Sips-specific:**
- Server Actions in `lib/actions/` should be flat functions, not classes.
- Don't build wrappers around `@supabase/ssr` — use the existing `lib/supabase/server.ts|client.ts|admin.ts` triad. New helpers only when there's a third caller.
- Don't extract a component until it's reused. One-off layouts live inline in the page file.
- Don't add a `lib/utils/{thing}.ts` for a 3-line function — colocate it.

---

## 3. Goal-Driven Execution

**The trap:** Declaring "done" when the code compiles. Confusing "I wrote it" with "it works."

**The discipline:**
- **Define the success criterion before writing code.** What output, what side effect, what test passes?
- **Verify the criterion before reporting done.** Run the build. Hit the endpoint. Reload the page. Don't trust the diff.
- **Tests-first when the success criterion is testable** (Tester agent, this is your default).
- "It looks right" is not verification. "I ran it and got X" is verification.
- If you cannot verify (no test infra, can't reach the env), SAY SO explicitly in your handoff. Don't paper over it.

**Sips-specific:**
- After touching `lib/actions/*` — `npm run build` MUST pass. No exceptions.
- After touching `app/**` — confirm the page renders at 375px AND 1280px. Mobile is not optional.
- After touching auth or RLS — name the negative case you tested (unauth user gets blocked, allowlist rejects, etc.). Untested auth changes are P0 risk.
- After touching `recalculateRating()` or any review mutation — confirm the zero-reviews case sets rating to `null`, not `0`.
- For Tester: a test that doesn't fail when the implementation is broken is not a test. Verify red-then-green.

---

## When NOT to apply this skill

- Pure design exploration (Creative agent, sketching options)
- Planning, triage, decomposition (Lead-as-planner)
- Mechanical ops — changelog writing, version bumps, file moves
- Documentation that doesn't ship code (READMEs, brain notes)

For those tasks, the discipline cost is higher than the benefit.
