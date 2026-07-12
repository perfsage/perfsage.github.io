---
title: "3 Fault-Injection Experiments to Run Before Your First Chaos Engineering Game Day"
description: "Most teams' first chaos experiment is killing a random pod in prod with no baseline. Here are 3 safer, higher-signal fault injections to run first — in the order that actually builds confidence."
pubDate: 2026-07-12
heroImage: "/images/blog/chaos-engineering-first-experiments-og.svg"
tags: ["Chaos Engineering", "SRE", "Kubernetes", "Field Notes", "reliability"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #7 · TL;DR</strong> — The most common first chaos experiment — kill a random pod in prod and see what happens — teaches you almost nothing, because most teams skip the step <em>before</em> it: a measured steady state. Here are 3 fault injections I run first with any team, in the order that actually builds confidence, using <a href="https://www.gremlin.com/" target="_blank" rel="noopener noreferrer">Gremlin</a>, <a href="https://chaos-mesh.org/" target="_blank" rel="noopener noreferrer">Chaos Mesh</a>, or <a href="https://litmuschaos.io/" target="_blank" rel="noopener noreferrer">Litmus</a>.
</div>

---

## The experiment most teams run first — and why it teaches you nothing

"Let's kill a pod and see what happens" is how most teams' first chaos experiment starts. It's also usually the wrong first experiment, for a boring reason: **nobody defined what "normal" looks like before pulling the trigger.**

Without a steady-state baseline, every outcome is unfalsifiable. Latency went up — was that the fault, or the Tuesday traffic bump that happens every week? Error rate stayed flat — did resilience hold, or did the request just never reach the pod you killed? You can't tell, so the experiment produces a Slack thread full of guesses instead of a finding.

That's **chaos theater**, not chaos engineering. The fix isn't a better fault — it's a better first three steps.

---

## The methodology, in one table

I run every experiment — for a client engagement or on my own systems — through the same five stages. This is the standard [Principles of Chaos Engineering](https://principlesofchaos.org/) loop, and skipping stage 1 is where most "first experiments" go wrong:

| Stage | What it means | Skip it and… |
|-------|---------------|---------------|
| **1. Define steady state** | Pick 2–3 measurable signals (p99 latency, error rate, saturation) and watch them for a normal period first | You have no baseline to compare against |
| **2. Form a hypothesis** | State what you expect to happen, in writing, before the experiment — "checkout latency stays under 300ms p99" | You can't tell success from a shrug |
| **3. Control the blast radius** | One instance, one service, one AZ — never "prod, everything, see what breaks" | A learning experiment becomes an incident |
| **4. Run and observe** | Watch the same signals from stage 1, live, with a kill switch ready | You find out from a page instead of a dashboard |
| **5. Learn and fix** | Turn every surprise into a runbook entry or a config change, not just a war story | The same weakness bites you again next quarter |

Everything below assumes stages 1–3 are already done. If they're not, that's the actual first experiment to run.

---

## Experiment 1: Resource pressure on a single non-critical service

**Fault:** CPU throttle or memory pressure on one instance of a service that isn't on your critical path.

**Why first:** It's reversible in seconds, doesn't touch networking or dependencies, and immediately tells you whether your autoscaling and alerting actually fire — or whether they're configured against metrics nobody's watching.

**Hypothesis to write down:** "When this pod hits 90% CPU for 2 minutes, HPA scales out within 60 seconds and p99 latency for this service stays under its SLO."

**Blast radius:** One pod, one namespace. Never a whole deployment on the first run.

```bash
# Chaos Mesh — CPU stress on a single labeled pod
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-pressure-experiment-1
spec:
  mode: one
  selector:
    labelSelectors:
      app: checkout-service
  stressors:
    cpu:
      workers: 2
      load: 90
  duration: "120s"
EOF
```

**What "pass" looks like:** Autoscaling reacts, the alert you expect actually fires, and the dependent service's error rate doesn't move. **What you actually learn** the first time: usually that the alert threshold was set for a metric that isn't the one that moves first, or that HPA is scaling on a metric nobody rechecked since the service was rearchitected.

---

## Experiment 2: Single-replica pod kill, PodDisruptionBudget aware

**Fault:** Kill one replica of a multi-replica deployment — but check the PodDisruptionBudget (PDB) first, not after.

**Why second:** This is the experiment everyone wants to run first. Running it second — after you've already confirmed your observability actually shows what you expect from Experiment 1 — means you're testing the *system's* resilience, not discovering your dashboards were misconfigured mid-experiment.

**Hypothesis to write down:** "Killing one of three replicas causes zero client-visible errors, because the PDB and readiness probes route traffic away before termination completes."

**Blast radius:** One pod, PDB confirmed to allow at least one voluntary disruption before you start.

```bash
# Check the PDB before you touch anything
kubectl get pdb checkout-service-pdb -o jsonpath='{.status.disruptionsAllowed}'

# Litmus — single pod-delete experiment
kubectl apply -f - <<EOF
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-kill-experiment-2
spec:
  appinfo:
    appns: default
    applabel: app=checkout-service
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "30"
            - name: FORCE
              value: "false"
EOF
```

**What "pass" looks like:** Client-facing error rate stays flat; the killed pod is replaced before the PDB's minimum-available threshold is breached. **What you actually learn** the first time: often that readiness probes are too slow relative to the load balancer's health-check interval, so there's a 5–10 second window where traffic still routes to a dead pod.

I've run this exact class of experiment on a Kubernetes multi-tenant identity platform serving SSO across an entire cloud org — it's precisely the kind of blast-radius-controlled test you want *before* a real node drains itself on you at 2 a.m.

---

## Experiment 3: Network latency or packet loss between two services

**Fault:** Inject 200–500ms of added latency, or 5–10% packet loss, on the connection between a service and one of its downstream dependencies.

**Why third:** Network faults are the hardest to reason about and the richest in signal — timeouts, retries, and connection pool exhaustion interact in ways CPU and pod-kill experiments never surface. Save it for once you trust your observability, because you'll need it.

**Hypothesis to write down:** "Adding 300ms latency to the payments-service call causes the caller's circuit breaker to open within its configured threshold, and the fallback path returns a degraded-but-successful response instead of a timeout cascade."

**Blast radius:** One service pair, one direction of traffic, short duration.

```yaml
# Chaos Mesh — NetworkChaos, latency injection between two labeled services
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-latency-experiment-3
spec:
  action: delay
  mode: one
  selector:
    labelSelectors:
      app: checkout-service
  delay:
    latency: "300ms"
    jitter: "50ms"
  direction: to
  target:
    selector:
      labelSelectors:
        app: payments-service
    mode: one
  duration: "180s"
```

**What "pass" looks like:** Circuit breakers open on schedule, retries respect backoff instead of hammering the degraded dependency, and the caller's own SLO holds because the fallback path works. **What you actually learn** the first time: usually that retries without backoff turn a 300ms slowdown into a self-inflicted traffic spike — the fault amplifies itself.

<div class="callout callout-success">
<strong>If you already run load-test or post-deploy analysis tooling:</strong> this is the experiment where it pays off. Point <a href="/reveal/">Reveal</a> or <a href="/signalpilot/">SignalPilot</a> at the same time window and check whether it catches the exact signal you just engineered — a network fault you *know* the cause of is the best way to validate that your analysis tooling would catch the one you don't.
</div>

---

## What a real game day deliverable looks like

A chaos experiment that ends with "well, that was interesting" produced a story, not a result. Every experiment above should end with one or more of:

- **A weakness register entry** — specific, reproducible, with the exact config that triggered it
- **A runbook update** — what an on-call engineer does differently now that this failure mode is known
- **A config or code change** — the retry backoff, the probe timing, the alert threshold that was wrong
- **A regression test** — the same fault, automated, so it can run again next release without a human watching

If an experiment doesn't produce at least one of these, either the hypothesis was too vague or the blast radius was too small to matter. Both are fixable — just not by running more experiments faster.

---

## Bringing this into CI/CD

Once a handful of these experiments are boring — you know the outcome, the system handles it — that's the signal to automate them. Lightweight chaos scenarios can run on every release candidate and fail the build if a known resilience guarantee regresses, the same way an SLO gate fails a build on a load-test regression. The scenarios worth automating are usually exactly the three above: they're fast, safe, and their pass/fail criteria are unambiguous once you've run them manually a few times.

---

## Try this with your team

You don't need a big-bang "chaos day" to start. Run Experiment 1 this week, on one non-critical service, with a hypothesis written down before you touch anything. That's the whole first step.

If you want a second set of eyes on experiment design, blast-radius sizing, or wiring resilience gates into CI/CD:

- **[Chaos Engineering services](/chaos-engineering/)** — fault injection design, Kubernetes chaos, steady-state baselines, CI/CD resilience gates, and team training
- **Book a session:** [topmate.io/abajpai](https://topmate.io/abajpai/659595)
- **Background:** [Gremlin Certified Chaos Engineer](https://certification.gremlin.com/abf04395-36b7-4a42-94e3-705aed064647) · [about Aashish](/about/)

*Field Notes #7 · By Aashish Bajpai*
