/**
 * The one example the landing page uses everywhere: a Pro plan card with a yearly switch. It is a
 * component people really build, and it needs all three layers: structure, a look, and behaviour.
 */

/** The card as it should be written. The scroll sequence types this out while the page assembles. */
export const builtPlan = {
  html: `<article class="plan">
  <h2>Pro</h2>
  <p class="price">
    <span id="amount">$12</span> / month
  </p>
  <label>
    <input type="checkbox" id="yearly">
    Pay yearly
  </label>
  <p id="save"></p>
  <button>Choose Pro</button>
</article>`,
  css: `.plan {
  background: white;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 30px 60px #0006;
}
h2 { font-size: 20px; color: #565878; }
.price { font-size: 40px; font-weight: 800; }
input { accent-color: #6c4fff; }
button {
  background: #6c4fff;
  color: white;
  border-radius: 999px;
  padding: 10px 20px;
}
body { background: #1d1d3c; }`,
  js: `yearly.onchange = () => {
  const on = yearly.checked;
  amount.textContent = on ? "$9" : "$12";
  save.textContent = on ? "You save 25%" : "";
};`,
} as const;

/**
 * The same card with the mistakes people really make. It has four findings the checker reports (a close
 * button with no name, a heading level skipped, a field with no label, faint fine print) and one
 * JavaScript error at load (`plan` is used but never declared). The fix demo runs on this page.
 */
export const brokenPlan = {
  html: `<main class="plan">
  <button class="close"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2"/></svg></button>
  <h1>Pro</h1>
  <h3 class="tagline">For people who ship</h3>
  <p class="price" id="price">$12 / month</p>
  <input type="email" placeholder="Email for the receipt">
  <label class="switch"><input type="checkbox" id="yearly"> Pay yearly</label>
  <button class="buy">Choose Pro</button>
  <p class="fine">Cancel anytime. Prices exclude tax.</p>
</main>`,
  css: `body {
  background: #1d1d3c;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  font: 16px system-ui, sans-serif;
}
.plan {
  position: relative;
  width: 280px;
  background: white;
  padding: 24px;
  border-radius: 24px;
  box-shadow: 0 30px 60px #0006;
}
.close {
  position: absolute;
  top: 14px;
  right: 14px;
  border: 0;
  background: none;
  color: #565878;
}
h1 { margin: 0; font-size: 24px; color: #12122b; }
.tagline { margin: 4px 0 0; font-size: 14px; font-weight: 500; color: #565878; }
.price { margin: 12px 0; font-size: 36px; font-weight: 800; color: #12122b; }
input[type="email"] {
  box-sizing: border-box;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #c9cbe0;
  border-radius: 10px;
}
.switch { display: block; margin: 10px 0; color: #12122b; }
.buy {
  width: 100%;
  padding: 11px;
  border: 0;
  border-radius: 999px;
  background: #6c4fff;
  color: white;
  font-weight: 700;
}
.fine { margin: 10px 0 0; font-size: 12px; color: #b4b6cc; }`,
  js: `const prices = { monthly: 12, yearly: 9 };

function show() {
  price.textContent = "$" + prices[plan] + " / month";
}

yearly.onchange = () => {
  plan = yearly.checked ? "yearly" : "monthly";
  show();
};

show();`,
} as const;
