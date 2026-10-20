import type { Resource } from "./buildSrcDoc";

export const dashboardResources: Resource[] = [
  { kind: "script", url: "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.js" },
  { kind: "script", url: "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" },
  { kind: "script", url: "https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js" },
];

export const dashboardHtml = `<div class="min-h-screen p-5 md:p-8">
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-sm text-slate-400">Overview</p>
      <h1 class="text-2xl font-extrabold tracking-tight md:text-3xl">Mission Control</h1>
    </div>
    <div class="seg" role="group" aria-label="Date range">
      <button class="seg-btn on" data-range="7">7 days</button>
      <button class="seg-btn" data-range="30">30 days</button>
      <button class="seg-btn" data-range="90">90 days</button>
    </div>
  </header>

  <section class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <article class="panel kpi"><i data-lucide="users"></i><p class="label">Visitors</p><p class="num" data-key="visitors">0</p></article>
    <article class="panel kpi"><i data-lucide="mouse-pointer-click"></i><p class="label">Signups</p><p class="num" data-key="signups">0</p></article>
    <article class="panel kpi"><i data-lucide="gauge"></i><p class="label">Conversion</p><p class="num" data-key="conv" data-suffix="%" data-dec="1">0</p></article>
    <article class="panel kpi"><i data-lucide="timer"></i><p class="label">Avg. load</p><p class="num" data-key="load" data-suffix="ms">0</p></article>
  </section>

  <section class="mt-3 grid gap-3 lg:grid-cols-3">
    <div class="panel lg:col-span-2"><h2>Traffic</h2><div class="h-64"><canvas id="line"></canvas></div></div>
    <div class="panel"><h2>Sources</h2><div class="h-64"><canvas id="donut"></canvas></div></div>
  </section>

  <section class="panel mt-3">
    <h2 class="flex items-center gap-2"><span class="live-dot"></span> Live activity</h2>
    <ul id="feed" class="mt-3 divide-y divide-white/5 text-sm"></ul>
  </section>
</div>
`;

export const dashboardCss = `/* Tailwind v4 is on, so @apply works in this tab. */
body { @apply bg-slate-950 font-sans text-slate-100; }

.panel { @apply rounded-2xl bg-slate-900/70 p-5 ring-1 ring-white/10; }
.panel h2 { @apply text-sm font-bold text-slate-300; }

.kpi { @apply relative overflow-hidden; }
.kpi [data-lucide] { @apply mb-3 size-5 text-violet-400; }
.kpi .label { @apply text-sm text-slate-400; }
.kpi .num { @apply mt-1 text-3xl font-extrabold tracking-tight; font-variant-numeric: tabular-nums; }

.seg { @apply flex gap-1 rounded-full bg-slate-900 p-1 ring-1 ring-white/10; }
.seg-btn { @apply cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white; }
.seg-btn.on { @apply bg-white text-slate-900; }

.live-dot { @apply relative size-2 rounded-full bg-emerald-400; }
.live-dot::after { content: ""; @apply absolute inset-0 rounded-full bg-emerald-400; animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes ping { 75%, 100% { transform: scale(2.6); opacity: 0; } }

#feed li { @apply flex items-center justify-between gap-3 py-2.5; }
#feed .who { @apply font-semibold text-slate-200; }
#feed .when { @apply text-xs text-slate-500; }

@media (prefers-reduced-motion: reduce) { .live-dot::after { animation: none; } }
`;

export const dashboardJs = `// Chart.js draws the charts, GSAP animates the numbers, Lucide draws the icons.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
lucide.createIcons();

// Small seeded generator so the same range always gives the same chart.
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function dataFor(days) {
  const rnd = seeded(days * 97);
  const labels = [], visits = [];
  let base = 1800 + days * 4;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    labels.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
    base += (rnd() - 0.42) * 260;
    visits.push(Math.round(Math.max(600, base + Math.sin(i / 3) * 140)));
  }
  const total = visits.reduce((a, b) => a + b, 0);
  const signups = Math.round(total * (0.031 + rnd() * 0.01));
  return { labels, visits, kpis: { visitors: total, signups, conv: (signups / total) * 100, load: Math.round(380 - rnd() * 90) } };
}

// ---- Charts
Chart.defaults.color = "#94a3b8";
Chart.defaults.font.family = "system-ui, sans-serif";
Chart.defaults.borderColor = "rgba(148,163,184,0.12)";

const lineCtx = document.getElementById("line").getContext("2d");
const fill = lineCtx.createLinearGradient(0, 0, 0, 260);
fill.addColorStop(0, "rgba(139,92,246,0.45)");
fill.addColorStop(1, "rgba(139,92,246,0)");

const line = new Chart(lineCtx, {
  type: "line",
  data: { labels: [], datasets: [{ data: [], borderColor: "#a78bfa", backgroundColor: fill, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 }] },
  options: {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } }, y: { ticks: { maxTicksLimit: 5 } } },
    animation: { duration: reduced ? 0 : 900 },
  },
});

const donut = new Chart(document.getElementById("donut"), {
  type: "doughnut",
  data: { labels: ["Search", "Direct", "Social", "Referral"], datasets: [{ data: [44, 27, 18, 11], backgroundColor: ["#8b5cf6", "#22d3ee", "#f472b6", "#fbbf24"], borderWidth: 0, hoverOffset: 8 }] },
  options: { maintainAspectRatio: false, cutout: "68%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } } } },
});

// ---- KPIs
const nums = {};
document.querySelectorAll(".num").forEach((el) => (nums[el.dataset.key] = { el, v: 0 }));

function showKpis(kpis) {
  for (const [key, n] of Object.entries(nums)) {
    const target = kpis[key], dec = Number(n.el.dataset.dec || 0), suffix = n.el.dataset.suffix || "";
    const paint = () => (n.el.textContent = n.v.toLocaleString("en", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix);
    if (reduced) { n.v = target; paint(); continue; }
    gsap.to(n, { v: target, duration: 1.2, ease: "power3.out", onUpdate: paint });
  }
}

function render(days) {
  const d = dataFor(days);
  line.data.labels = d.labels;
  line.data.datasets[0].data = d.visits;
  line.update();
  showKpis(d.kpis);
  console.log("range", days + "d", "visitors", d.kpis.visitors);
}

document.querySelectorAll(".seg-btn").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("on", x === b));
    render(Number(b.dataset.range));
  })
);

// ---- Live feed
const events = ["signed up", "upgraded to Pro", "opened a project", "shared a link", "forked a template"];
const names = ["Maya", "Jonas", "Priya", "Leo", "Amara", "Kenji", "Sofia", "Noah"];
const feed = document.getElementById("feed");

function addEvent() {
  const li = document.createElement("li");
  const who = names[Math.floor(Math.random() * names.length)], what = events[Math.floor(Math.random() * events.length)];
  li.innerHTML = '<span><span class="who"></span> <span class="text-slate-400"></span></span><span class="when">just now</span>';
  li.querySelector(".who").textContent = who;
  li.querySelector(".text-slate-400").textContent = what;
  feed.prepend(li);
  while (feed.children.length > 6) feed.lastChild.remove();
  if (!reduced) gsap.from(li, { opacity: 0, y: -12, duration: 0.5, ease: "power3.out" });
}

render(7);
if (!reduced) gsap.from(".panel", { opacity: 0, y: 24, duration: 0.7, stagger: 0.07, ease: "power3.out" });
for (let i = 0; i < 4; i++) addEvent();
setInterval(addEvent, 2600);
`;
