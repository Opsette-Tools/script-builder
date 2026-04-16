# Script Builder

A free tool for building a structured cold call script in minutes. A [Opsette](https://opsette.io) marketplace app.

🔗 **Live app:** [https://deebuilt.github.io/script-builder/](https://deebuilt.github.io/script-builder/)

## What it does

Script Builder walks you through the parts of a working cold call and gives you a printable, readable script at the end. You can:

- Load a starter draft for your industry and rewrite it in your own words
- Pick from five script styles: permission-based, direct, question-led, referral, or value-first
- Add the objections you expect and the rebuttals you want to have ready
- Copy, export as `.txt`, or print the finished script
- Install it as an app on your phone or desktop (PWA)

It runs entirely in your browser. Your scripts are saved to `localStorage` and never leave your device.

## Starter templates

Starter drafts are grouped by **service domain** rather than specific trade, and each one has a free-text field so you can fill in your own specialty:

- 🏠 Home Services — e.g. HVAC, plumbing, landscaping, cleaning
- 💇 Personal Services — e.g. pet grooming, mobile detailing, massage
- 🩺 Wellness & Clinical — e.g. dental, med spa, chiropractic
- 🎉 Creative & Event — e.g. event planners, interior designers
- 💼 Professional & Creative Services — e.g. consulting, coaching, agencies

The starters are deliberately generic. They're a skeleton, not a finished script — edit each section until it sounds like you.

## Tech stack

- Vite + React 18 + TypeScript
- Ant Design for UI
- `vite-plugin-pwa` for offline support and install-to-home-screen
- GitHub Pages deployment via GitHub Actions

## Local development

```bash
npm install
npm run dev    # http://localhost:8080/script-builder/
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and deploys to GitHub Pages. Pages must be set to **Source: GitHub Actions** in repo settings.

The `base` path in `vite.config.ts` must match the repo name. If you rename the repo, update `BASE` in that file.

## Privacy

No tracking, no accounts, no server. All data stays in your browser.

## License

MIT
