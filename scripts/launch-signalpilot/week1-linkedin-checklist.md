# LinkedIn checklist post (D+1)

---

After every deploy, I check 3 numbers before calling it done:

1. Error rate delta vs pre-deploy baseline
2. p99 latency regression (not just average)
3. Pod restart count + OOMKilled events

Averages lie. Tail latency hides in green dashboards. Restarts tell you something broke even when HTTP 200s look fine.

I built PerfSage SignalPilot to pull all three — plus deploy diff, logs, and git — into one ranked RCA report in under 5 minutes.

pip install perfsage-signalpilot
perfsage.com/signalpilot/

What's on your post-deploy checklist?

#SRE #Kubernetes #Observability #PerfSage
