# Sips Design System — "Ink & Paper"

A modern editorial aesthetic grounded in warmth, with bold hand-drawn ink illustrations as signature accents. Think: a well-designed food magazine meets an artist's personal sketchbook.

## Design Direction

**From:** Cozy cottage, watercolor-soft, Playfair Display serif, precious hand-drawn everything
**To:** Confident editorial, ink-on-paper bold, modern serif headlines, hand-drawn as punctuation not wallpaper

The hand-drawn elements remain — they're the soul of Sips — but they shift from "cute cafe doodles" to "confident ink sketches" inspired by the bold brush strokes in our references (Tilda Wine, Pause, Camino).

## Typography

Three-tier system with clear hierarchy:

### Headings — Caveat
Hand-drawn yet elegant. Not elongated or overly formal — warm, personal, like someone wrote the heading with a nice pen. Used for page titles, section headings, cafe names. Gives the site its hand-drawn identity.

### Display / Accent — Instrument Serif
Modern editorial serif for accent use — pull quotes, subtitles, elegant moments. Available as `font-display`.

### Body — Plus Jakarta Sans
Geometric sans-serif with warmth. Clean, modern, excellent readability. Used for paragraphs, descriptions, UI text.

### Mono / Metadata — IBM Plex Mono
Small caps, uppercase, letterspaced. For metadata: neighborhoods, dates, tags, ratings labels. Gives structure against the organic hand elements.

## Color Palette

Keep the warm foundation. Refine and add depth.

### Core
- **Cream** `#FFF8F0` — background, warmth (keep)
- **Stone** `#F0EBE3` — secondary background, card surfaces (new, slightly darker cream)
- **Espresso** `#2C2420` — primary text, refined from brown (was #3D2C2C — darker, richer)
- **Espresso Muted** `#7A6E66` — secondary text (warmer than old brown-muted)

### Accents
- **Terracotta** `#C4735B` — primary action, links, CTA (keep)
- **Terracotta Dark** `#A85D47` — hover states (keep)
- **Sage** `#8BAA8F` — secondary accent, success, tags (keep)
- **Ink Blue** `#3D5A80` — hand-drawn illustrations, decorative elements (new, inspired by Camino inspo)
- **Pink** `#E8B4B8` — highlight, selection, badges (keep)

### Removed
- terracotta-light, sage-light, sage-dark, blue, blue-light (unused or redundant — simplify)

## Illustration Style

Clean, confident ink illustrations generated via Recraft AI:
- Clean confident strokes, hand-drawn but precise
- Uniform line weight, no sketchy/scratchy marks
- Smooth curves, minimal detail — elegant simplicity
- Single-color (black ink on transparent background)
- Used for: hero moments, empty states, section accents, map pins
- NOT used for: every heading, every card, every element (restraint)

### Available Assets (`public/illustrations/`)
- **cafe-scene.png** — cafe table with chair, cup, croissant, plant (hero)
- **coffee-cup.svg** — single coffee cup (logo/icon use)
- **matcha-bowl.svg** — matcha bowl
- **cocktail-glass.svg** — cocktail glass
- **takeaway-cup.svg** — takeaway cup
- **croissant.svg** — croissant
- **cat-with-cup.svg/png** — cat mascot with coffee cup
- **stacked-cups.svg/png** — stack of cups (empty states)
- **potted-plant.svg** — potted plant
- **notebook.png** — notebook/journal
- **icon-set.svg** — small icon collection

## Layout Principles

### Editorial Grid
- Wide max-width for content (1200px)
- Asymmetric layouts for feature sections
- Photography and illustration coexisting in the same space
- Generous whitespace — let content breathe

### Section Breaks
Replace watercolor dividers with:
- A single bold ink brush stroke SVG
- Or generous whitespace + a small hand-drawn element (cup, leaf, asterisk)
- Or a full-bleed color block (stone or muted terracotta)

### Cards
- Clean, modern cards with subtle borders (1px espresso/10%)
- Slight border-radius (8-12px) — modern, not the wobbly hand-drawn border
- Hand-drawn accents used sparingly: a small corner flourish, or an ink underline on the title
- Hover: subtle lift + border color shift to terracotta

### Typography Scale (mobile / desktop)
- Hero: 36px / 56px (Caveat)
- H1: 30px / 40px
- H2: 24px / 32px
- H3: 20px / 24px
- Body: 16px / 16px
- Small/Meta: 12px / 13px (IBM Plex Mono, uppercase, letterspaced)

## Component Patterns

### Navigation
- Clean horizontal nav, no background
- Logo: "Sips" in Caveat, bold — or the ink brush version
- Links in Plus Jakarta Sans, small/medium weight
- Current page: terracotta underline (ink brush style, not straight)

### Cafe Cards
- Clean white/stone card
- Photo area (aspect 4:3) with subtle rounded corners
- Name in Caveat
- Neighborhood + type in IBM Plex Mono uppercase
- Rating: keep SipsCup but refine line weight to match ink style
- Tags as small pills with 1px border

### Ratings (SipsCup)
- Keep the cup concept and fill mechanic
- Refine SVG to match the bolder ink illustration style
- Slightly thicker strokes (2px minimum)

### Buttons
- Primary: solid terracotta, Plus Jakarta Sans medium, modern rounded (8px)
- Secondary: 1px espresso border, transparent background
- Ghost: text only with hover underline (ink brush style)
- No hand-drawn-border on buttons (too much)

### Tags / Badges
- Small pills: 1px border, transparent background, IBM Plex Mono uppercase
- Active: filled with subtle color (sage/10%, terracotta/10%)

## Motion

- **Page load**: Staggered fade-up reveals (keep, refine timing)
- **Cards**: Subtle translateY(-2px) + shadow on hover (not -4px, subtle)
- **Ink elements**: Draw-on animations using stroke-dasharray for SVG illustrations
- **Transitions**: 200-300ms ease-out, never bouncy spring (too playful for editorial)

## Texture

- Keep paper grain overlay but reduce to 0.02 opacity
- Consider a subtle halftone dot pattern for section backgrounds (editorial nod)
- No watercolor blobs — replace with geometric shapes or ink splatters if needed

## Summary of Changes from Current

| Element | Before | After |
|---------|--------|-------|
| Heading font | Playfair Display | Caveat (hand-drawn) |
| Body font | DM Sans | Plus Jakarta Sans |
| Metadata font | (none) | IBM Plex Mono |
| Primary text | #3D2C2C | #2C2420 |
| Card borders | hand-drawn wobbly | clean 1px + 8px radius |
| Section dividers | watercolor SVGs | ink brush strokes |
| Illustration style | cute doodles | bold ink sketches |
| Layout | centered symmetric | editorial asymmetric |
| Buttons | hand-drawn-border | modern rounded |
| Overall feel | cozy cottage | confident editorial |
