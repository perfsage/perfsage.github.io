# Show HN post

**Title:** Show HN: SignalPilot – open-source K8s post-deploy RCA in under 5 minutes

**URL:** https://github.com/perfsage/signalpilot

## First comment (post immediately after submission)

Deploy went fine. Errors didn't. I kept losing 2–3 hours correlating kubectl, Grafana, and git separately after bad deploys.

SignalPilot runs observe→correlate→explain→recommend across K8s API, metrics-server, logs, cAdvisor, optional Prometheus/git — deterministic rules, ranked findings, copy-paste kubectl fixes. MIT, read-only RBAC, no agents in app pods.

Install: pip install perfsage-signalpilot

signalpilot gate for CI with JUnit XML. Part of the PerfSage OSS ladder (Reveal for load tests, SLO Reporter for CI gates).

Landing page: https://perfsage.com/signalpilot/
Walkthrough: https://perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/
Sample report: https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html

Feedback welcome — especially missing RCA rules and false positives.
