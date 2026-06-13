---
title: "JMeter Gave Me Reports. I Needed Answers — So I Built PerfSage Reveal"
description: "After years of drowning in JMeter HTML dashboards that report data but never explain it, I built PerfSage Reveal — upload a JTL, get expert charts, SLO verdicts, and actionable insights in one Docker command. Here's the real demo."
pubDate: 2026-05-26
heroImage: "/images/blog/perfsage-reveal-launch/PerfsageReveal-Homepage.png"
tags: ["JMeter", "performance engineering", "AI", "open source", "product launch"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>TL;DR</strong> — For years, my JMeter runs ended the same way: a massive HTML report full of numbers, and me still asking <em>"so what do we do about this?"</em> I built <a href="https://github.com/perfsage/reveal" target="_blank" rel="noopener noreferrer">PerfSage Reveal</a> to close that gap — upload any JMeter result file, get expert charts, SLO verdicts, and plain-English recommendations. One Docker command. No toolchain. I validated it on a real 3-minute load test against public APIs. <span class="hl-orange">The SLO failed — and Reveal told me exactly why.</span> That's the point.
</div>

---

## The problem I kept running into

I've been a performance engineer long enough to know the rhythm by heart:

1. Run a load test in JMeter
2. Wait for the HTML report to generate
3. Scroll through tables, charts, and percentiles
4. Export a screenshot for the stand-up
5. Go back to the spreadsheet anyway

<div class="callout callout-warning">
<strong>The uncomfortable truth:</strong> Most performance exercises stop at <em>data reporting</em>. We produce beautiful dashboards — but the hard part, turning that data into a decision, still falls on whoever is staring at the screen at 11 PM.
</div>

JMeter's built-in HTML report is fine for **showing** what happened. It's not built for **explaining** what it means.

Every time I opened one, I found myself asking the same questions:

| What I saw in the report | What I actually needed |
|--------------------------|------------------------|
| p99 latency: 1,124 ms | Is that a tail-latency problem or normal variance? |
| Error rate: 31% | Which endpoint broke, and when did it start? |
| Response time scatter | Are there outliers hiding in one transaction? |
| Green average latency | Would my SLO pass or fail — and why? |

The answers were always *somewhere* in the data. But getting to them meant manual digging — pivot tables, custom scripts, or asking the one person on the team who remembers how the last project did it.

**Analysis produces real value out of performance data.** I kept watching teams skip that step because the tooling made it too painful.

---

## Why I decided to build instead of workaround

We're in an AI era now. That doesn't mean I wanted another chatbot that hallucinates about your load test.

What I wanted was simpler and harder:

- Take **any JMeter result file** — the `.jtl` you already have
- Surface the patterns a senior perf engineer would look for first
- Present it in a way you can **share with people who don't live in JMeter**

So I spent time on the idea, iterated on what "useful analysis" actually looks like in practice, and **PerfSage Reveal** came out of that.

<div class="callout callout-success">
<strong>Reveal</strong> — <em>Uncover what your load test really means.</em> Upload your results. Get expert visualizations, SLO tracking, smart recommendations, and optional AI narratives. Export a shareable HTML or PDF report. One container, no extra pipeline.
</div>

It's still early — I'm actively improving it — and I'd genuinely love your feedback if you try it.

---

## See it in action: a real 3-minute load test

To prove this wasn't just a pretty UI, I ran a short load test against **three public APIs** — the kind of endpoints every engineer has hit in a tutorial:

<div class="endpoint-grid">
  <div class="endpoint-chip"><span class="chip-method">GET</span> JSONPlaceholder <code>/posts/{id}</code></div>
  <div class="endpoint-chip"><span class="chip-method">GET</span> httpbin <code>/status/200</code></div>
  <div class="endpoint-chip"><span class="chip-method">GET</span> GitHub <code>/zen</code></div>
</div>

**15 virtual users · 3 minutes · no custom scripts afterward.**

I pulled the Docker image, started the container, and uploaded the raw `.jtl` file. That was the entire workflow.

```bash
docker run -d \
  --name perfsage-reveal \
  -p 8000:8000 \
  -v perfsage-reveal-data:/app/data \
  -e PERFSAGE_SECRET="your-32-char-secret-here" \
  aashu3201/reveal:latest
```

Open **http://localhost:8000**, drag in your JTL, and wait a few seconds.

---

## What Reveal showed me — without me asking

Here's the dashboard the moment analysis finished:

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/02-report-kpi-summary.png"
    alt="PerfSage Reveal dashboard showing KPI cards for 3,587 samples, P50 147ms, P90 330ms, P99 1124ms, 31.7% error rate, and expert recommendations flagged as critical"
    loading="lazy"
  />
  <figcaption>KPI summary and expert recommendations — the first screen I saw after upload. No spreadsheet required.</figcaption>
</figure>

<div class="result-grid">
  <div class="result-stat">
    <span class="result-value">3,587</span>
    <span class="result-label">Samples Analysed</span>
  </div>
  <div class="result-stat">
    <span class="result-value">147 ms</span>
    <span class="result-label">P50 Latency</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-orange">31.7%</span>
    <span class="result-label">Error Rate</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-orange">FAIL</span>
    <span class="result-label">SLO Verdict</span>
  </div>
</div>

Within seconds, Reveal flagged things I would have spent an hour hunting for:

| Finding | Why it matters |
|---------|----------------|
| **Tail latency on JSONPlaceholder** — p99 was **19.9×** the median | A few slow responses are punishing real users even when averages look fine |
| **Error spike** — **34.4%** failures in one time window | Something broke mid-test, not gradually — worth a timeline look |
| **GitHub `/zen` at 97% errors** | Rate limiting under load — the test design issue, not a mystery |

<div class="callout callout-warning">
<span class="hl-orange">This is the moment that sold me on the idea.</span> I didn't configure thresholds. I didn't write a parser. I uploaded a file I already had — and Reveal told me <em>where to look first</em>.
</div>

---

## The charts that actually help you decide

**Response time scatter** — see outliers per transaction at a glance, not buried in an aggregate table:

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/03-scatter-chart.png"
    alt="PerfSage Reveal scatter chart showing response time distribution across JSONPlaceholder, httpbin, and GitHub transactions with visible outlier clusters"
    loading="lazy"
  />
  <figcaption>Outliers jump out immediately — no filtering, no pivot table.</figcaption>
</figure>

**SLO gauges** — Apdex, error budget, and p99 compliance in one view:

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/04-slo-gauges.png"
    alt="PerfSage Reveal SLO gauge charts showing Apdex, error rate, and P99 latency compliance with red fail indicators"
    loading="lazy"
  />
  <figcaption>SLO pass or fail — visible before you write a single sentence in the incident doc.</figcaption>
</figure>

**Error breakdown** — which endpoint, which failure, how much:

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/05-error-sunburst.png"
    alt="PerfSage Reveal sunburst chart breaking down errors by transaction label and response code"
    loading="lazy"
  />
  <figcaption>GitHub rate-limiting dominated the error picture — obvious in one chart.</figcaption>
</figure>

And when I needed something to attach to a review or share with a PM? **One-click PDF export** — 29 charts embedded, ready to send. No "chart not available" placeholders.

---

## Who this is for

If any of this sounds familiar, Reveal is for you:

- You run JMeter (or inherit JMeter results) and dread the analysis step
- Your stakeholders want **answers**, not a 40-tab HTML dump
- You care about SLOs but don't want to rebuild the parsing layer every project
- You want optional AI insights — but only when you've configured your own API key

<div class="callout callout-success">
<strong>"I can send this to someone who doesn't use JMeter."</strong> Same bar I set for my SLO Reporter plugin. Reveal clears it — for the entire analysis workflow, not just the pass/fail gate.
</div>

---

## Honest status: early, improving, and open to feedback

PerfSage Reveal is **live and usable today** — Docker image on Hub, source on GitHub — but I'm treating this as a **v0.1 launch**, not a finished product.

What's coming next on my roadmap:

- Richer AI narrative modes and tighter prompt controls
- More JMeter format edge cases from real-world uploads
- Team workflows — compare runs, baseline drift, CI hooks

If you try it and something feels off, missing, or confusing — **tell me**. Issue on GitHub, DM on LinkedIn, or book a call. That feedback is how this gets better.

---

## Try it yourself

**Fastest path — one Docker command:**

```bash
docker pull aashu3201/reveal:latest

docker run -d \
  --name perfsage-reveal \
  -p 8000:8000 \
  -v perfsage-reveal-data:/app/data \
  -e PERFSAGE_SECRET="change-me-to-a-32-char-random-string" \
  aashu3201/reveal:latest
```

Then open **http://localhost:8000** and upload any JMeter `.jtl`, `.csv`, or `.xml` result file.

- **GitHub:** [github.com/perfsage/reveal](https://github.com/perfsage/reveal) — source, issues, and roadmap
- **Docker Hub:** [hub.docker.com/r/aashu3201/reveal](https://hub.docker.com/r/aashu3201/reveal) — pull and run
- **Book a call:** [topmate.io/abajpai](https://topmate.io/abajpai/659595) — if you want help setting up perf analysis pipelines for your team

---

*Published: May 2026 · By Aashish Bajpai*
