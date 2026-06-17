# Reddit posts (r/devops and r/kubernetes)

## Title

[Tool] Open-source post-deploy K8s RCA — correlates deploy diff, events, metrics, logs in one report (<5 min)

## Body

After one too many post-deploy war rooms where kubectl, Grafana, and git blame live in three tabs, I shipped SignalPilot — MIT-licensed Kubernetes RCA that fuses cross-source evidence into ranked findings with copy-paste kubectl fixes.

**Install:**

pip install perfsage-signalpilot
kubectl apply -f deploy/signalpilot-rbac.yaml
signalpilot analyze my-namespace --deployment my-app --output report.html

**CI gate** (exit non-zero on HIGH+ findings, JUnit XML):

signalpilot gate my-namespace --deployment my-app --junit-xml results.xml

Read-only RBAC, no agents in app pods. Core RCA is deterministic rules — optional LLM polish, no API key required.

Links:
- GitHub: https://github.com/perfsage/signalpilot
- Walkthrough: https://perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/
- Sample report: https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html

Would love feedback from anyone who runs this on their next sketchy deploy.
