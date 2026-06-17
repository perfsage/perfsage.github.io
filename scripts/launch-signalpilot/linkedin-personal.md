# LinkedIn personal launch post

Attach: demo screenshot from examples/sample-report.html or GitHub Release assets.

---

Deploy went fine. Errors didn't.

I used to lose 2–3 hours in post-deploy war rooms:
→ kubectl in one tab
→ Grafana in another
→ someone blaming the last commit
→ still no defensible RCA

Today I'm launching PerfSage SignalPilot v1.0 — open-source Kubernetes RCA that answers one question in under 5 minutes:

"Why did errors spike after my last deploy?"

It correlates deploy diff + K8s events + metrics + logs + optional Prometheus/git into ranked findings with copy-paste kubectl fixes.

Not another dashboard. Analysis you can act on.

Try it:
pip install perfsage-signalpilot
github.com/perfsage/signalpilot

Field Notes walkthrough: perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/

Part of the PerfSage ladder: Reveal (load tests) → SLO Reporter (CI gates) → SignalPilot (prod RCA).

What's your longest post-deploy war room?

#Kubernetes #SRE #OpenSource #Observability #PerfSage
