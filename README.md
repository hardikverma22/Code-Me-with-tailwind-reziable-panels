# CodeMe

A fast, free playground for HTML, CSS and JavaScript, with optional Tailwind. Write code, see it run, share a short link anyone can open and fork. No account.

**Live:** https://code-me-with-tailwind-reziable-pane.vercel.app

## What it does
- Live preview in a sandboxed iframe, with a console that maps errors to your own JavaScript line
- CodeMe editors (CodeMirror 6) with Emmet and Prettier
- Settings panel: Tailwind v4 (browser build, for development use) and external scripts/styles loaded before your code
- Share saves an immutable snapshot at `/p/<slug>`; opening one and sharing again creates a fork
- Export as a small static project (ZIP), templates, and a local "My work" list
- Resizable panels, mobile layout, reduced-motion support

## Develop
```bash
npm install
npm run dev        # http://localhost:5173
npx convex dev     # backend (needs a free Convex account; sets VITE_CONVEX_URL)
npm test && npm run lint && npm run build
```
Stack: Vite, React 19, TypeScript, Tailwind CSS 4, Zustand, CodeMirror 6, GSAP, Convex.

## Decisions

**The preview sandbox has no `allow-same-origin`.** The iframe uses `sandbox="allow-scripts allow-modals allow-forms"`. Combining `allow-scripts` with `allow-same-origin` lets the embedded page remove its own sandbox, so it is never added ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Element/iframe), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)). A unit test fails if it ever is. Popups and top-level navigation are also off, so `window.open` inside a preview does nothing by design.

**Sharing is a snapshot, not a live document.** A share can never be edited by anyone, including its author, so a link can't be vandalised. Forking is "open, edit, Share again": it creates a new snapshot that records its parent's slug. Nothing is overwritten and no account is needed. The tradeoff is that an author can't update a link in place.

**Convex only stores short links and forks.** The code itself never needs a server to run. Without a backend configured, Share falls back to a compressed URL hash (lz-string), so the app still works offline of any service.

**Abuse model for the public write path.** Anyone can call a public endpoint, so writes are what's metered, not trusted:
- Clients can't call the database directly. The only way to create a share is `POST /share`, an HTTP action in front of an **internal** mutation.
- It validates types and size (200 KB of code, 400 KB of body) before touching the database.
- Rate limits use Convex's `@convex-dev/rate-limiter`: per IP, at most 10 new shares a day and 3 in a burst; plus a global cap of 1,500 shares per hour as a circuit breaker. Sharing identical content returns the existing link and uses no quota (content is hashed with SHA-256).
- An optional Cloudflare Turnstile challenge is verified server-side when `TURNSTILE_SECRET` is set. Limits run in the same transaction as the insert, so a failed write doesn't burn quota.
- Slugs are 8 characters from a 32-letter alphabet (about 10^12 combinations) and are only validated, never listed. There is no endpoint that enumerates projects.
- Not covered: a distributed attack from many IPs (the global cap bounds the damage; turn on Turnstile for a bot challenge); old snapshots are never deleted yet (a retention cron is the next step).

**Tailwind runs through its browser build.** Tailwind documents this build as development-only. CodeMe uses it so snippets work with zero setup, labels it in the toolbar, and the Export download adds a note to use the Tailwind CLI for production.

**Errors point at your line.** The preview injects the line offset of your JavaScript, so `ReferenceError … (JS line 4)` refers to line 4 of your script, not the generated document.

## Known limits
- Tailwind needs internet access (it loads from a CDN).
- No real-time collaboration and no npm packages; the preview is intentionally a plain browser document.
- "My work" lives on the device until accounts exist.
