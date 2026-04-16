

## Cold Call Script Creator — Implementation Plan

A standalone React + TypeScript app using **Ant Design** (replacing Tailwind) that guides users through building a structured cold call script with live preview.

### Architecture

- **Remove Tailwind** entirely (config, PostCSS, index.css utilities) — replace with Ant Design's design system and CSS-in-JS/plain CSS
- **Ant Design** with `ConfigProvider` for theming + dark mode toggle
- **localStorage** for auto-save/restore of all form data
- **Vite PWA** plugin with service worker guards per spec

### App Structure

**Header**: App title, subtitle, dark mode toggle (Ant `Switch`)

**Script Builder** — 10 collapsible `Collapse` panels, one per script stage:
1. **Opener** — name, business, prospect, greeting style
2. **Permission Ask** — single text field
3. **Reason for Call** — why, target, context
4. **Problem/Pain** — main/secondary pain, frustration, summary
5. **Agitate** — consequences, slowdowns, cost
6. **Value Proposition** — service, benefits, differentiator, proof
7. **Qualifying Question** — primary + optional secondary
8. **CTA** — type (preset select), CTA line, alternative
9. **Objections** — dynamic cards with add/edit/delete/reorder (drag via `dnd-kit`). Each card: label, objection line, rebuttal, optional follow-up, optional fallback CTA. Preset objection labels available.
10. **Close** — positive close, neutral fallback

**Live Script Preview** — rich-text formatted output below the form (side-by-side on desktop). Sections clearly labeled, objection branches formatted as conversation flow. Includes **Copy Script** and **Clear All** (with confirm) buttons. Print-friendly styles.

### Responsive Layout
- Mobile: single column, form above preview
- Desktop (≥992px): two-column layout via Ant `Row`/`Col`

### Dark Mode
- Toggle stored in localStorage
- Ant Design `ConfigProvider` with `theme.algorithm` switching between `defaultAlgorithm` and `darkAlgorithm`

### PWA Setup
- `vite-plugin-pwa` with manifest, icons, service worker guard in `main.tsx`
- Placeholder 192x192 and 512x512 icons generated

### Key Files
- `src/App.tsx` — layout, theme provider, dark mode state
- `src/components/ScriptBuilder.tsx` — the collapsible form
- `src/components/ScriptPreview.tsx` — live formatted output
- `src/components/ObjectionCards.tsx` — dynamic objection handling with drag-reorder
- `src/hooks/useScriptData.ts` — form state + localStorage persistence
- `src/types.ts` — TypeScript interfaces for script data
- Remove all Tailwind references and unused shadcn components

