# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Front-end learners and creators sketching ideas fast, and working front-end developers prototyping components or sharing bug repros. Both want to type code and see it run instantly, with no setup and no account.

## Product Purpose
CodeMe is a free browser playground for HTML, CSS and JavaScript: write code, watch it run live, read console output, and share a short link anyone can open and fork. Success is time-to-first-render measured in seconds, and links that people actually pass around.

## Positioning
Fast and light where StackBlitz and CodeSandbox are heavy, and open to hand-editing where AI app builders (v0, Lovable, Bolt) are generation-only. Sharing needs no account: a link is a snapshot, and forking is one edit and one Share away.

## Operating Context
Used in a browser tab, often next to documentation, on desktop and phone. Sessions are short. People return to saved work and paste links into chats, issues and tutorials.

## Capabilities and Constraints
- Surfaces: landing page, editor workspace, template gallery, my saved projects.
- Editor: HTML/CSS/JS CodeMirror 6 with Emmet and Prettier, sandboxed live preview, console, responsive mobile layout.
- Backend: Convex (projects table of immutable snapshots, fork parent slug). No auth yet; "my projects" is device-local for now.
- Stack: Vite, React 19, TypeScript, Tailwind CSS 4, Zustand. Motion with GSAP; components may come from 21st.dev. Hosted on Vercel.
- AI is optional and costs nothing to run: only Chrome's built-in on-device model (no key, no account, no server), offered when a fix needs it, never required. Nothing is generated from a prompt, and every proposed change is checked in a sandbox and shown as a diff before it is applied. No paid AI tier.

## Brand Commitments
Name is CodeMe. Tone: plain, confident, no hype. Free.
