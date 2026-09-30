# Design System

## Design read

Trust-first Indian exam-prep bookstore for Telangana aspirants who shop on mobile. The visual
language is taken from the *Target Police* cover (deep navy, white, red, gold, heavy condensed
headlines) and translated into a calm, professional commerce UI. It should feel like a serious
publisher, not a poster and not a template.

Dials (taste skill): `DESIGN_VARIANCE 5 · MOTION_INTENSITY 3 · VISUAL_DENSITY 5`.

## Principles

1. **The book is the hero.** Covers are shown large, on neutral surfaces, never cropped.
2. **Price clarity.** Selling price, MRP (struck) and discount always read in one glance.
3. **Trust over flash.** Delivery, payment security and tracking information near every CTA.
4. **Mobile first.** Designed at 375px first; sticky Add to Cart / Buy Now on product pages.
5. **Honest content.** No invented numbers, reviews or claims (see PRD content rules).

## Colour tokens (light theme only)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0B1733` | Primary text, footer background |
| `navy-900` | `#10214D` | Brand surfaces, header strip, headings |
| `navy-700` | `#1F3B7A` | Links, focus rings, secondary buttons |
| `navy-100` | `#E6EBF5` | Tinted sections, chips |
| `navy-50` | `#F3F6FB` | Page canvas behind cards |
| `red-600` | `#C8102E` | **The one action colour**: primary CTAs, cart badge |
| `red-700` | `#A30D25` | Primary CTA hover/active |
| `gold-400` | `#F2B705` | Highlight only: discount badge, "2026 edition" tag, stars |
| `gold-100` | `#FFF4CF` | Highlight backgrounds |
| `muted` | `#4B5673` | Secondary text (≥ 4.5:1 on white) |
| `line` | `#D8DEEA` | Borders, dividers |
| `success` | `#157347` | In stock, paid, delivered |
| `warning` | `#9A5B00` | Low stock, pending |
| `danger` | `#C8102E` | Errors (same red as CTA, used with icons/text) |

Rules: red is for actions, gold is for highlights, navy is the brand. Never put gold text on
white (fails contrast); gold is a background with ink text. No gradients except a subtle
navy tint in the hero. Shadows are navy-tinted, never pure black.

## Typography

| Role | Font | Weights |
|---|---|---|
| Display / headings | **Archivo** (variable, width axis; condensed 75-85 for H1/H2) | 700, 800 |
| UI / body | **Hanken Grotesk** | 400, 500, 600, 700 |

Scale (mobile → desktop): H1 `text-3xl → text-5xl`, H2 `text-2xl → text-3xl`,
H3 `text-lg → text-xl`, body `text-base`, small `text-sm`. Body max width `65ch`.
Numbers in prices use `tabular-nums`. Loaded with `next/font` (self-hosted, swap).

## Shape and spacing

- Radius rule: **controls 8px** (buttons, inputs, selects), **cards 12px**, **badges full pill**.
- Spacing on a 4px grid; sections `py-12 md:py-16`; container `max-w-7xl px-4 md:px-6`.
- Borders `1px line`; elevation only for overlays (drawer, modal, dropdown, sticky bar).

## Components

- **Button**: `primary` (red), `secondary` (navy outline), `ghost`, `danger`; sizes sm/md/lg;
  `loading` state with spinner + disabled; `:active` translates 1px down.
- **Input / Select / Textarea**: label above, helper below, error below in danger colour,
  never placeholder-as-label, 44px min touch target.
- **Badge**: tone `neutral | brand | highlight | success | warning | danger`.
- **ProductCard**: cover (3:4, contain on navy-50), exam chips, title (2 lines), author,
  PriceDisplay, stock line, Add to Cart + Buy Now.
- **PriceDisplay**: selling price (bold, ink), MRP struck (muted), `-NN%` gold badge.
  If no price: "Price to be announced", and buy buttons disabled.
- **Timeline** (order/tracking): vertical steps, completed = navy check, current = red ring,
  future = muted.
- **States**: Skeleton loaders shaped like the final layout; EmptyState (icon, one line, one
  action); ErrorState (plain message + retry). No spinners for page loads.

## Iconography

Phosphor icons, `weight="regular"` (bold for small sizes ≤ 16px). One family only.
No emoji. No hand-drawn SVG icons.

## Motion

Only: hover/press feedback on buttons and cards (150ms), drawer/modal slide (200ms),
image gallery crossfade. Respect `prefers-reduced-motion`. No scroll-triggered animations,
no marquees, no parallax.

## Copy rules

- Plain, direct English. Short headlines (≤ 8 words).
- No em dashes or en dashes in UI copy; use commas, periods or a hyphen.
- No filler words ("elevate", "seamless", "unleash").
- One label per intent (e.g. "Track order" everywhere, never also "Where is my order").
- Hero: "Prepare smarter. Score better." + one sentence + "Explore books" / "Track order".

## Layout per page

- **Header (desktop)**: logo · Books · Categories (menu) · search (wide) · Track order ·
  Account · Cart. Max 72px high, one line.
- **Header (mobile)**: logo · search icon · cart · menu (drawer). Search opens full width.
- **Home**: split hero (copy left, real book cover right) → featured books (grid) → browse by
  exam (large tiles) → best sellers (horizontal scroll row) → new arrivals (grid) → why buy
  direct (2-col asymmetric) → browse by subject (chips) → author & publisher (split) →
  reviews (only if approved reviews exist) → FAQ (accordion) → newsletter/contact → footer.
  No layout family repeats more than once.
- **Product (desktop)**: gallery left (sticky), buy box right. **Mobile**: gallery, buy box,
  sticky bottom bar with price + Add to Cart + Buy Now.
- **Checkout**: single column on mobile with step headers; 2-col with sticky summary on desktop.
- **Admin**: sidebar + content, dense tables, same tokens, no marketing styling.

## Accessibility

WCAG 2.2 AA: contrast ≥ 4.5:1 for text, visible focus ring (`navy-700`, 2px offset),
keyboard reachable menus/drawers/accordions, `aria-live` for cart and form errors,
alt text on every cover (book title + "cover"), forms with proper labels and autocomplete.

## Breakpoints to QA

375px, 768px, 1024px, 1440px.
