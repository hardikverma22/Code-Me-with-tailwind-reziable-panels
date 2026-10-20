import type { Sources } from "./buildSrcDoc";
import { exampleSources } from "./example";
import { dashboardCss, dashboardHtml, dashboardJs, dashboardResources } from "./dashboardTemplate";

export type Template = Sources & { id: string; title: string; blurb: string; tags: ("html" | "css" | "js")[]; badge?: string };

export const templates: Template[] = [
  {
    id: "mission-control",
    title: "Mission Control dashboard",
    blurb: "An analytics dashboard with live charts, animated numbers and a live feed. Several libraries, one page.",
    tags: ["html", "css", "js"],
    badge: "Tailwind + Chart.js + GSAP + Lucide",
    html: dashboardHtml,
    css: dashboardCss,
    js: dashboardJs,
    tailwind: true,
    resources: dashboardResources,
  },
  {
    id: "neon-sphere",
    title: "Neon sphere",
    blurb: "Twenty dotted rings spinning in 3D. Pure CSS animation, built by JavaScript.",
    tags: ["html", "css", "js"],
    ...exampleSources,
  },
  {
    id: "loader-dots",
    title: "Bouncing loader",
    blurb: "Three dots with staggered keyframes. Copy it into any button or page.",
    tags: ["html", "css"],
    html: `<div class="dots" role="status" aria-label="Loading">
  <span></span><span></span><span></span>
</div>
`,
    css: `body { margin: 0; height: 100vh; display: grid; place-items: center; background: #12122b; }
.dots { display: flex; gap: 14px; }
.dots span {
  width: 22px; height: 22px; border-radius: 50%;
  background: #ff7351;
  animation: hop 0.9s cubic-bezier(0.3, 0, 0.3, 1) infinite;
}
.dots span:nth-child(2) { background: #e8f76a; animation-delay: 0.12s; }
.dots span:nth-child(3) { background: #22c7e6; animation-delay: 0.24s; }
@keyframes hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-38px); } }
@media (prefers-reduced-motion: reduce) { .dots span { animation: none; } }
`,
    js: "",
  },
  {
    id: "spin-cube",
    title: "Spinning cube",
    blurb: "A six-faced 3D cube using only transforms. No library.",
    tags: ["html", "css"],
    html: `<div class="stage">
  <div class="cube">
    <i>HTML</i><i>CSS</i><i>JS</i><i>web</i><i>fun</i><i>you</i>
  </div>
</div>
`,
    css: `body { margin: 0; height: 100vh; display: grid; place-items: center; background: #f5f6fc; font: 800 28px/1 system-ui; }
.stage { perspective: 700px; }
.cube { width: 140px; height: 140px; position: relative; transform-style: preserve-3d; animation: turn 9s linear infinite; }
.cube i {
  position: absolute; inset: 0; display: grid; place-items: center; font-style: normal; color: #12122b;
  border: 3px solid #12122b; opacity: 0.92;
}
.cube i:nth-child(1) { background: #ff7351; transform: translateZ(70px); }
.cube i:nth-child(2) { background: #e8f76a; transform: rotateY(90deg) translateZ(70px); }
.cube i:nth-child(3) { background: #22c7e6; transform: rotateY(180deg) translateZ(70px); }
.cube i:nth-child(4) { background: #ff7351; transform: rotateY(-90deg) translateZ(70px); }
.cube i:nth-child(5) { background: #e8f76a; transform: rotateX(90deg) translateZ(70px); }
.cube i:nth-child(6) { background: #22c7e6; transform: rotateX(-90deg) translateZ(70px); }
@keyframes turn { to { transform: rotateX(360deg) rotateY(360deg); } }
@media (prefers-reduced-motion: reduce) { .cube { animation: none; transform: rotateX(-25deg) rotateY(35deg); } }
`,
    js: "",
  },
  {
    id: "faq-accordion",
    title: "FAQ accordion",
    blurb: "Accessible open-and-close sections with the native details element.",
    tags: ["html", "css"],
    html: `<main>
  <h1>Questions</h1>
  <details open><summary>Do I need an account?</summary><p>No. Write code and share a link.</p></details>
  <details><summary>Can I change someone else's project?</summary><p>You can fork it. The original never changes.</p></details>
  <details><summary>Is it free?</summary><p>Yes.</p></details>
</main>
`,
    css: `body { margin: 0; min-height: 100vh; background: #12122b; color: #f5f6fc; font: 16px/1.5 system-ui; display: grid; place-items: center; }
main { width: min(520px, 90vw); }
h1 { font-size: 44px; margin: 0 0 18px; }
details { border-top: 2px solid #2a2a52; padding: 14px 0; }
summary { cursor: pointer; font-weight: 700; list-style: none; display: flex; justify-content: space-between; }
summary::after { content: "+"; color: #e8f76a; font-size: 22px; line-height: 1; }
details[open] summary::after { content: "–"; }
p { margin: 10px 0 0; color: #9a9bc8; }
`,
    js: "",
  },
  {
    id: "typewriter",
    title: "Typewriter headline",
    blurb: "Types, pauses and deletes a list of phrases. About 20 lines of JavaScript.",
    tags: ["html", "css", "js"],
    html: `<h1>I build <span id="word"></span><span class="caret"></span></h1>
`,
    css: `body { margin: 0; height: 100vh; display: grid; place-items: center; background: #5b3df5; color: #f5f6fc; font: 800 clamp(28px, 7vw, 56px)/1 system-ui; }
#word { color: #e8f76a; }
.caret { display: inline-block; width: 4px; height: 1em; background: #ff7351; margin-left: 4px; vertical-align: -0.1em; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
`,
    js: `const phrases = ["layouts", "animations", "components", "ideas"];
const el = document.getElementById("word");
let i = 0, n = 0, deleting = false;

function tick() {
  const word = phrases[i];
  n += deleting ? -1 : 1;
  el.textContent = word.slice(0, n);
  let delay = deleting ? 45 : 90;
  if (!deleting && n === word.length) { deleting = true; delay = 1200; }
  else if (deleting && n === 0) { deleting = false; i = (i + 1) % phrases.length; delay = 300; }
  setTimeout(tick, delay);
}
tick();
`,
  },
  {
    id: "theme-switch",
    title: "Dark mode switch",
    blurb: "A toggle that flips CSS variables and remembers nothing it shouldn't.",
    tags: ["html", "css", "js"],
    html: `<main>
  <h1>Hello, theme</h1>
  <button id="toggle" aria-pressed="false">Switch to dark</button>
</main>
`,
    css: `:root { --bg: #f5f6fc; --fg: #12122b; --accent: #ff7351; }
:root[data-theme="dark"] { --bg: #12122b; --fg: #f5f6fc; --accent: #e8f76a; }
body { margin: 0; height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--fg); font: 700 32px/1.1 system-ui; transition: background 0.3s, color 0.3s; }
main { text-align: center; }
button { margin-top: 18px; padding: 12px 20px; font: 700 16px system-ui; background: var(--accent); color: #12122b; border: 0; cursor: pointer; }
`,
    js: `const root = document.documentElement;
const btn = document.getElementById("toggle");
btn.addEventListener("click", () => {
  const dark = root.dataset.theme !== "dark";
  root.dataset.theme = dark ? "dark" : "light";
  btn.textContent = dark ? "Switch to light" : "Switch to dark";
  btn.setAttribute("aria-pressed", String(dark));
  console.log("theme:", root.dataset.theme);
});
`,
  },
  {
    id: "todo",
    title: "Tiny to-do list",
    blurb: "Add, check off and remove tasks. Event delegation in plain JavaScript.",
    tags: ["html", "css", "js"],
    html: `<main>
  <h1>Today</h1>
  <form id="form"><input id="input" placeholder="Add a task" autocomplete="off" required /><button>Add</button></form>
  <ul id="list"></ul>
</main>
`,
    css: `body { margin: 0; min-height: 100vh; background: #22c7e6; color: #12122b; font: 16px/1.4 system-ui; display: grid; place-items: start center; padding-top: 12vh; }
main { width: min(420px, 90vw); }
h1 { font-size: 48px; margin: 0 0 16px; }
form { display: flex; gap: 8px; }
input { flex: 1; padding: 12px; border: 2px solid #12122b; background: #f5f6fc; font: inherit; }
button { padding: 0 18px; background: #12122b; color: #f5f6fc; border: 0; font: 700 15px system-ui; cursor: pointer; }
ul { list-style: none; padding: 0; margin: 18px 0 0; }
li { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #12122b; cursor: pointer; }
li.done span { text-decoration: line-through; opacity: 0.55; }
li b { cursor: pointer; }
`,
    js: `const list = document.getElementById("list");
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("input");
  const li = document.createElement("li");
  li.innerHTML = "<span></span><b aria-label='Remove'>×</b>";
  li.firstChild.textContent = input.value;
  list.prepend(li);
  input.value = "";
});
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  if (e.target.tagName === "B") li.remove();
  else li.classList.toggle("done");
});
`,
  },
  {
    id: "grid-layout",
    title: "Responsive grid",
    blurb: "Auto-fitting columns with CSS Grid. Resize the preview to watch it reflow.",
    tags: ["html", "css"],
    html: `<div class="grid">
  <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div><div>9</div><div>10</div><div>11</div><div>12</div><div>13</div><div>14</div>
</div>
`,
    css: `body { margin: 0; padding: 24px; background: #12122b; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.grid div { aspect-ratio: 1; display: grid; place-items: center; font: 900 40px system-ui; color: #12122b; background: #ff7351; mix-blend-mode: screen; }
.grid div:nth-child(3n+2) { background: #e8f76a; }
.grid div:nth-child(3n) { background: #22c7e6; }
`,
    js: "",
  },
];

export const templateById = (id: string) => templates.find((t) => t.id === id);
