# BitRegalo design system

How BitRegalo looks and why. Code is the source of truth (`app/globals.css`, `components/app/ui.tsx`, `components/app/nav.ts`); this file explains the decisions so the web app, the site and the coming mobile app stay one product. Product facts live in `PRODUCT.md`.

## The idea

A statement, not a dashboard. People come to BitRegalo to move payments they care about, often for the first time on a blockchain. Every screen should read like a well-kept financial statement: a clear title, plain words, exact figures aligned on the right, and the state of every record said in a word. Expression lives in a few precise details (the flared headline face, the gold of "held" money, the escrow demo on the landing page), never in decoration.

## Themes

Two themes from one palette, chosen by the visitor (Light, Dark, or Match my device; default is the device setting).

| Role | Paper (light) | Obsidian (dark) | Use |
|---|---|---|---|
| `background` | `#fbfaf7` | `#0b0d10` | Page |
| `card` | `#ffffff` | `#13161b` | Surfaces that hold a list, a form, a set of facts |
| `popover` | `#ffffff` | `#1a1e24` | Menus, sheets, dialogs |
| `secondary` | `#f3f0ea` | `#1c2027` | Quiet fills: secondary buttons, notices, selected nav item |
| `foreground` | `#15181d` | `#f3eee3` | Text |
| `muted-foreground` | `#54514a` | `#bcb5a7` | Secondary text |
| `subtle` | `#6b675f` | `#9c968a` | Captions, tertiary text |
| `border` | `#e4e0d7` | `#272b32` | Dividers |
| `border-strong` | `#8f897d` | `#726e65` | Control outlines (3:1 against their surface) |
| `primary` | `#c9a253` gold, ink label | `#d8b46a` gold, ink label | The one primary button on a view |
| `gold` (+ `gold-fill`, `gold-line`) | `#7d5b10` | `#dfbd76` | Held, open, selected, links |
| `success` (+ `success-fill`) | `#17694d` | `#5cc49d` | Settled, paid, positive |
| `destructive` (+ `destructive-fill`) | `#b0271f` | `#f47b72` | Failed, destructive |

Rules:

- Gold is the only accent. It is the primary button in both themes, and marks payments that are held or open, the current selection, and links. Emerald means it settled. Red is reserved for failure and destruction.
- One primary button per view. The header's wallet button is an outline so a page's own prompt to connect stays the primary.
- Every text pair meets WCAG AA in both themes (most reach AAA); control borders meet 3:1. Never fade text with opacity to make it secondary: use `muted-foreground` or `subtle`.
- Brand orange appears only as the dot on the "i" of the wordmark.
- Status is always said in words (a `Pill` carries a dot, a fill and a word), never by colour alone.
- People are the **buyer** and the **supplier**; outcomes are **released**, **handed back** and **returned**. The contract's own terms (issuer, receiver, cancel) appear only in technical reference.

## Type

One family, **Commissioner** (variable, self-hosted in `app/fonts`). Its flare axis is opened for headings, which echoes the flared strokes of the BitRegalo wordmark; text and figures stay plain. **Geist Mono** is used only for machine strings: wallet and contract addresses, hashes, code.

| Role | Class | Size | Used for |
|---|---|---|---|
| Display | `t-display` | 40 to 84px, fluid | Landing hero only |
| Headline | `t-headline` | 30 to 50px, fluid | Landing section titles, document titles |
| Title | `t-title` | 28 / 32px | Page title (the one `h1`) in the app |
| Heading | `t-heading` | 21px | Section titles (`h2`) |
| Subheading | `t-subheading` | 17px | Card titles, list item titles |
| Body | `text-base` | 16px | Reading text |
| Small | `text-sm` | 15px | Secondary text, dense UI, table cells |
| Caption | `text-xs` | 13px | Captions, fine print. The floor: nothing smaller. |
| Figure | `t-figure` | 28px, tabular | Headline numbers |

