# SignalPilot launch distribution copy

Ready-to-paste copy for launch day and week 1. Run site deploy and GitHub Release v1.0.0 before posting.

## Launch day order (stagger 30–60 min)

1. Verify [v1.0.0 release](https://github.com/perfsage/signalpilot/releases/tag/v1.0.0) and `pip install perfsage-signalpilot`
2. [Show HN](show-hn.md) — highest download spike
3. [LinkedIn personal](linkedin-personal.md) — 30 min after HN
4. LinkedIn company: `npm run linkedin:chrome` then `node scripts/linkedin-company-post.mjs --post`
5. [Reddit](reddit-devops.md) — r/devops and r/kubernetes
6. [Dev.to cross-post](devto-crosspost.md) — canonical URL to Field Notes #5

Reply to every comment for 4 hours.

## Week 1

| Day | Asset |
|-----|-------|
| D+1 | [LinkedIn checklist](week1-linkedin-checklist.md) |
| D+2 | GitHub Discussions: pin Getting started (see below) |
| D+3 | [Awesome-list PR template](awesome-list-pr.md) |
| D+4 | [Medium draft](medium-draft.md) |
| D+5 | [LinkedIn poll](week1-linkedin-poll.md) |
| D+6 | Stack Overflow: answer OOMKilled / CrashLoopBackOff threads with helpful context |
| D+7 | `npm run linkedin:apply` — verify company About |

## GitHub Discussions (create manually or via UI)

**Category: General → Pin "Getting started"**

Title: Getting started with SignalPilot v1.0

Body:

```markdown
## Install

pip install perfsage-signalpilot
kubectl apply -f https://raw.githubusercontent.com/perfsage/signalpilot/v1.0.0/deploy/signalpilot-rbac.yaml
signalpilot analyze YOUR_NAMESPACE --deployment YOUR_DEPLOY --output report.html

## Docs

- Landing: https://perfsage.com/signalpilot/
- Field Notes #5: https://perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/
- Sample report: https://github.com/perfsage/signalpilot/blob/main/examples/sample-report.html

## Feedback

Share war-room stories and missing RCA rules here.
```

**Category: Show and tell**

Title: Show and tell — post-deploy RCA reports

Body: Invite users to share anonymized report screenshots and MTTR before/after.

## Objection handlers

| Objection | Response |
|-----------|----------|
| Another AI hype tool? | Core RCA is deterministic rules; LLM is optional, no API key required |
| We have Datadog/K8sGPT | Deploy-context-first, read-only RBAC, MIT, kubectl fixes not chat |
| Security? | Read-only RBAC YAML; no pod agents |
