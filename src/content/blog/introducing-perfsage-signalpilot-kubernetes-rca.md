---
title: "Deploy Broke Prod Again — So I Built PerfSage SignalPilot"
description: "After one too many post-deploy war rooms staring at kubectl and Grafana separately, I built SignalPilot — an open-source Kubernetes RCA copilot that correlates deploy diffs, events, metrics, logs, and git into ranked findings with kubectl fixes."
pubDate: 2026-06-13
draft: true
heroImage: "/images/signalpilot-og.svg"
tags: ["Kubernetes", "SRE", "performance engineering", "Field Notes", "open source", "product launch"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #3 · TL;DR</strong> — You deployed. Errors spiked. Someone opens kubectl, someone opens Grafana, someone blames the last commit. <a href="https://github.com/perfsage/signalpilot" target="_blank" rel="noopener noreferrer">PerfSage SignalPilot</a> runs an <em>observe → correlate → explain → recommend → verify</em> loop across K8s API, metrics-server, logs, cAdvisor, Prometheus, and optional git — then ranks findings with copy-paste <code>kubectl</code> fixes. Open source. MIT. <a href="/signalpilot/">Landing page</a>.
</div>

---

## The question every deploy review should answer

> *"Why are errors and performance degradation happening after my last deployment?"*

That question is simple. Getting a **defensible answer** in under five minutes is not.

kubectl `describe` shows one pod. Grafana shows a metric spike. Git shows a commit. None of them cite each other.

---

## What SignalPilot does differently

SignalPilot fuses **cross-source evidence** into deterministic RCA rules:

| Rule | What it correlates | Typical fix |
|------|-------------------|-------------|
| `oom_killed` | OOMKilled + memory near limit | Raise memory limit |
| `cpu_throttled` | CFS throttle + latency regression | Raise CPU request/limit |
| `crash_loop` | CrashLoopBackOff + logs + config diff | Rollback or fix env |
| `code_regression` | New log fingerprints + git suspect commit | Investigate commit |

Each finding cites **multiple signal types** — not a single chart anomaly.

---

## Quick start

```bash
git clone https://github.com/perfsage/signalpilot
cd signalpilot && pip install -e .

kubectl apply -f deploy/signalpilot-rbac.yaml

signalpilot analyze my-namespace --deployment my-app --output report.html
```

CI gate (exit 1 on HIGH+ findings):

```bash
signalpilot gate my-namespace --deployment my-app --junit-xml results.xml
```

Full docs on the [SignalPilot landing page](/signalpilot/) and [GitHub README](https://github.com/perfsage/signalpilot).

---

## The PerfSage ladder: test → gate → RCA

1. **Reveal** — JMeter JTL analysis in the lab ([/reveal/](/reveal/))
2. **SLO Reporter** — CI gates on load tests ([/slo-plugin/](/slo-plugin/))
3. **SignalPilot** — post-deploy RCA in production ([/signalpilot/](/signalpilot/))

---

*Field Notes #3 · By Aashish Bajpai*
