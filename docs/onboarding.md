# Onboarding L. (hands-off)

## V. does (about 2 minutes)

1. AirDrop `~/projects/sips/.env.local` to her Mac. It lands in her Downloads folder. Don't send
   it over Messages, email or chat.
2. Send her the prompt below.

## L. does

1. Install the **Claude** desktop app (claude.ai/download) and sign in.
2. Open the **Code** tab. Choose any folder (her home folder is fine) and set permissions to
   **Auto** (or approve prompts as they come).
3. Paste this prompt:

```text
Set me up to work on our cafe website Sips (github.com/vidhartbhatia/sips). I'm a designer, not
an engineer: do everything you can yourself, and only ask me when you need me to click
something, log in, or enter my Mac password.

1. Make sure Xcode command line tools, Homebrew, Node and the GitHub CLI (gh) are installed.
2. Log me into GitHub with `gh auth login --web` (I already have a GitHub account and a pending invite) and accept my
   pending invite to vidhartbhatia/sips.
3. Clone it to ~/projects/sips.
4. Then follow the repo's onboarding skill at
   ~/projects/sips/.agents/skills/sips-onboarding/SKILL.md from step 1. Skip anything already
   done. V. AirDropped me the .env.local file.
```

4. When it's done, open a new Code session in the `~/projects/sips` folder. That's her
   workspace from now on.

After setup her agent knows the rules (`AGENTS.md`), the publishing flow (`publish-post` skill)
and when to suggest checking with V.
