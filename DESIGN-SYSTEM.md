# TrueMatch — Design System

A tactical, competitive aesthetic inspired by **Valorant**. Sharp angles, deep navy surfaces, signature red as the call-to-action, condensed display type.

The system is built on Tailwind CSS 4 with CSS variables defined in `src/app/globals.css`. Both dark and light variants are required; **dark is the default**.

---

## 1. Brand

- **Wordmark:** `TRUE//MATCH` set in the display family, all caps, with the `//` rendered in the signature red.
- **Voice:** terse, tactical, confident. Uses verbs like *engage*, *deploy*, *queue up*, *spike*, *duo*. Avoid syrupy dating-app copy.
- **Tone in error states:** brief, factual, never cute. Example: `Credentials rejected.` not `Oops, that didn't work!`.

---

## 2. Color Tokens

CSS variables live on `:root` and are overridden under `[data-theme="light"]`.

### 2.1 Dark (default)

| Token | Hex | Usage |
| --- | --- | --- |
| `--tm-bg` | `#0F1923` | Page background (deep navy) |
| `--tm-surface` | `#1F2731` | Cards, panels |
| `--tm-surface-2` | `#16202B` | Inset / secondary surface |
| `--tm-line` | `#2B3A47` | Hairlines, borders |
| `--tm-fg` | `#ECE8E1` | Primary text (off-white "Valorant cream") |
| `--tm-fg-muted` | `#8B9BA8` | Secondary text |
| `--tm-fg-dim` | `#5A6B78` | Tertiary, disabled |
| `--tm-accent` | `#FF4655` | Primary CTA / brand red |
| `--tm-accent-hover` | `#FF5864` | Hover state |
| `--tm-accent-press` | `#BD3944` | Pressed / active |
| `--tm-cyan` | `#5CE1E6` | Tactical highlight, link, focus ring |
| `--tm-warn` | `#F2C94C` | Warnings |
| `--tm-success` | `#A1E887` | Success / "MATCH" callouts |

### 2.2 Light

| Token | Hex | Notes |
| --- | --- | --- |
| `--tm-bg` | `#ECE8E1` | Off-white cream |
| `--tm-surface` | `#FFFFFF` | Cards |
| `--tm-surface-2` | `#F5F1EA` | Inset |
| `--tm-line` | `#D7D1C4` | Hairlines |
| `--tm-fg` | `#0F1923` | Primary text |
| `--tm-fg-muted` | `#4A5764` | Secondary |
| `--tm-fg-dim` | `#7C8893` | Tertiary |
| `--tm-accent` | `#FF4655` | Same red |
| `--tm-cyan` | `#1FA8AE` | Darker cyan for contrast on cream |

### 2.3 Contrast rules

- Body text on background: minimum AA (4.5:1).
- Red on dark navy passes AA Large; never use red on cream as small body text.
- Focus ring is always **cyan**, regardless of theme.

---

## 3. Typography

| Role | Family | Tracking | Case |
| --- | --- | --- | --- |
| Display (hero, section headers) | `Tungsten`, `Anton`, `Bebas Neue`, sans-serif | `0.04em` | **UPPERCASE** |
| Body | `Inter`, `DIN Next`, system sans | `0` | Sentence |
| Tactical readouts (counts, codes, timers) | `JetBrains Mono`, monospace | `0.06em` | UPPERCASE |

Type scale (rem):

| Step | Size | Line | Use |
| --- | --- | --- | --- |
| `display-xl` | 5.5 | 1.0 | Hero headline |
| `display-l` | 3.5 | 1.05 | Section heroes |
| `display-m` | 2.25 | 1.1 | Page titles |
| `h1` | 1.75 | 1.2 | Cards |
| `h2` | 1.25 | 1.25 | Subsections |
| `body` | 1.0 | 1.5 | Default |
| `small` | 0.875 | 1.5 | Captions, labels |
| `mono` | 0.75 | 1.4 | Tactical labels |

Display headings should pair with a thin red rule (`1px`, `--tm-accent`) above or beside them where space allows — a recurring Valorant motif.

---

## 4. Geometry & Shape

The look is **angular**, never pill-shaped. Buttons, cards, and badges have a single chamfered corner.

