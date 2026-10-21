---
version: 1
slug: "src-pages-landing-tsx"
primary_target: "src/pages/Landing.tsx"
related_targets: []
---

# Landing surface brief

Mode: Persuade. Visitor: a learner or front-end dev who wants to try an idea now. Action: start writing code in the live editor (primary), browse templates (secondary). Constraints: no auth, no invented customers or benchmarks. AI is described only as it really works: optional, on-device (Chrome's built-in model), rule-based fixes first, every fix checked in a sandbox and shown as a diff before Apply. No claim about quality beyond what the page itself demonstrates.

CTA RULE: every call to action on the page has its own label, destination and job, and appears once. Hero "Start coding" (blank editor, the primary). Fix section "Open this page in the editor" (carries the demo's code). Templates "Browse all N templates" and each card (that template). Close "Read the source" (GitHub). The nav carries links only, no button. Do not reintroduce a second "start" button.

## Direction contract

THESIS: CodeMe is a luminous, modern workshop for the three layers of a web page. The front door is an aurora of soft light; the product's own idea (HTML, CSS and JS as stacked layers) is shown as an exploded 3D view that separates as you scroll. It refuses the dark-IDE-with-neon hero and the browser-mockup hero. Direction pinned by the user: modern, aesthetic, artistic (replaced an earlier Riso-print direction the user disliked).

OWN-WORLD: Pearl ground (#f5f6fc) with ink type (#12122b); drifting aurora blobs in violet, coral and aqua, faded at section edges; one dark aurora close. Bricolage Grotesque at 800, tight tracking, for display; JetBrains Mono for code. Pill buttons, 16px radii, one layered elevation (.lift). Language inks fixed everywhere: HTML coral, CSS aqua, JS violet. Editor bench is deep indigo (#0b0b1a) with raised panels. No gradient text, no glass, no kickers.

STORY: One example runs through the page, a Pro plan card with a yearly switch. The hero shows it taking shape as CSS types itself and a click flips the switch; the pinned sequence builds it from HTML to CSS to JavaScript; the Fix section hands over a broken copy (4 accessibility findings and a JavaScript error) that the visitor fixes with the real checker, rules, sandbox check and, where the browser has it, the on-device model; the templates rail and the fork tree show where to start and how links work; the close points at the source. The example is never a bare "Press me" button.

FIRST VIEWPORT: Left: three-line headline ("Write code. Watch it come alive.") at ~5.75rem, one-line promise, one ink pill CTA "Start coding" and nothing else beside it. Right: a dark CSS window overlapped by a live output window that turns from an unstyled card into the finished plan card, floating over the aurora, with chips for Emmet, Prettier, a share link and a verified fix.

FORM: aurora-ui (ui-ux-pro-max style database), user-pinned over the dealt roll; roll reference seed:54c2d80e8256f045 (risograph-web-system was dealt and rejected by the user). Signature interaction: pinned scroll-scrubbed exploded view of HTML/CSS/JS layers (GSAP ScrollTrigger). Motion: one hero entrance, slow aurora drift; reduced-motion shows the final state.
