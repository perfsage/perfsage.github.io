# LinkedIn poll (D+5)

---

Poll question: After a bad deploy, what's your first move?

Options:
- kubectl describe / logs
- Open Grafana dashboards
- Rollback immediately
- Blame the last commit
- Run an RCA tool

Comment (post with poll):

We built PerfSage SignalPilot because "open Grafana" and "check kubectl" rarely answer *why* errors spiked after *this* deploy. SignalPilot correlates deploy diff + events + metrics + logs in one report.

Try it: pip install perfsage-signalpilot
perfsage.com/signalpilot/

#Kubernetes #SRE #DevOps