- **Standard chamfer:** clip 12 px from the **top-left** corner (`clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)`).
- **Inverse chamfer (cards):** clip from the **bottom-right** for a "duelist" feel.
- **Skew accent:** thin red diagonal bar (`transform: skewX(-20deg)`) used as a decorative element next to display headings.
- **Borders:** 1 px hairlines using `--tm-line`. Avoid drop shadows; use thin glow on focus only.

```css
.tm-clip-tl   { clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px); }
.tm-clip-br   { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%); }
.tm-skew-bar  { transform: skewX(-20deg); }
```

---

## 5. Spacing & Layout

- 4 px base unit. Tailwind's default scale fits.
- Page gutter: 24 px (mobile), 48 px (tablet), 96 px (desktop).
- Max content width: `1200px` for marketing, `760px` for forms.
- Sections separated by 80–120 px vertical rhythm on desktop, 56–72 px on mobile.

---

## 6. Components

### 6.1 Button

Variants: `primary`, `secondary`, `ghost`.

- **Primary**: filled `--tm-accent`, cream text, top-left chamfer, thin inner cyan stroke on focus, 1 px line on hover that extends 8 px below as an underbar.
- **Secondary**: transparent fill, 1 px `--tm-line` border, cream text, hover swaps border to `--tm-accent`.
- **Ghost**: text-only with hover underline; used in nav.

Sizes: `sm` (32 h), `md` (44 h, default), `lg` (52 h). Padding `1rem 1.5rem` at `md`.

Disabled: 40% opacity, no clip-path animation.

### 6.2 Input

- Background: `--tm-surface-2`, border 1 px `--tm-line`, top-left chamfer.
- Focus: 2 px cyan ring offset by 2 px, no shadow.
- Label: monospace, uppercase, `--tm-fg-muted`, sits **above** the input, prefixed with a red `▸` glyph.
- Error: replaces label color with `--tm-accent`; helper text in red below the field.

### 6.3 Card / Profile tile

- Surface: `--tm-surface`, bottom-right chamfer, 1 px `--tm-line` border.
- Top edge: 2 px gradient bar from `--tm-accent` → transparent (left to right).
- Photo: full-bleed inside the chamfer, cover-fit.
- Meta strip: monospace tactical labels for age/distance.

### 6.4 Match Banner

- When a mutual like fires, show a full-screen overlay:
  - Background: `--tm-bg` at 92% opacity.
  - Display text: "**SPIKE PLANTED**" → "MATCH FORMED" subline.
  - Two profile chips slide in from opposite edges with a `skewX(-20deg)` motion.

### 6.5 Footer

- Tone: dense, terse. Three columns on desktop, stacked on mobile.
- Top edge: 1 px `--tm-line`. No drop shadow.
- Wordmark left, tertiary nav center, copyright right.

---

## 7. Motion

- Default duration: **160 ms**. Hover lifts: **120 ms**. Page transitions: **240 ms**.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` for entrances; `cubic-bezier(0.4, 0, 1, 1)` for exits.
- Avoid bounce. Avoid spring. The aesthetic is **mechanical**.
- Reduce motion: respect `prefers-reduced-motion`; collapse all skew/translate animations to opacity fades.

---

## 8. Iconography & Imagery

- Icons: 1.5 px stroke, square caps, no rounding. Lucide is acceptable as a base; override stroke linecap to `square`.
- Photography: high-contrast, slightly desaturated, vignette towards corners. Avoid the soft pastel imagery typical of dating apps.

---

## 9. Theme Toggle Behavior

- Toggle exposed in the global header.
- Persists to `localStorage["tm_theme"]` as `"dark"` or `"light"`.
- On `<html>`, set `data-theme="dark"` or `data-theme="light"`. CSS variable overrides cascade from there.
- Inline script in `<head>` reads the stored value before hydration to prevent FOUC.
- If no value is stored, fall back to the system preference; once the user toggles, the explicit choice wins.

---

## 10. Accessibility Notes

- Contrast: AA minimum on body text in both themes.
- Focus: cyan 2 px outline with 2 px offset; never remove outlines.
- Hit targets: minimum 44 × 44 px on touch.
- Reduced motion: see § 7.
- Form errors: linked to inputs via `aria-describedby`; do not rely on color alone — pair red with the `▸` glyph.

---

## 11. Don'ts

- No rounded pill buttons.
- No gradients other than the thin red→transparent edge bar on cards.
- No drop shadows.
- No emoji in product chrome.
- No "playful" microcopy. Voice is tactical.