- Amounts and counts use tabular figures (`t-num`) so columns line up.
- No uppercase labels, no letter-spaced small caps, no kicker above a heading.
- Reading measure stays between 45 and 75 characters (`max-w-[62ch]` to `[68ch]`). Long-form pages use `.prose-doc` at 17px.
- Light text on dark surfaces is set one notch heavier (`--body-weight` 430 vs 400) so the two themes read with equal weight.

## Layout and navigation

There are two places a person can be, and both use the same layout so it only has to be learned once (and carries straight into the mobile app). The model is defined once in `components/app/nav.ts`.

- **The BitRegalo network** (`/app`): open to everyone. Home; Marketplace (browse by country, requests, listings); Payments (sent and received, escrows, my activity); For organisations (workspaces, connect a platform). It runs on BitRegalo's own public workspace, so its pages are the workspace pages served at `/app`.
- **An organisation's workspace** (`/app/t/{id}`): Overview; Market (shop, requests, listings); Payments (sent and received, escrows, treasury, tokens); Set up (projects, settings, connect a platform). The sidebar names the workspace and links back to the network.
- On a desktop both are a left sidebar. On a phone they are bottom tabs (Home or Overview, Market, **New**, Payments, More), with the pages of the current tab as a row of tabs under the top bar. **New** lists what can be started here: send money, get paid, hold money for someone, ask for something, offer something (and, in a workspace, sell, create a token, start a project).
- The top bar's place switcher shows where you are (BitRegalo network, or the workspace's name) and moves between the network and every organisation workspace.
- Pages that need a newer contract version are hidden from the navigation of older workspaces.
- Page content sits in a single column up to 56rem wide. Sections are separated by space first; a `Card` is used only when a set of records or a form needs a surface. Cards are never nested.

## Components

All in `components/app/ui.tsx` unless noted.

- `PageHead`: the page `h1`, one sentence of explanation, the page's main action, an optional back link.
- `Section` / `Card`: a titled part of a page without / with a surface.
- `LedgerRow`: one record. Title, a "who, how, when" line, the amount on the right, the state as a `Pill`. The whole row is the link.
- `Stats` / `Stat`: headline numbers set as the totals of a statement.
- `Facts` / `Fact`: label and value pairs (the rules of a workspace, a receipt).
- `Notice`: a message that belongs to the page (a limit, a warning).
- `Empty`: what this place is for and the first step, when there is nothing yet.
- `Addr`, `Amount`, `Pill`, `Field` + `inputCls`, `RowsSkeleton`.
- `components/ui/sheet.tsx`: a bottom sheet on a phone and a centred dialog on wider screens; used for the wallet picker, the New menu and the More menu.
- `components/app/wizard/*`: every multi-step task. Steps on the left (desktop) or a progress bar (phone), one step at a time, then a review that lists the transactions to be signed. A failed signature resumes from where it stopped.

## Motion

Motion explains state and confirms input; it is never decoration.

- Buttons squeeze to 98% on press. Menus scale from their trigger in 150ms. Sheets slide up in 300ms. Easing is a strong ease-out (`--ease-out`).
- Content that arrives after a decision (a wizard step, a result) rises 6px as it fades in.
- The landing page's escrow demo moves the payment along its only three paths in 700ms.
- Everything respects reduced-motion settings.

## Phone

- Body text is 16px; nothing is under 13px. Fields are 16px on touch screens so iOS does not zoom.
- Touch targets are at least 44px (buttons, inputs, nav items and menu rows grow on coarse pointers).
- The top bar and bottom tabs respect the notch and home indicator (`viewport-fit=cover` with safe-area padding). The status-bar colour follows the theme.
- No tap highlight flash, no text selection on long-press of controls, no double-tap zoom delay.

## Voice

Plain, direct and calm, in British/NZ spelling and sentence case. Say what happens to the payment and who can move it. Never write "money"; say payment, USDT or tokens. Use the product's words (workspace, request, listing, escrow, treasury, token) and never internal ones (tenant, instance, RFP state numbers). Label demonstrations as examples; never invent customers, figures or claims.
