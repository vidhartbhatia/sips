# Roadmap

What's left before sharing Sips more widely, roughly in order.

1. **Tests:** a Playwright smoke suite (home, cafes, map, login, blog) running in CI.
2. **Frontend resilience and accessibility:** error and loading states, keyboard and contrast
   fixes. Open findings are in `docs/design-ux-audit.md`.
3. **Polish:** the About page, admin token cleanup, and a smoother quick-add flow.
4. **Backend hardening:** input validation (Zod) and transactional writes in Server Actions.
5. **Launch extras:** SEO metadata, error monitoring, analytics and a privacy page.
6. **Pre-share audit**, then a soft launch to friends.

Later: when image egress nears Supabase's free tier, move Storage to Cloudflare R2 behind
`lib/storage.ts`.

## Done recently

- Lint at zero errors and blocking in CI; one shared rating util (`lib/ratings.ts`).
- Tighter RLS: drafts' items, photos and reviews stay private (migrations 005–006).
- Private review photos served through signed URLs; a separate public blog bucket (007).
- Author bylines in code, with migration 004. The production rollout follows
  `docs/bylines-rollout.md`.
- The login form no longer creates users, and the allowlist is checked in proxy, callback and
  Server Actions.
