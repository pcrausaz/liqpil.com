# Tap Map — Add Android / Google Play support across the website

## Context

Tap Map has been ported to Android and is now live on Google Play (`https://play.google.com/store/apps/details?id=com.askpascal.tinnies`). The website currently presents Tap Map as an iOS-only product across all three languages (en-US, en-GB, fr-FR): the landing copy says "iOS app", the FAQ explicitly says only iOS/iPad OS are supported and that Android is unsupported, and the EULA links exclusively to Apple's standard EULA template.

Goal: update the marketing site so iOS and Android are presented as equal first-class platforms, surface a Google Play download button alongside the existing App Store button on every page that already promotes the iOS download, refresh the FAQ to remove the "Android coming someday" framing, and split the EULA Terms of Use to point each platform at its native default EULA. The Beta Program (TestFlight) stays iOS-only — no Google Play closed-testing track exists yet. Android screenshots are not available yet, so skip any Android imagery.

## Decisions confirmed with user

- **Badge layout**: App Store and Google Play side-by-side, centered.
- **Implementation**: Make a single `{{< downloadapp >}}` shortcode render both badges. Every existing call site (`_index.md` ×3, `faq/index.md` ×3 at the "release" question and the "Why a Beta Program?" question) automatically picks up the Google Play button — no content edits needed for those call sites.
- **Android beta**: none. `{{< downloadappbeta >}}` stays iOS/TestFlight-only.
- **Google Play EULA URL**: `https://play.google.com/about/play-terms/` (Google Play Terms of Service — the default that applies when a developer doesn't supply a custom EULA).
- **en-GB duplicate question**: remove the second "What identity provider does Tap Map support?" at `content/en-GB/faq/index.md:34-35`.

## Changes

### 1. Shortcode: render both badges in one shortcode

**`layouts/shortcodes/downloadapp.html`** — replace the current single-badge markup with a flex container holding both badges:
- Wrap both `<a>` links in a `<div>` styled `display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: center; margin: 20px auto;`.
- App Store link: keep existing href and SVG (`/images/app-store-badge.svg`).
- Google Play link: `https://play.google.com/store/apps/details?id=com.askpascal.tinnies`, image `/google-play-badge.svg` (already at `/static/google-play-badge.svg`, served at site root), alt `"Get it on Google Play"`.
- Normalize visual heights via CSS (`height: 50px; width: auto;` on both `<img>`) — the source SVGs have different aspect ratios (App Store ~3:1, Google Play ~3.4:1), so matching height keeps them visually balanced.
- Drop the `color: red;` `<p>` wrapper; it's leftover and doesn't apply to image links.

**`layouts/shortcodes/downloadappbeta.html`** — leave unchanged. Beta is iOS/TestFlight-only.

### 2. Landing pages — soften "iOS app" wording

Replace the "iOS app" phrasing in the opening sentence of each landing page. The `{{< downloadapp >}}` call already exists below the paragraph; no further changes needed at call sites since the shortcode now renders both badges.

- `content/en-US/_index.md:9` — `vibrant iOS app` → `vibrant mobile app`
- `content/en-GB/_index.md:8` — `vibrant iOS app` → `vibrant mobile app`
- `content/fr-FR/_index.md:8` — `notre application iOS dynamique` → `notre application mobile dynamique`

### 3. FAQ — full content review per language

Apply the same set of edits to all three FAQ files. Representative diffs shown for en-US; en-GB and fr-FR get analogous changes in their own language.

**`content/en-US/faq/index.md`:**
- Line 12 — `Apple App Store` → `Apple App Store and Google Play`.
- Line 22 (`What platform does Tap Map support?`) — rewrite to: `Tap Map runs on iOS, iPad OS, and Android. We support recent versions of each.`
- Lines 31–32 (`When will Android OS be supported?`) — **replace** the whole Q&A with: `### How do I get Tap Map on Android?` answered with one sentence ("Tap Map is available on Google Play.") followed by `{{< downloadapp >}}` so both buttons appear (Google Play is the relevant one here, App Store appears alongside for parity — acceptable per the side-by-side decision).
- Line 25 — leave "Sign in with Apple" and "Sign in with Google" as-is. Both providers genuinely work on both platforms; the wording is accurate.
- Beta Program section (lines 55–72) — add one clarifying sentence at the top of "Wait! Why a Beta Program?" noting the beta is currently iOS-only via TestFlight. Leave the TestFlight Q&As intact.

**`content/en-GB/faq/index.md`:**
- Same edits as en-US for lines 12, 22, 31–32, beta clarification.
- **Remove duplicate** Q&A at lines 34–35 (`### What identity provider does Tap Map support?` — already present at line 24–25).

**`content/fr-FR/faq/index.md`:**
- Line 12 — `App Store d'Apple` → `App Store d'Apple et Google Play`.
- Line 13 — **delete** this line entirely (it's stray English text duplicating line 12: `Tap Map has been released and can be downloaded from the Apple App Store.`).
- Line 23 (`Quelles plateformes...`) — rewrite: `Tap Map fonctionne sur iOS, iPad OS et Android. Nous prenons en charge les versions récentes de chaque plateforme.`
- Lines 32–33 (`Quand le système d'exploitation Android sera-t-il pris en charge ?`) — replace with `### Comment obtenir Tap Map sur Android ?` answered with `Tap Map est disponible sur Google Play.` and `{{< downloadapp >}}`.
- Line 26 — leave "Apple ou Google" identity provider wording as-is.
- Line 61 (beta intro) — `lien sur l'Apple Store` → `lien ci-dessous` (it's now both stores). Add the same iOS-only beta clarification at the top of the "Pourquoi un programme bêta ?" answer.

### 4. EULA — split Terms of Use per platform

Restructure section 1 to distinguish iOS and Android. Each language file follows the same shape; translate the headings appropriately.

**`content/en-US/eula/index.md:8-9`** and **`content/en-GB/eula/index.md:7-8`**:
```
## 1. Terms of Use

### iOS version
EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

### Android version
EULA: https://play.google.com/about/play-terms/
```

**`content/fr-FR/eula/index.md:8-9`**: same structure with French headings (`### Version iOS`, `### Version Android`, `CLUF :` prefix to match existing French convention).

### 5. Items intentionally NOT changed

- **`downloadappbeta.html`**: no Android beta exists → stays iOS-only.
- **Privacy and Support pages**: no iOS/Apple references → no changes.
- **`hugo.toml`**: no platform references → no changes.
- **`welcome-guide`, `betastamp`, `buymeacoffee` shortcodes**: platform-agnostic → no changes.
- **TestFlight Q&As in FAQ**: still accurate for the iOS beta program → kept, just contextualized as iOS-only.
- **Android screenshots / welcome guide imagery**: deferred per user — no new images added.
- **Section numbering quirks** (e.g. en-US EULA jumps from `## 1.` to `## 10.`): out of scope; not touching unless asked.

## Verification

Run locally and visually inspect:

1. `hugo server -D` then open `http://localhost:1313/`.
2. For each language (`/`, `/en-gb/`, `/fr-fr/`), check:
   - **Home page**: opening paragraph no longer says "iOS"; App Store and Google Play badges render side-by-side, centered, equal heights; both links open the correct stores in new tabs.
   - **FAQ page**: the "When will Tap Map release?" answer shows both badges; the old "When will Android be supported?" question is gone, replaced by "How do I get Tap Map on Android?"; the "What platform" answer lists iOS, iPad OS, Android; the Beta section still references TestFlight and notes iOS-only; en-GB has no duplicate identity-provider question; fr-FR has no stray English sentence at the top.
   - **EULA page**: section 1 has two sub-sections (iOS → Apple EULA, Android → Google Play terms), both links resolve.
3. Resize browser to mobile width (~375px) — confirm badges wrap gracefully (flex-wrap allows stacking on narrow screens) and remain centered.
4. `hugo` (production build) — confirm no template errors and `/google-play-badge.svg` is present in `public/`.
