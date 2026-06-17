# Medium draft (D+4)

Title: From 3-Hour War Room to 5-Minute RCA — Shipping SignalPilot v1.0

Subtitle: Open-source Kubernetes post-deploy analysis that correlates evidence, not dashboards

---

## The question

"Why did errors spike after my last deployment?"

Simple question. Expensive answer. I've sat in war rooms where three engineers stare at three tools and nobody can cite cross-source evidence for two hours.

Enterprise RCA platforms exist. So do enterprise price tags. I wanted something a practitioner could run from a laptop in five minutes.

## What we shipped

PerfSage SignalPilot v1.0 — MIT licensed, read-only RBAC, no agents in app pods.

pip install perfsage-signalpilot

It runs observe → correlate → explain → recommend → verify across K8s API, metrics-server, logs, cAdvisor, optional Prometheus, and git.

## A concrete example

OOMKilled after deploy. SignalPilot correlates:
- Container restart reason OOMKilled
- Memory working-set at 96% of limit
- Deploy diff showing memory limit halved
- New log fingerprint: Java heap space

Rule: oom_killed. Fix: kubectl set resources with raised memory limit — copy-pasted from the HTML report.

## Not AI theater

Core RCA is deterministic rules. Optional LLM polish if you want narrative polish. No API key required for ranked findings.

## The ladder

Reveal for load tests. SLO Reporter for CI gates. SignalPilot for prod RCA. Same philosophy: reports data, explains what to do next.

Links:
- GitHub: https://github.com/perfsage/signalpilot
- Walkthrough: https://perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/
