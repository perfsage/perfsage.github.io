---
title: "5-Minute Post-Deploy Postmortem with SignalPilot"
description: "SignalPilot v1.0 is live — open-source Kubernetes RCA that correlates deploy diffs, events, metrics, logs, and git into ranked findings with kubectl fixes. Here's a real walkthrough and how it cuts post-deploy MTTR."
pubDate: 2026-06-17
heroImage: "/images/signalpilot-og.svg"
tags: ["Kubernetes", "SRE", "MTTR", "Field Notes", "open source", "product launch"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #5 · TL;DR</strong> — <a href="https://github.com/perfsage/signalpilot/releases/tag/v1.0.0" target="_blank" rel="noopener noreferrer">SignalPilot v1.0</a> is live. Install with <code>pip install perfsage-signalpilot</code>, apply read-only RBAC, run <code>signalpilot analyze</code> — get a ranked HTML report with cited evidence and copy-paste <code>kubectl</code> fixes in under five minutes. Not another dashboard. <span class="hl-orange">Analysis you can act on.</span> <a href="/signalpilot/">Landing page</a> · <a href="https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html" target="_blank" rel="noopener noreferrer">Sample report</a>.
</div>

---

## The MTTR gap nobody talks about

Deploy reviews often fail on one question:

> *"Why did errors spike after my last deployment?"*

Not "what's the error rate?" — you can see that in Grafana. The hard part is **defensible correlation**: linking OOMKilled on pod `api-7f3c` to a memory limit change in the deploy diff, a new log fingerprint, and optionally the git commit that touched the heap allocator.

That correlation used to cost me **2–3 hours** of tab-switching. SignalPilot targets **under five minutes** for typical post-deploy regressions.

| Stage | Manual war room | SignalPilot |
|-------|-----------------|-------------|
| T+0 | Deploy completes | Deploy completes |
| T+5 min | Someone opens kubectl | `signalpilot analyze` starts collectors |
| T+20 min | Grafana dashboard shared | Deploy diff + events + metrics fused |
| T+60 min | "Maybe it's memory?" | Ranked finding: `oom_killed` with evidence |
| T+120 min | Still debating rollback | Copy-paste `kubectl` fix on screen |
| T+180 min | Postmortem doc started | HTML report exported; gate ready for CI |

---

## Install (v1.0.0)

```bash
pip install perfsage-signalpilot

kubectl apply -f https://raw.githubusercontent.com/perfsage/signalpilot/v1.0.0/deploy/signalpilot-rbac.yaml

signalpilot analyze my-namespace --deployment my-app --output report.html
```

Preview output without a cluster: [sample HTML report on GitHub](https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html).

---

## Walkthrough: `oom_killed` after deploy

**Symptom:** Error rate jumps after a deploy. Pods restarting.

**What SignalPilot correlates:**

| Signal source | Evidence |
|---------------|----------|
| K8s API | Container `app` OOMKilled, 4 restarts in 10 min |
| metrics-server | Memory working-set at 96% of limit |
| Deploy diff | `resources.limits.memory` changed 512Mi → 256Mi |
| Logs | New fingerprint: `java.lang.OutOfMemoryError: Java heap space` |

**Rule fired:** `oom_killed` — confidence ranked HIGH.

**Recommended fix (copy-paste from report):**

```bash
kubectl set resources deployment/my-app -n my-namespace \
  --limits=memory=512Mi --requests=memory=256Mi
```

Each finding cites **multiple signal types** — not a single chart anomaly. That's the difference from staring at one Grafana panel.

---

## CI gate: catch regressions before traffic fully shifts

Complement load-test SLO gates from [SLO Reporter](/slo-plugin/) with a post-deploy sanity check:

```bash
signalpilot gate my-namespace --deployment my-app --junit-xml results.xml
```

GitHub Actions example:

```yaml
- name: Post-deploy RCA gate
  run: |
    pip install perfsage-signalpilot
    signalpilot gate "${{ env.K8S_NAMESPACE }}" \
      --deployment "${{ env.DEPLOYMENT_NAME }}" \
      --junit-xml signalpilot-results.xml
  env:
    K8S_NAMESPACE: production
    DEPLOYMENT_NAME: api
```

Exits non-zero on HIGH+ findings — same severity model as your SLO gates, different signal layer.

---

## Deterministic rules first, optional LLM polish

I'm not building "AI that fixes prod." SignalPilot's core RCA runs **deterministic rules** — `oom_killed`, `cpu_throttled`, `crash_loop`, `image_pull_error`, `probe_failure`, `code_regression`, and more. Optional LLM narrative polish is there if you want it; **no API key required** for ranked findings and kubectl recommendations.

---

## The PerfSage ladder: test → gate → RCA

1. **[Reveal](/reveal/)** — JMeter JTL analysis in the lab
2. **[SLO Reporter](/slo-plugin/)** — CI gates on load tests
3. **[SignalPilot](/signalpilot/)** — post-deploy RCA in production

Same DNA across all three: **reports data → explains what to do next.**

---

## Try it

- **Install:** `pip install perfsage-signalpilot`
- **Repo:** [github.com/perfsage/signalpilot](https://github.com/perfsage/signalpilot)
- **Release:** [v1.0.0](https://github.com/perfsage/signalpilot/releases/tag/v1.0.0)
- **Background:** [Field Notes #4 — why I built it](/blog/why-im-building-signalpilot-kubernetes-rca/) · [Field Notes #3 — quick start](/blog/introducing-perfsage-signalpilot-kubernetes-rca/)

War-room stories and feedback welcome on [GitHub Issues](https://github.com/perfsage/signalpilot/issues).

*Field Notes #5 · By Aashish Bajpai*
