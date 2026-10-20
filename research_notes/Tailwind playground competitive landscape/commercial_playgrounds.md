# Commercial Online Code Playgrounds: Competitive Landscape (as of Oct 2026)

**Verification status.** Most official pricing and changelog pages could not be fetched. CodePen, CodeSandbox, JSFiddle and StackBlitz's price table returned 403/404, and the CodeSandbox fetch was blocked by a classifier error. Pricing figures below therefore come from third-party aggregators that disagree with each other and are marked UNVERIFIED. Replit, JS Bin's own site, and Glitch's current status were not checked against primary sources. Anything older than 12 months is flagged. Stopped at roughly 17 tool calls, past the 15-call guideline, because the official-source route was largely blocked.

---

## Tailwind Play (play.tailwindcss.com): the direct overlap

### Takeaway
Tailwind Play is the only playground in this set that is Tailwind-specific and official. It already offers account-less sharing via snapshot links, which is CodeMe's core share mechanic. Its differentiation is Tailwind build-time features, not general HTML/CSS/JS, so CodeMe's plain three-pane, multi-language, Tailwind-capable model is a closer match to CodePen-style tools than to Play itself.

### Cited Findings
- Announced Oct 7, 2020 by Adam Wathan. It lets you use Tailwind's build-time features in the browser without a local setup. — [Introducing Tailwind Play](https://tailwindcss.com/blog/introducing-tailwind-play) (fetched via 301 redirect from blog.tailwindcss.com). Note: this announcement is more than 12 months old, so the feature list below may be outdated.
- Feature list in the announcement: theme customization; variants such as `group-hover` and `focus-within`; `@apply`, `@variants`, `@responsive`; plugins such as `@tailwindcss/typography`; intelligent code completion and linting; responsive design mode similar to Chrome DevTools; real-time preview as you type. — [Introducing Tailwind Play](https://tailwindcss.com/blog/introducing-tailwind-play)
- Sharing quote: "One-click sharing really is just that — you don't even need to create an account. Click 'Share' and you've immediately got a link to a snapshot of what you're working on." — [Introducing Tailwind Play](https://tailwindcss.com/blog/introducing-tailwind-play)
- The announcement says the "static CDN build" lacks many features, and Play is positioned against it. It does not say whether Play runs its compilation in the browser or via a server or CDN. — [Introducing Tailwind Play](https://tailwindcss.com/blog/introducing-tailwind-play) (implementation: UNVERIFIED)
- The Play CDN (`cdn.tailwindcss.com`) is a separate script-tag option. v3 docs say it is for development only and not recommended for production. — [Tailwind v3 Play CDN docs](https://v3.tailwindcss.com/docs/installation/play-cdn) (search snippet, not fetched)
- No pricing or account model is mentioned for Play. It appears free and account-less. (UNVERIFIED; no primary pricing statement found.)
- Collaboration: one third-party site (tailkits.com) lists "real-time collaboration." Not confirmed elsewhere, so treat as unverified. — [Tailkits](https://tailkits.com/tools/tailwind-play/)

### Inferences
- Play's sharing model (account-less snapshot link) is the same mechanic CodeMe uses (compressed code in URL). CodeMe cannot claim sharing as a unique feature; differentiation has to come from elsewhere (for example the console, Emmet/Prettier, panel layout, Convex short links and forks).
- Because Play is Tailwind-only and official, positioning CodeMe as a "Tailwind-focused" playground invites direct comparison. CodeMe should state which Tailwind features it supports, and whether it runs the same build-time features, since that is Play's stated strength.

### Gaps
- Whether Play has a console, multiple file types, forks, or embeds: not confirmed from a primary source.
- Current feature changes after 2020-2022: not found.

---

## CodePen

### Takeaway
CodePen is the most-cited general front-end playground, and its free tier is account-based for public pens. The free-versus-Pro split for private pens is reported consistently by aggregators, but the exact current prices conflict across sources. Treat its pricing as unverified.

### Cited Findings
- Free tier allows unlimited public pens (HTML/CSS/JS). Private pens and certain collaboration features are reported as Pro-only. — [Toolradar CodePen pricing](https://toolradar.com/tools/codepen/pricing) (UNVERIFIED; codepen.io/pricing returned 403)
- Pro price conflicts across sources: $8/month annual (Toolradar); $12/month (CoderFile comparison table, with $39/month Team); $8 to $26/month range (GTM Directory); $19/month "Starter" (App Pricing Lab, discovered April 2026). — [Toolradar](https://toolradar.com/tools/codepen/pricing); [CoderFile](https://www.coderfile.io/blog/online-code-editor-pricing-2026); [GTM Directory](https://thegtmdirectory.com/tools/codepen/md); [App Pricing Lab](https://saas.apppricinglab.com/product/codepen/) (all UNVERIFIED)
- One aggregator claims a 2026 Pro price increase. Not confirmed. — [Techyorker](https://techyorker.com/?p=1059350) (UNVERIFIED)
- A comparison article states CodePen's collaboration, multiple projects, and full-page live views require a paid Pro plan. — [Snippetcloud/Coderfile-style guide](https://snippetcloud-ai.lovable.app/blog/online-code-editor-pricing-2026) (UNVERIFIED)
- Reviewers describe CodePen as strongest for front-end demos and sharing, with a large community. — [Online code editors guide, OpenReplay](https://blog.openreplay.com/online-code-editors/) (secondary)

### Inferences
- CodePen's public-by-default free tier is the clearest gap for CodeMe: CodeMe is account-less and offers private share via URL, which avoids the "public or pay" trade-off. This is an inference from the free-tier description, not a sourced claim about CodePen's UX preferences.

### Gaps
- Current official feature list, preprocessor list, embed options, and console features: not fetched.
- Any 2025-2026 launches: not found.

---

## JSFiddle

### Takeaway
JSFiddle is an older tool that still appears in comparisons for quick JavaScript tests and Ajax simulation. Recent feature claims come from a single brand-data aggregator, and no official 2026 changelog was found.

### Cited Findings
- Comparison sites describe JSFiddle as useful for quick JS tests and simulating asynchronous Ajax requests. — [WMTips CodePen vs JSFiddle](https://www.wmtips.com/technologies/compare/codepen-vs-jsfiddle/) and [Web Code Playground guide](https://maketecheasier.com/web-code-playground-tools) (secondary; not fetched)
- A Parse.gl brand page (data as of April 2026) lists AI code completion, a CSS Flexbox generator, and a built-in JavaScript console. Adoption date unknown. — [Parse.gl JSFiddle](https://www.parse.gl/brands/jsfiddle-net) (aggregator, UNVERIFIED)
- One comparison site says CodePen is four times more popular than JSFiddle. Source-quality concern: no methodology given.
- Pricing page at jsfiddle.net/pricing returned 404. JSFiddle pricing and private-fiddle policy: UNVERIFIED.

### Gaps
- Current plans, private-fiddle policy, and any changelog: not verified.
- Whether the "AI code completion" feature exists on the official site: not confirmed.

---

## CodeSandbox

### Takeaway
CodeSandbox positions itself as project-level (npm, frameworks, Node) rather than single-file demos. Aggregators agree on a free tier, a Pro plan near $12/month, and a $170/month Scale tier, but these figures are unverified. A reported acquisition by Together AI (Dec 2024) is a material positioning fact that needs confirmation.

### Cited Findings
- Free plan plus Pro at about $12/month (about $9/month billed annually), with a Scale tier at $170/month. — [Capterra CodeSandbox pricing](https://www.capterra.com/p/215345/CodeSandbox/pricing/); [Toolradar](https://toolradar.com/tools/codesandbox/pricing); [PricingSaaS](https://pricingsaas.com/companies/codesandbox) (all UNVERIFIED; codesandbox.io/pricing was not retrieved)
- Other aggregator figures conflict: $15 to $20/user/month Pro and $30 to $40/user/month Team (AICoolies, claims verified Sept 6, 2026, but inconsistent with the others). — [AICoolies](https://aicoolies.com/pricing/codesandbox) (UNVERIFIED)
- PricingSaaS says CodeSandbox was acquired by Together AI in Dec 2024. — [PricingSaaS](https://pricingsaas.com/companies/codesandbox) (UNVERIFIED; needs a primary source)
- A review states advanced features require a paid plan. — [Areknawo: CodeSandbox vs CodePen](https://areknawo.com/codesandbox-vs-codepen-javascript-playgrounds-compared/) (secondary)
- A comparison guide argues CodePen and CodeSandbox serve different jobs: demo sharing versus projects with build steps and installed packages. — [Online code editors guide, OpenReplay](https://blog.openreplay.com/online-code-editors/) (secondary)

### Gaps
- Official pricing, changelog, and the Together AI acquisition: not verified.
- Collaboration, templates, and embed mechanics: not verified.

---

## StackBlitz (and Bolt.new)

### Takeaway
The official StackBlitz pricing page confirms a free Personal tier with unlimited public projects and GitHub repos, and Teams accounts that sync GitHub organization members. Bolt (the AI app builder built on StackBlitz's WebContainers) uses token-based billing, and reviewers name metering as the main complaint. Bolt price figures are third-party and conflicting.

### Cited Findings
- Personal (free): "unlimited public StackBlitz projects and Github repositories." Collaborating on organization-owned repos requires Teams. — [StackBlitz pricing](https://stackblitz.com/pricing) (fetched)
- Teams: GitHub organization members sync automatically; private repo access requires a paid seat. Price not captured. Enterprise is by consultation. — [StackBlitz pricing](https://stackblitz.com/pricing) (fetched)
- Bolt (third-party): free tier 300K tokens/day and 1M/month; Pro at $25/month with 10M+ tokens/month and rollover; Teams about $30/member/month (one source says $60). — [VP0 Bolt pricing](https://vp0.com/blogs/bolt-new-pricing-plans-2026/); [Banani Bolt pricing](https://www.banani.co/blog/bolt-new-pricing); [AIProductivity](https://aiproductivity.ai/pricing/stackblitz/) (UNVERIFIED; conflict on Teams)
- Reviewers flag token metering as the main complaint. Bolt rewrites whole files to fix its own bugs, and each prompt costs a variable amount. — [Banani Bolt pricing](https://www.banani.co/blog/bolt-new-pricing) (secondary, UNVERIFIED for the wider user base)

### Inferences
- StackBlitz's account-tied model (GitHub-first, with private work gated behind paid seats) contrasts with CodeMe's account-less model. This is an inference from the official pricing page.

### Gaps
- Official Bolt pricing and token figures: not fetched.
- Whether StackBlitz Teams offers hosting, embeds, or private projects for individuals: not on the pricing page.

---

## JS Bin

### Takeaway
JS Bin appears to be in decline or unmaintained. One aggregator flags it as discontinued with the last GitHub commit in October 2021. Pricing data is inconsistent. Treat JS Bin as a likely-dormant product unless its own site confirms otherwise.

### Cited Findings
- AlternativeTo flags JS Bin as Discontinued with last GitHub commit on Oct 2021. — [AlternativeTo JS Bin](https://www.alternativeto.net/software/js-bin/about/) (aggregator; more than 12 months old, so possibly outdated)
- Pro price conflicts: $12/month (Turing blog, possibly old), $16/month (WMTips), range $16 to $125/month (AlternativeTo), £99.99 (Fitgap). — [Turing](https://www.turing.com/blog/websites-tools-for-testing-your-codes); [WMTips](https://wmtips.com/technologies/code-sharing/js-bin/); [Fitgap](https://us.fitgap.com/products/js-bin) (all UNVERIFIED; jsbin.com not fetched)
- One source says the free version has no private bins. — [WMTips](https://www.wmtips.com/technologies/compare/codepen-vs-js-bin/) (secondary, UNVERIFIED)

### Gaps
- Whether jsbin.com is still operating and what its current plans are: not verified.

---

## Glitch

### Takeaway
Glitch is not a viable comparison as a live playground anymore. It stopped hosting projects on July 8, 2025, after Fastly acquired it in 2022. Its remix model depended on hosting, so it is a cautionary case for hosted-app positioning.

### Cited Findings
- Glitch stopped hosting projects on July 8, 2025. Dashboard access and code downloads were to continue through end of 2025. CEO Anil Dash cited rising hosting costs and misuse. — [Glitch support thread](https://support.glitch.com/t/discussion-thread-project-hosting-ending-july-8/75660?page=5) (search snippet; not fetched in full)
- Fastly's developer guide notes Glitch project hosting shut down in July 2025, so remixing those projects no longer works. — [Fastly DEV post](https://dev.to/fastly/getting-started-with-fastly-cdn-is-easier-than-ever-with-glitch-4a05) (search snippet)
- Fastly acquired Glitch in 2022 for $34.9M in cash. — [Fastly acquisition announcement](https://www.fastly.com/de/blog/fastly-announces-acquisition-of-glitch-a-future-of-yes-code-at-the-edge) (search snippet; the $34.9M figure is an aggregator claim and was not confirmed in the page text)

### Gaps
- Status of the post-December 2025 export deadline: not confirmed.

---

## Replit

### Takeaway
Not researched. Replit is a full cloud IDE with agent features and deployments, not a lightweight playground. No sourced claims gathered.

### Gaps
- Replit plans, features, and 2025-2026 launches: not searched (tool budget exhausted). Replit pricing page could not be fetched in the pass attempted, and the batch result did not return it.

---

## Other playgrounds (not researched)
- Not covered in this pass: Plunker, Codepen alternatives like Liveweave/Scratch-style tools, Vercel v0, and Lovable-style AI builders. The aggregator sites above name several but no primary sources were checked.

---

## Cross-cutting: table stakes versus differentiators

### Takeaway
Across the sources, account-less sharing, a live preview, and a console are the observed baseline, and Tailwind Play already has the first. CodeMe's real differentiation is "free and account-less plus Tailwind-focused plus Convex-backed short links and forks." The rest of the comparison requires primary sources not gathered here.

### Cited Findings
- Tailwind Play offers account-less snapshot sharing and real-time preview. — [Introducing Tailwind Play](https://tailwindcss.com/blog/introducing-tailwind-play)
- Paid-gating of private work and collaboration is common across CodePen, CodeSandbox, and StackBlitz, per aggregators. — [Toolradar](https://toolradar.com/tools/codepen/pricing); [PricingSaaS](https://pricingsaas.com/companies/codesandbox); [StackBlitz pricing](https://stackblitz.com/pricing) (mixed verified and unverified)
- Token metering is a reported pain point for AI-driven playgrounds (Bolt). — [Banani](https://www.banani.co/blog/bolt-new-pricing) (UNVERIFIED for broader sentiment)

### Inferences
- Table stakes (inferred): live preview, console, shareable URL, public-by-default sharing. CodeMe already has these.
- Potential differentiators: a free, account-less private share (CodePen gates private work), Tailwind-first positioning, and Emmet/Prettier in-browser. Tailwind Play overlaps on Tailwind and sharing, so the Tailwind angle needs to be framed around general-purpose HTML/CSS/JS plus Tailwind rather than Tailwind alone.

### Gaps
- Sourced UX praise and criticism from G2, Reddit, and Hacker News: not gathered. Reddit and HN searches returned no direct threads. This is a gap for the "UX patterns" question.
- Mobile behavior, empty states, and onboarding patterns: not researched.
- Usage trends (declining usage, traffic data): not gathered. Only the Glitch shutdown and the JS Bin discontinued flag were found.

---

## Recommended next steps (for the owner, not done here)
1. Re-run a focused pass on codepen.io, codesandbox.io, jsfiddle.net, jsbin.com, and replit.com once the WebFetch 403 blocks clear, or check those pages manually.
2. Confirm the CodeSandbox / Together AI acquisition with a primary source before citing it publicly.
3. Check Tailwind Play's current feature set directly, since the only fetched source is from 2020.
4. Source UX commentary from Reddit or HN threads by searching for specific phrases, since broad searches returned no threads.
