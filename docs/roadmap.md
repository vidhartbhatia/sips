# Roadmap

What's left before sharing Sips more widely, roughly in order.

1. **Code health:** unify rating logic (`lib/ratings.ts`) and get `npm run lint` to zero errors.
2. **Frontend resilience and accessibility:** error and loading states, keyboard and contrast
   fixes. See `docs/design-ux-audit.md` for the open findings.
3. **Tests:** a Playwright smoke suite (home, cafes, map, login, blog) running in CI.
4. **Polish:** the About page, admin token cleanup, and a smoother quick-add flow.
5. **Backend cleanup:** tighter RLS, input validation (Zod), transactional writes.
6. **Launch extras:** SEO metadata, error monitoring, analytics, a privacy page, and author
   bylines on reviews.
7. **Pre-share audit**, then a soft launch to friends.

When images outgrow Supabase's free tier, move Storage to Cloudflare R2 behind `lib/storage.ts`.
