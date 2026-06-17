---
title: "I Got Tired of 3-Hour Post-Deploy War Rooms — So I'm Building SignalPilot"
description: "Post-deploy errors in Kubernetes used to cost me hours. Enterprise RCA tools cost a fortune. I'm building SignalPilot — open-source RCA that correlates deploy diffs, events, metrics, logs, and git into ranked findings with kubectl fixes."
pubDate: 2026-06-14
heroImage: "/images/signalpilot-og.svg"
tags: ["Kubernetes", "SRE", "MTTR", "Field Notes", "open source", "observability", "performance engineering"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #4 · TL;DR</strong> — You deploy. Errors spike. Three people open three tools. Two hours later someone says <em>"maybe it's memory?"</em> I kept living this loop. <a href="https://github.com/perfsage/signalpilot" target="_blank" rel="noopener noreferrer">PerfSage SignalPilot</a> is my answer: an open-source Kubernetes RCA copilot that correlates deploy diffs, events, metrics, logs, and git — then ranks findings with copy-paste <code>kubectl</code> fixes. Not another dashboard. <span class="hl-orange">Analysis you can act on.</span> <strong>Now live.</strong> <code>pip install perfsage-signalpilot</code>. For the launch walkthrough, read <a href="/blog/5-minute-post-deploy-postmortem-signalpilot/">Field Notes #5</a>.
</div>

---

## Friday, 4:47 PM

Deploy went out. The pipeline was green. Then the pager fired.

Someone opened `kubectl`. Someone opened Grafana. Someone scrolled through the last five commits in git. Slack filled up with theories:

- "Is it the new image tag?"
- "Did we change an env var?"
- "Maybe it's the dependency — their status page looks fine though."

Forty minutes in, we still didn't have a **defensible answer** to the only question that mattered:

> *"Why are errors and performance degradation happening after my last deployment?"*

I've sat in this room at VMware, at client SaaS shops, and in my own side projects. The tools got better. The war rooms didn't get shorter.

<div class="callout callout-warning">
<strong>The uncomfortable truth:</strong> We have more observability than ever — and <em>MTTR hasn't moved</em> because correlation is still manual. Someone has to hold the deploy diff, the pod events, the metric spike, and the log fingerprint in their head at the same time.
</div>

---

## The problems I kept hitting

### MTTR is the real SaaS tax

Every minute of downtime costs revenue, trust, and on-call sanity. We talk about "shift left" in load testing and CI gates — and I believe in that; it's why I built [PerfSage Reveal](/reveal/) and [SLO Reporter](/slo-plugin/).

But production still breaks **right** after deploy. Not during the load test. Not in staging on a Tuesday. On Friday, when the traffic curve is real and the rollback decision has a dollar sign attached.

The industry loves average latency on dashboards. Averages lie — I wrote about that in [The P99 Trap](/blog/the-p99-trap-why-your-load-test-passed-production-failed/). In prod, it's usually **error rate + tail latency** that tell you something broke. Finding *what* broke is the expensive part.

### Diagnosis takes hours because signals don't talk

I wasn't missing data. I was missing a **story** that tied the data together.

| Tool | What it shows | What it doesn't show |
|------|---------------|----------------------|
| `kubectl describe` | One pod's last state | Deploy context, cross-pod pattern |
| Grafana / Prometheus | A metric spike | *Why* the spike started after *this* image tag |
| Container logs | Stack trace, error string | Link to the resource limit change in the same deploy |
| Git | Suspect commit | Whether that commit correlates with new log fingerprints |

Each tool is correct in isolation. None of them cite each other. So you context-switch for an hour — or three — until someone connects OOMKilled with a memory limit that changed in the same rollout.

That's not a skill problem. It's a **workflow** problem.

### The expensive-tools gap

Enterprise AIOps and RCA platforms exist. They also exist at enterprise price tags: long contracts, agents in every namespace, "contact sales," quarters of onboarding.

Startups and mid-market SaaS teams run the same Kubernetes, hit the same OOMKilled and CrashLoopBackOff patterns, and have a fraction of that budget. I've watched teams **not** buy the tool they need — not because they don't want RCA, but because procurement and seat math kill the conversation before the pilot starts.

That's the gap PerfSage exists to close.

---

## Why I decided to build instead of workaround

When I drowned in JMeter HTML reports, I didn't want another dashboard. I wanted someone — or something — to answer *"so what do we do?"* That's how [Reveal](/blog/introducing-perfsage-reveal-jmeter-analysis/) happened.

Production has the same gap, with higher stakes:

1. **Test time** — Reveal turns a JTL into charts, SLO verdicts, and recommendations.
2. **Gate time** — SLO Reporter blocks bad builds in CI.
3. **Prod time** — *nothing in the PerfSage ladder answered the post-deploy war room.*

I couldn't keep telling teams to "correlate manually" while selling them on analysis over reporting. The philosophy had to extend to Kubernetes.

Three principles I'm building SignalPilot around:

**1. Analysis over dashboards.** Don't show me forty panels. Give me ranked hypotheses with evidence — deploy diff + events + metrics + logs cited in one finding.

**2. Deterministic rules over LLM theater.** Core RCA runs without an API key. Optional narrative polish exists; magic guesses don't. I want reproducible output you can put in a postmortem.

**3. Open source over gatekeeping.** MIT licensed. Read-only RBAC. No agents in your application pods. Good reliability tooling shouldn't require a Fortune 500 procurement cycle.

<div class="callout callout-success">
<strong>SignalPilot</strong> — <em>I'm not building "AI that fixes prod."</em> I'm building a copilot that does the correlation grunt work so your engineers can decide, patch, and ship the fix.
</div>

---

## What I'm building (high level)

SignalPilot runs an **observe → correlate → explain → recommend → verify** loop against your cluster after a deploy.

**What it pulls in:**

- **Deploy diff** — image tag, env vars, resource requests/limits, probe changes (the anchor: *what changed*)
- **Kubernetes API + events** — restarts, OOMKilled, CrashLoopBackOff, FailedScheduling, probe failures
- **metrics-server** — CPU and memory saturation vs limits
- **Container logs** — clustered fingerprints; new error patterns after deploy
- **cAdvisor** — CPU throttling, memory working-set pressure
- **Prometheus** (optional, auto-detected) — p95/p99 latency, error rate, CFS throttle
- **Git** (optional) — suspect commit when log fingerprints shift

**What comes out:**

Ranked findings. Each one fuses **multiple signal types** — not a single chart anomaly. Example: OOMKilled + memory at 94% of limit + git commit touching heap-related config → undersized memory limit, with a concrete `kubectl` fix you can copy.

Rules I'm shipping first include `oom_killed`, `cpu_throttled`, `crash_loop`, `image_pull_error`, `probe_failure`, and `code_regression`. Full rule table and signal tiers are on the [SignalPilot landing page](/signalpilot/).

**What it's not:**

- Not a replacement for Prometheus, Grafana, or your observability stack
- Not requiring Prometheus or an LLM to get useful output
- Not a paid SaaS — **launching open source now**

For install commands and CI gate examples, see [Field Notes #3](/blog/introducing-perfsage-signalpilot-kubernetes-rca/).

---

## How this changes the MTTR math

I'm not going to invent a "73% faster" stat I can't defend. Here's the honest framing:

**Before:** For "obvious" Kubernetes issues — OOM, CPU throttle, bad probe, image pull — I've routinely seen **45 minutes to three hours** when three engineers are context-switching across tools and Slack threads.

**After (the goal):** First ranked, cited finding in **minutes**, because correlation is automated and tied to the deploy diff.

**In CI/CD:** `signalpilot gate` exits non-zero on HIGH+ findings and exports JUnit XML — so you can complement load-test SLO gates from SLO Reporter with a post-deploy sanity check before traffic fully shifts.

I'm not promising zero incidents. I'm promising you stop paying the **tax of manual correlation** on every deploy.

---

## The PerfSage ladder: test → gate → RCA

This is the product story I've been building toward:

1. **[Reveal](/reveal/)** — JMeter JTL analysis in the lab
2. **[SLO Reporter](/slo-plugin/)** — CI gates on load tests
3. **[SignalPilot](/signalpilot/)** — post-deploy RCA in production

Test-time analysis and prod-time RCA share the same DNA: **reports data → explains what to do next.**

---

## Install now

```bash
pip install perfsage-signalpilot
kubectl apply -f deploy/signalpilot-rbac.yaml
signalpilot analyze my-namespace --deployment my-app --output report.html
```

- **Repo:** [github.com/perfsage/signalpilot](https://github.com/perfsage/signalpilot) · **Release:** [v1.0.0](https://github.com/perfsage/signalpilot/releases/tag/v1.0.0)
- **`signalpilot analyze`** — HTML report with ranked findings and kubectl recommendations
- **`signalpilot gate`** — pipeline gate with JUnit XML export
- **Read-only RBAC** — `deploy/signalpilot-rbac.yaml` included; no agents in app pods

Try Reveal and SLO Reporter if you haven't — SignalPilot is the third rung on the same ladder.

<div class="callout callout-info">
<strong>Read next:</strong> <a href="/blog/introducing-perfsage-signalpilot-kubernetes-rca/">Field Notes #3 — Deploy Broke Prod Again</a> (quick start, rules table, CI gate). <a href="/signalpilot/">SignalPilot landing page</a>.
</div>

---

## If this sounds familiar

If you've ever stared at Grafana while someone said "should we rollback?" and nobody could point to evidence — this is for you.

I'm building in public. Feedback, issues, and war-room stories welcome on [GitHub](https://github.com/perfsage/signalpilot/issues).

**Also on Medium:** [How SignalPilot Correlates Kubernetes Signals for Post-Deploy RCA](https://medium.com/@aashish.bajpai2/how-signalpilot-correlates-kubernetes-signals-for-post-deploy-rca-86b509b088ac)

*Field Notes #4 · By Aashish Bajpai*
