---
title: "The Reveal Playbook: Which Chart to Open First (and Which KPI Actually Matters)"
description: "Stop staring at 29 charts in random order. A performance engineer's decision tree for PerfSage Reveal — symptom → visualization → KPI → next move. Real public-API demo, every screenshot included."
pubDate: 2026-06-03
tags: ["performance engineering", "JMeter", "Field Notes", "open source"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #2 · TL;DR</strong> — Load test analysis isn't "open every chart." It's a <strong>pattern</strong>: start with the executive KPIs, follow the symptom, pick the visualization built for that question. <a href="https://github.com/perfsage/reveal" target="_blank" rel="noopener noreferrer">PerfSage Reveal</a> ships 29 charts — this playbook tells you <em>which 3–5 to open</em> for tail latency, errors, saturation, flakiness, and stakeholder sign-off. All screenshots from a real 3-minute JMeter run against public APIs.
</div>

---

## Analysis is a sequence, not a slideshow

Most engineers do this:

1. Upload `.jtl`
2. Scroll every tab
3. Screenshot whatever looks red
4. Still not sure what to fix

What senior perf engineers do:

| Phase | Question | Where in Reveal |
|-------|----------|-----------------|
| **1 · Orient** | Pass or fail? What's the headline? | KPI summary + SLO gauges |
| **2 · Diagnose** | *Why* — tail, errors, saturation, or noise? | Symptom-specific chart |
| **3 · Decide** | Ship, investigate, or re-test? | Checklist + export |

Reveal is built around that flow. Below is the **symptom → chart → KPI** map I use on every run.

---

## 🧭 Quick reference: pick your chart in 10 seconds

<div class="callout callout-success">
<strong>Save this table.</strong> Match your stand-up question to a row — open that chart first.
</div>

| 🔍 You need to know… | 📊 Open this first | 🎯 KPIs to watch |
|----------------------|-------------------|------------------|
| Did we pass release gates? | **Executive summary** | SLO verdict · p99 · error rate |
| Are averages hiding pain? | **Scatter plot** | p99 ÷ median · outlier clusters |
| Did we fail SLO on latency *or* errors? | **SLO gauges + Apdex by label** | Apdex · error % · p99 ms |
| *Which* endpoint broke? | **Error sunburst** | Error count by label + status code |
| What % of users hit slow responses? | **Latency CDF** | p90 · p95 · p99 lines |
| Which transaction has spread/outliers? | **Boxplot per label** | Whiskers · outlier dots |
| Is performance flaky vs consistently slow? | **CV + IQR outlier scatter** | CV by label · IQR fences |
| Are we hitting throughput ceiling? | **RT vs throughput** | p90 at knee · req/s plateau |
| Does latency jitter under fixed load? | **RT vs concurrency** | p90 band width at steady threads |
| Server slow or network slow? | **Latency components** | Connect · TTFB · transfer |
| Fast failures vs slow successes? | **RT by status** | Success cloud vs error baseline |
| At what load do errors start? | **Threads vs errors heatmap** | Error rate bucket at thread count |
| Which metrics move together? | **Correlation matrix** | Pearson r (spot red herrings) |
| Explain to PM / dev in prose | **AI analysis** (optional) | Narrative + flagged anomalies |

---

## Phase 1 · Orient — start at the summary (always)

Before any deep chart, I need **one screen** that answers: *samples, verdict, headline percentiles, auto-flagged issues.*

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/02-report-kpi-summary.png"
    alt="PerfSage Reveal executive summary showing 3587 samples, P50 147ms, P99 1124ms, 31.7% error rate, SLO FAIL, and critical recommendations"
    loading="lazy"
  />
  <figcaption>Executive summary — the stand-up slide. SLO FAIL, 31.7% errors, p99 1,124 ms. Recommendations tell you where to click next.</figcaption>
</figure>

<div class="result-grid">
  <div class="result-stat">
    <span class="result-value">3,587</span>
    <span class="result-label">Samples</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-orange">FAIL</span>
    <span class="result-label">SLO Verdict</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-orange">31.7%</span>
    <span class="result-label">Error Rate</span>
  </div>
  <div class="result-stat">
    <span class="result-value">1,124 ms</span>
    <span class="result-label">P99</span>
  </div>
</div>

**Pattern:** If recommendations mention tail ratio, errors, or variability — jump to that section below. If green across the board, still check **tail ratio** (Field Notes [#1](/blog/the-p99-trap-why-your-load-test-passed-production-failed/)).

---

## Pattern A · "Users say it's slow" — tail latency

### Symptom
Stand-up says latency is fine. Product says checkout feels sluggish. Average looks polite.

### Chart → **Response time scatter**
### KPIs → **p99**, **p99 ÷ median**, outlier **clusters**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/03-scatter-chart.png"
    alt="Response time scatter by transaction showing a second cloud of outliers up to 30 seconds above the main band"
    loading="lazy"
  />
  <figcaption>Two clouds = two experiences. JSONPlaceholder spikes to ~30,000 ms while the main band sits under 1,000 ms.</figcaption>
</figure>

<div class="callout callout-warning">
<strong>What I look for:</strong> A second band above the main cluster. That is tail latency — invisible in averages, obvious in scatter.
</div>

**Next moves:**
1. Note **which label** owns the upper cloud
2. Check **when** it starts (ramp vs steady state)
3. Open **boxplot per label** to quantify spread

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/boxplot-heatmap.png"
    alt="Boxplots per transaction label showing JSONPlaceholder whiskers to 30k ms and RT heatmap density over time"
    loading="lazy"
  />
  <figcaption>Boxplot confirms *who* · heatmap shows *when* density shifts into slower buckets.</figcaption>
</figure>

---

## Pattern B · "Did we pass SLO?" — gates and the Apdex paradox

### Symptom
Need a release yes/no. Stakeholders want red/green, not percentiles lecture.

### Chart → **SLO gauges + Apdex by label**
### KPIs → **SLO verdict**, **error rate %**, **Apdex**, **p99 ms**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/04-slo-gauges.png"
    alt="SLO gauges showing Apdex 0.966, error rate 31.5% in red, p99 1120ms, and Apdex by label bar chart"
    loading="lazy"
  />
  <figcaption>Apdex 0.966 looks excellent — but error rate 31.5% fails the run. Never read latency satisfaction without availability.</figcaption>
</figure>

<div class="callout callout-warning">
<span class="hl-orange">The Apdex paradox:</span> Successful requests were fast (Apdex ~0.94–1.0 per label). Nearly one-third of requests <em>failed</em>. Green latency + red errors = still a no-ship.
</div>

**When to use Apdex:** translating tail latency for PMs (*"12% frustrated"* beats *"p99 = 480 ms"*).

**When to ignore Apdex:** error rate is elevated — fix availability first.

---

## Pattern C · "Something broke" — errors

### Symptom
Error rate &gt; 0. Need endpoint + status code in under a minute.

### Chart → **Error sunburst** (+ errors over time)
### KPIs → **error rate %**, **count by HTTP code**, **label ownership**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/05-error-sunburst.png"
    alt="Error sunburst showing HTTP 429 and 403 errors both attributed to GET GitHub Zen endpoint"
    loading="lazy"
  />
  <figcaption>Both 429 and 403 roll up to one label: GET GitHub Zen. Rate limiting under load — not a mystery.</figcaption>
</figure>

**Pattern:** Timeline shows *when* errors spiked; sunburst shows *where*. In this demo, the fix is test design (public API limits), not server tuning.

---

## Pattern D · "Define or validate SLO thresholds" — distribution shape

### Symptom
Product asks *"is 500 ms p99 realistic?"* You need the full distribution, not a gut feel.

### Chart → **Histogram + CDF**
### KPIs → **p90**, **p95**, **p99** (CDF lines)

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/latency-histogram-cdf.png"
    alt="Latency histogram spike near zero and CDF with p90 330ms, p95 672ms, p99 1124ms markers"
    loading="lazy"
  />
  <figcaption>Histogram: bulk fast, ghost bars at 25 s. CDF: contract lines at p90/p95/p99 for SLO negotiation.</figcaption>
</figure>

**Rule:** Set SLOs from **CDF**, defend them with **histogram** (proves outliers exist).

---

## Pattern E · "It feels random" — variability and outliers

### Symptom
*"Sometimes fast, sometimes awful."* Same endpoint, inconsistent experience.

### Chart → **IQR outlier scatter + CV chart**
### KPIs → **CV (std/mean)**, **outliers beyond 1.5× IQR**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/iqr-outliers-variability.png"
    alt="IQR outlier scatter with red points to 30s and CV chart showing JSONPlaceholder at 3.83 exceeding threshold 2.0"
    loading="lazy"
  />
  <figcaption>CV 3.83 on JSONPlaceholder = performance roulette. GitHub Zen at 0.60 = stable (when it succeeds).</figcaption>
</figure>

| CV | Read |
|----|------|
| &lt; 1.0 | Predictable |
| 1.0 – 2.0 | Watch |
| &gt; 2.0 | Flaky — investigate before peak |

---

## Pattern F · "How much headroom?" — saturation

### Symptom
Planning capacity. Need the **knee** where throughput stops climbing and latency spikes.

### Chart → **RT vs throughput + RT vs concurrency**
### KPIs → **p90 at plateau**, **req/s at knee**, **jitter width**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/rt-vs-throughput-concurrency.png"
    alt="RT vs throughput showing p90 spikes to 850ms while req/s flatlines near 22, and RT vs concurrency jitter at 15 threads"
    loading="lazy"
  />
  <figcaption>Throughput stuck ~22 req/s while p90 hits 850 ms — you're at the wall. At 15 threads, p90 swings 250–850 ms (jitter under fixed load).</figcaption>
</figure>

**Use before:** Black Friday, launch day, autoscaling tuning.

---

## Pattern G · "Network or server?" — latency decomposition

### Symptom
Latency regressed but errors are zero. Is it backend processing or connection overhead?

### Chart → **Latency components + RT by status**
### KPIs → **TTFB**, **connect time**, **transfer time**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/rt-vs-status-latency-components.png"
    alt="RT by status scatter and stacked latency components showing TTFB dominates with connect spike at test start"
    loading="lazy"
  />
  <figcaption>Successes can still hit 30 s (upper scatter). TTFB dominates — transfer is thin. Cold-start connect spike at t=0.</figcaption>
</figure>

**Pattern:** Fat TTFB → server/processing. Fat connect → pool/cold start. Fat transfer → payload/size (rare on APIs).

---

## Pattern H · "When do we break?" — load threshold

### Symptom
*"How many concurrent users until errors?"* Need the breaking point, not average error rate.

### Chart → **Threads vs errors heatmap**
### KPIs → **error rate bucket at thread range**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/correlation-matrix-threads-errors.png"
    alt="Correlation matrix of JMeter metrics and threads vs errors heatmap showing error rate over 25% at 13-15 threads"
    loading="lazy"
  />
  <figcaption>0% errors until 13–15 threads — then &gt;25% error rate. The knee is precise.</figcaption>
</figure>

Use the **correlation matrix** beside it to kill red herrings (e.g. bytes ↔ latency ≈ 0 → payload size isn't your problem).

---

## Pattern I · "Explain it to someone who wasn't in the war room"

### Symptom
Dev needs prose. PM needs a PDF. You need sleep.

### Chart → **AI-powered analysis** (optional, your API key)
### KPIs → Same math as above — AI **narrates**, never **decides**

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/ai-powered-analysis.png"
    alt="AI-powered analysis section listing GitHub Zen 95% error rate, p99/p50 ratio 19.9x, and JSONPlaceholder CV 3.83 with recommendations"
    loading="lazy"
  />
  <figcaption>Percentile math runs first. AI summarizes for handoff — copy markdown or export PDF with all 29 charts.</figcaption>
</figure>

<div class="callout callout-success">
<strong>Guardrail I insist on:</strong> Pass/fail comes from SLO gauges and KPI cards — not from the LLM. AI explains; thresholds decide.
</div>

---

## The 5-minute analysis workflow (copy this)

```
1. Upload .jtl → read executive summary (verdict + recommendations)
2. If errors > target → sunburst → label + status code
3. If SLO fail on latency → scatter → boxplot → CDF
4. If "flaky" gut feel → CV chart + IQR scatter
5. If capacity question → RT vs throughput/concurrency
6. Export PDF → attach to PR / ticket
```

<figure class="post-figure">
  <img
    src="/images/blog/perfsage-reveal-launch/01-dashboard-fresh.png"
    alt="PerfSage Reveal upload screen — drop JTL, CSV, or XML up to 2GB and click Analyse"
    loading="lazy"
  />
  <figcaption>One screen in. Full playbook out. No JMeter install required for analysis.</figcaption>
</figure>

---

## Which KPI for which situation (cheat sheet)

| Situation | Primary KPI | Secondary KPI | Chart |
|-----------|-------------|---------------|-------|
| Release gate | SLO pass/fail | p99, error % | Summary + gauges |
| User feels slow, avg OK | p99 ÷ median | p99 ms | Scatter |
| Stakeholder comms | Apdex | % frustrated (derived) | SLO gauges |
| Incident: what broke | Error rate by label | HTTP code | Sunburst |
| SLO negotiation | p99 on CDF | p95 buffer | Histogram/CDF |
| Flaky endpoint | CV | IQR outlier count | Variability |
| Capacity plan | req/s at knee | p90 at knee | RT vs throughput |
| Backend vs network | TTFB share | Connect spike | Latency components |
| Breaking point | Error % at thread N | — | Threads vs errors |

---

## Try it on your last JTL

```bash
docker pull aashu3201/reveal:latest

docker run -d \
  --name perfsage-reveal \
  -p 8000:8000 \
  -v perfsage-reveal-data:/app/data \
  -e PERFSAGE_SECRET="change-me-to-a-32-char-random-string" \
  aashu3201/reveal:latest
```

Open **http://localhost:8000**, upload any `.jtl`, and run this playbook against your own run.

- **GitHub:** [github.com/perfsage/reveal](https://github.com/perfsage/reveal)
- **Launch story:** [JMeter Gave Me Reports. I Needed Answers](/blog/introducing-perfsage-reveal-jmeter-analysis/)
- **Tail latency deep dive:** [The P99 Trap](/blog/the-p99-trap-why-your-load-test-passed-production-failed/)
- **Book a call:** [topmate.io/abajpai](https://topmate.io/abajpai/659595)

---

*Field Notes #2 · Published June 2026 · By Aashish Bajpai*
