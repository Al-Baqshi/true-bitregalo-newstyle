# BitRegalo — The Global Gifting Marketplace

Landing page and legal framework for BitRegalo, a decentralized marketplace for gifting, services, and escrow — powered by blockchain technology.

**Live:** [bitregalo.com](https://bitregalo.com)  
**Repo:** [github.com/Al-Baqshi/true-bitregalo-newstyle](https://github.com/Al-Baqshi/true-bitregalo-newstyle)

---

## Quick Start (First Time)

```bash
# 1. Clone the repo
git clone https://github.com/Al-Baqshi/true-bitregalo-newstyle.git
cd true-bitregalo-newstyle

# 2. Install dependencies
yarn install

# 3. Start the dev server
yarn dev
```

Open **http://localhost:3000** in your browser.

That's it. No environment variables needed — this is a static site with no backend.

---

## Running the Project

### Local Development (Day-to-Day)

```bash
yarn dev
```

- Runs at **http://localhost:3000**
- Hot reload enabled (changes appear instantly)
- Use this for all development work

### Production Build (Testing Before Deploy)

```bash
# Build the production version
yarn build

# Start the production server locally
yarn start
```

- Runs at **http://localhost:3000**
- This is exactly what users see in production
- Use this to test performance, SEO, and final output before pushing

### Linting

```bash
yarn lint
```

- Runs ESLint across all files
- Run this before committing to catch errors

---

## Project Structure

```
true-bitregalo-newstyle/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page (main entry)
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # Design tokens + global styles
│   ├── docs/                     # Internal documents
│   │   ├── LEGAL-STRATEGY.md     # Legal positioning strategy
│   │   └── V4 BitRegalo Whitepaper-20260113130914.md
│   ├── privacy/page.tsx          # Privacy Policy page
│   ├── terms/page.tsx            # Terms of Service page
│   ├── token-terms/page.tsx      # Token Terms page
│   ├── kyc-policy/page.tsx       # KYC Policy page
│   ├── whitepaper/page.tsx       # Whitepaper viewer page
│   └── protocols/[slug]/page.tsx # Protocol detail pages (escrow, rfp, rts)
│
├── components/                   # React components
│   ├── navbar.tsx                # Navigation bar
│   ├── hero-section.tsx          # Hero with app mockup
│   ├── trust-bar.tsx             # Stats section
│   ├── how-it-works.tsx          # 4-step process
│   ├── app-download.tsx          # App download with phone mockups
│   ├── features-section.tsx      # Platform features carousel
│   ├── use-cases-section.tsx     # Use cases grid
│   ├── developer-portal.tsx      # SDK/API code examples
│   ├── tokenomics-section.tsx    # BTR & Regalo token info
│   ├── enterprise-section.tsx    # Enterprise solutions
│   ├── cta-section.tsx           # Call to action
│   ├── legal-disclaimer.tsx      # Legal notice section
│   ├── footer.tsx                # Footer with links
│   └── ui/                       # shadcn/ui components
│
├── public/                       # Static assets
│   ├── assets/                   # Images, SVGs
│   └── BrandLogo copy.svg        # BitRegalo logo
│
├── lib/                          # Utility functions
├── package.json                  # Dependencies
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Main marketing page with all sections |
| `/privacy` | Privacy Policy | NZ Privacy Act 2020 compliant |
| `/terms` | Terms of Service | Platform usage agreement |
| `/token-terms` | Token Terms | BTR/Regalo utility token terms |
| `/kyc-policy` | KYC Policy | Tiered verification requirements |
| `/whitepaper` | Whitepaper | V4 BitRegalo Whitepaper viewer |
| `/protocols/escrow` | Escrow Protocol | Escrow smart contract details |
| `/protocols/rfp` | RFP Protocol | Request for Proposal details |
| `/protocols/rts` | RTS Protocol | Request to Supply details |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI (shadcn/ui)
- **Icons:** Lucide React
- **Fonts:** Geist (sans), JetBrains Mono (code)
- **Analytics:** Vercel Analytics
- **Package Manager:** Yarn

---

## Design Tokens

Colors are defined in `app/globals.css` as CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.145 0 0)` | Page background (dark) |
| `--foreground` | `oklch(0.985 0 0)` | Primary text |
| `--accent` | `oklch(0.75 0.14 70)` | Gold/amber accent |
| `--card` | `oklch(0.17 0 0)` | Card backgrounds |
| `--muted-foreground` | `oklch(0.65 0 0)` | Secondary text |
| `--border` | `oklch(0.26 0 0)` | Border color |

---

## Deployment

### Current Setup

The site is deployed via **Vercel** (or your CI/CD pipeline) connected to the `main` branch.

**Every push to `main` triggers an automatic deployment.**

### Deploying (Production)

```bash
# 1. Make sure your changes are committed
git add .
git commit -m "Your changes"

# 2. Push to main
git push origin main

# 3. Deployment happens automatically
```

### Preview Deployments

If using Vercel, every pull request gets a preview URL automatically.

### Manual Deployment (if needed)

```bash
# Build for production
yarn build

# Export static files (if using static hosting)
# Add to next.config.ts: output: 'export'
# Then run: yarn build
# Files will be in /out directory
```

---

## Legal Documents

The site includes comprehensive legal documentation:

| Document | Route | Purpose |
|----------|-------|---------|
| Terms of Service | `/terms` | Platform usage agreement |
| Privacy Policy | `/privacy` | Data handling (Privacy Act 2020) |
| Token Terms | `/token-terms` | BTR/Regalo utility token terms |
| KYC Policy | `/kyc-policy` | Tiered verification requirements |
| Legal Strategy | `app/docs/LEGAL-STRATEGY.md` | Internal positioning document |

**Key Legal Positioning:**
- BitRegalo = technology platform (NOT financial service)
- Tokens = utility credits (NOT securities)
- KYC = tiered (no KYC for gifts < NZD $1,000)
- Jurisdiction = New Zealand

---

## Common Tasks

### Adding a New Page

1. Create `app/your-page/page.tsx`
2. Export a default component
3. Add route to `components/navbar.tsx` and `components/footer.tsx`

### Adding a New Section to Landing Page

1. Create `components/your-section.tsx`
2. Import and add to `app/page.tsx` in the correct order
3. Add navigation link in `components/navbar.tsx` if needed

### Updating the Logo

Replace `public/BrandLogo copy.svg` with your new logo file (keep the same filename).

### Changing Colors

Edit the CSS custom properties in `app/globals.css` under `:root` and `.dark`.

---

## Troubleshooting

### "yarn: command not found"
```bash
npm install -g yarn
```

### Port 3000 already in use
```bash
yarn dev -p 3001
```

### Build fails with TypeScript errors
```bash
# Check for type errors
npx tsc --noEmit

# Fix any errors shown, then rebuild
yarn build
```

### Dependencies out of date
```bash
yarn install --force
```

---

## Support

- **Website:** [bitregalo.com](https://bitregalo.com)
- **GitHub:** [github.com/Al-Baqshi/true-bitregalo-newstyle](https://github.com/Al-Baqshi/true-bitregalo-newstyle)
- **Email:** support@bitregalo.com

---

## License

© 2026 BitRegalo® Limited. All rights reserved.  
