# Re-enabling Google OAuth Login

Google OAuth was implemented in Phase 1 but hidden to simplify the initial setup (magic link only). Here's how to bring it back.

## 1. Code Change (5 min)

In `app/login/page.tsx`, restore the Google OAuth button and handler. Add back before the magic link form:

```tsx
// Add this handler inside LoginContent():
async function handleGoogleLogin() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// Add this JSX before the {/* Magic link */} comment:
{/* Google OAuth */}
<button
  onClick={handleGoogleLogin}
  className="flex w-full items-center justify-center gap-3 rounded-xl border border-espresso/[0.12] bg-cream px-4 py-3 text-sm text-espresso transition-colors hover:bg-stone"
>
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
  Sign in with Google
</button>

<div className="my-6 flex items-center gap-4">
  <div className="h-px flex-1 bg-espresso/[0.08]" />
  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-espresso-muted">or</span>
  <div className="h-px flex-1 bg-espresso/[0.08]" />
</div>
```

The auth callback route (`app/auth/callback/route.ts`) already handles both OAuth and magic link code exchange — no changes needed there.

## 2. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create a project (or select existing)
3. APIs & Services → Credentials → Create Credentials → OAuth Client ID
4. Application type: **Web application**
5. Authorized JavaScript origins: add your production URL (e.g. `https://oursips.com`)
6. Authorized redirect URIs: add `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - For this project: `https://<project-ref>.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

## 3. Supabase Dashboard Setup

1. Authentication → Providers → Google
2. Toggle **Enable** on
3. Paste Client ID and Client Secret from Google
4. Save

## 4. Supabase URL Configuration

1. Authentication → URL Configuration
2. **Site URL**: your production domain (e.g. `https://oursips.com`)
3. **Redirect URLs** — add all environments:
   - `https://oursips.com/auth/callback` (production)
   - `https://*.vercel.app/auth/callback` (preview deploys)
   - `http://localhost:3000/auth/callback` (local dev)

## 5. Test

1. Deploy the code change
2. Visit `/login` on production
3. Click "Sign in with Google"
4. Should redirect to Google → back to your site → `/admin`
5. If it redirects to localhost, the Supabase Site URL is wrong (step 4)
