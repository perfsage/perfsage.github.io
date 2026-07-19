---
title: "CPU/Memory Sizing from Real Usage — Not Guesswork"
description: "Stop copying Kubernetes requests/limits from the last service. Size CPU and memory from working-set, throttle, and saturation — then let SignalPilot cite the evidence."
pubDate: 2026-07-19
heroImage: "/images/signalpilot-og.svg"
tags: ["Kubernetes", "SRE", "SignalPilot", "Field Notes", "capacity planning"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #8 · TL;DR</strong> — Most Kubernetes CPU/memory limits are folklore: copied from another Deployment, rounded up after an OOM, or left at the Helm chart default. Size from <em>real usage</em> instead — working-set vs limit, CFS throttle ratio, and saturation after a deploy — then act on ranked findings. <a href="https://github.com/perfsage/signalpilot" target="_blank" rel="noopener noreferrer">PerfSage SignalPilot</a> correlates those signals with the deploy diff so the recommendation is a number you can defend, not a gut feel. <a href="/signalpilot/">Landing page</a> · <code>pip install perfsage-signalpilot</code>.
</div>

---

## The sizing lie we keep telling ourselves

Ask most teams how they picked `resources.requests` and `resources.limits` and you'll hear one of three answers:

1. **"Same as the other API"** — copy-paste from a sibling Deployment
2. **"We doubled it after the OOM"** — incident-driven inflation with no ceiling
3. **"Whatever the chart shipped with"** — defaults from 2021 still in prod

None of those are capacity planning. They're vibes with YAML syntax.

The question that actually matters:

> *"Given what this container used in the last steady-state window — and what changed in the last deploy — what should requests and limits be?"*

That is **sizing from real usage**. SignalPilot exists to make the evidence for that answer show up in one report instead of three Grafana tabs and a Slack thread.

---

## What "real usage" means (not average CPU)

Averages lie here the same way they lie in load tests. For Kubernetes resource sizing, I care about these signals — not "CPU was fine on average":

| Signal | Source | Why it decides sizing |
|--------|--------|------------------------|
| Memory working-set vs limit | metrics-server / cAdvisor | Predicts OOM before the kill event |
| CFS throttle ratio | cAdvisor / Prometheus | High throttle = latency tax even when "CPU % looks OK" |
| Request vs actual usage | metrics-server | Oversized requests waste node capacity; undersized ones starve scheduling |
| Deploy diff on `resources.*` | K8s API | Tells you whether *this* rollout caused the pressure |
| OOMKilled / Pending / FailedScheduling | K8s events | Confirms the failure mode when usage already crossed the line |

If you're only watching mean CPU on a dashboard, you will undersize until p99 latency complains — or oversize until FinOps does.

---

## Three failure modes SignalPilot already ranks

These are the resource rules I trust in post-deploy RCA. Each one fuses **usage + events + (usually) a deploy diff** — not a single chart spike.

### 1. Undersized memory → `oom_killed`

**Pattern:** Working-set climbs to ~90%+ of limit. Container dies with OOMKilled. Sometimes the deploy *halved* the limit "to save cost."

**What to size from:** Peak working-set in the healthy baseline window × headroom (I start at **1.3–1.5×** for JVM/Node heaps; tighten once you have a week of stable data).

**Typical fix from the report:**

```bash
kubectl set resources deployment/my-app -n my-namespace \
  --limits=memory=512Mi --requests=memory=256Mi
```

Request ≈ ~50% of limit is a common starting split when you don't have HPA quirks; adjust once QoS class and bin-packing goals are clear.

### 2. Undersized CPU → `cpu_throttled`

**Pattern:** CFS throttle ratio stays high (SignalPilot's rule looks for **> ~30%**) while latency regresses after deploy — even if "CPU utilization" looks mediocre on a 5-minute average.

**What to size from:** Throttle periods during peak, not idle-hour averages. Raise **limit** when you're hard-capped; raise **request** when the scheduler is packing you onto noisy neighbors and you need guaranteed CPU.

**Typical fix:**

```bash
kubectl set resources deployment/my-app -n my-namespace \
  --limits=cpu=1000m --requests=cpu=500m
```

### 3. Oversized requests → `pending_unschedulable`

**Pattern:** Pods stuck Pending with FailedScheduling. Events cite insufficient CPU/memory. Actual usage of running replicas is a fraction of the request.

**What to size from:** Real usage of *healthy* pods in the same Deployment — then set requests near that floor with a small buffer. Limits can stay higher for bursts.

Cutting a fantasy `cpu: 4` request to what the process actually needs often unblocks more capacity than buying another node.

---

## A practical sizing loop (use this after every meaningful deploy)

I run the same loop whether I'm consulting or dogfooding SignalPilot:

1. **Baseline** — before the change, note working-set and throttle for the Deployment
2. **Deploy** — ship the image/config change (resource changes count as deploys)
3. **Analyze** — correlate usage with what changed:

```bash
pip install perfsage-signalpilot
kubectl apply -f https://raw.githubusercontent.com/perfsage/signalpilot/v1.0.0/deploy/signalpilot-rbac.yaml

signalpilot analyze my-namespace --deployment my-app --output sizing-report.html
```

4. **Decide** — only change requests/limits when a finding cites multiple signals (e.g. OOMKilled **and** working-set near limit **and** a memory limit diff)
5. **Verify** — re-run after the fix; SignalPilot's verify loop labels Fixed / Regressed / Unchanged so you don't guess from a single green panel

Preview the shape of the output without a cluster: [sample HTML report](https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html).

---

## Symptom → signal → sizing move

| Symptom | Signals to trust | Sizing move |
|---------|------------------|-------------|
| Restarts after deploy, OOMKilled | Working-set ≈ limit + deploy touched `limits.memory` | Raise memory limit; set request to ~50–70% of new limit |
| p99 up, CPU % "looks fine" | CFS throttle high + latency regression | Raise CPU limit (and request if Guaranteed QoS / noisy neighbor) |
| Pods Pending, cluster "full" | FailedScheduling + actual usage ≪ request | Lower requests to real usage + buffer; keep burst headroom in limits |
| Cost spike, idle pods | Request ≫ p95 usage for a week | Right-size requests; don't confuse limit with request |
| "We need more nodes" | Bin-packing waste from inflated requests | Fix requests first; buy hardware second |

<span class="hl-orange">Analysis, not dashboards:</span> a single CPU graph never tells you whether to touch request, limit, or both. Correlation with the deploy diff does.

---

## Checklist before you merge the next resource PR

- [ ] Peak **working-set** measured in a realistic traffic window (not Sunday morning)
- [ ] **Throttle ratio** checked at the same peak — not only average CPU
- [ ] Requests set from usage floor + buffer; limits from burst / OOM headroom
- [ ] Deploy diff reviewed — did this PR change `resources.*` without a usage justification?
- [ ] Post-deploy: `signalpilot analyze` (or `signalpilot gate` in CI) shows no HIGH `oom_killed` / `cpu_throttled` / `pending_unschedulable`
- [ ] Re-verify after the fix so the next person inherits evidence, not folklore

---

## Where this sits on the PerfSage ladder

1. **[Reveal](/reveal/)** — prove the app can take load in the lab (p99, errors, throughput)
2. **[SLO Reporter](/slo-plugin/)** — gate the load test in CI
3. **[SignalPilot](/signalpilot/)** — after deploy, size and diagnose from **production usage**, not copied YAML

Load-test SLOs tell you the service *can* be fast. Resource sizing from real usage keeps it fast when the scheduler, noisy neighbors, and heap pressure show up.

---

## Try it

```bash
pip install perfsage-signalpilot
signalpilot analyze my-namespace --deployment my-app --output report.html
```

- **Repo:** [github.com/perfsage/signalpilot](https://github.com/perfsage/signalpilot)
- **Release:** [v1.0.0](https://github.com/perfsage/signalpilot/releases/tag/v1.0.0)
- **Related Field Notes:** [5-minute post-deploy postmortem](/blog/5-minute-post-deploy-postmortem-signalpilot/) · [why I built SignalPilot](/blog/why-im-building-signalpilot-kubernetes-rca/)

If your "capacity plan" is still a spreadsheet of round numbers, start with one Deployment and one steady-state window. Size from the evidence. Leave the folklore in the git history.

---

*Field Notes #8 · By Aashish Bajpai*
