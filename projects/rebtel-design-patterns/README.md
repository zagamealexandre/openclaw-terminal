# Rebtel Design Patterns

Central design system + prototype playground for Rebtel 3.0 work. Built with Next.js, TypeScript, Tailwind 4, and mobile-first components locked to a 390px canvas.

## Highlights

- **Design system** documented in `design_sytems.md` with tokens, typography, spacing, pictograms, and reusable atoms/molecules/organisms.
- **Template library** under `templates/` for PRDs (`rebtel-prd.md`) and Jira tickets (`rebtel-jira-ticket.md`).
- **Reference flows**: onboarding (`/onboarding`), out-of-credit calling experiment (`/new_home`), and other component sandboxes.
- **Data helpers**: curated country lists, mock contacts, and pricing plans for quick prototypes.

## Repo

- GitHub: https://github.com/zagamealexandre/rebtel-design-patterns
- Local clone: `~/.openclaw/workspace/rebtel-design-patterns`

## How We Use It

1. Start every prototype here (Next.js). When the idea hardens, mirror the folder in `~/Documents/new Project/` using `YYYYMMDD-feature-name`.
2. Keep the README in each prototype folder up to date with the PRD + Jira ticket (use the templates above).
3. When code ships to GitHub, email the PRD + Jira ticket to stakeholders and CC `alexandre.zagame@rebtel.com`.

## Stack

- Next.js 14+/App Router
- Tailwind CSS v4 + CSS variable tokens
- TypeScript + ESLint
- Vercel Postgres (Neon) compatibility for real data, mock JSON for prototypes

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

Keep `design_sytems.md` and the templates synced with whatever we learn from new experiments so downstream teams stay aligned.
