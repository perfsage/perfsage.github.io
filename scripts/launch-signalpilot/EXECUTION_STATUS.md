# SignalPilot launch — execution status

Updated: 2026-06-17

## Completed (automated)

| Item | Status | Link |
|------|--------|------|
| GitHub Release v1.0.0 | Done | https://github.com/perfsage/signalpilot/releases/tag/v1.0.0 |
| Site live (`LAUNCHING_SOON=false`) | Done | https://perfsage.com/signalpilot/ |
| Field Notes #5 | Done | https://perfsage.com/blog/5-minute-post-deploy-postmortem-signalpilot/ |
| IndexNow / sitemap ping | Done | `npm run seo:bootstrap` |
| GitHub Discussions | Done | https://github.com/perfsage/signalpilot/discussions/3 |
| Package install verified | Done | Wheel from release; CLI `signalpilot --help` OK |
| Distribution copy | Done | Files in this folder |

## Blocked — manual action required

### PyPI (`pip install perfsage-signalpilot`)

PyPI name `signalpilot` is taken by another project. Package name: **`perfsage-signalpilot`**.

Trusted publishing is not configured on PyPI yet (OIDC `invalid-publisher`). **You must:**

1. Log in at https://pypi.org
2. Create project `perfsage-signalpilot` (or add trusted publisher before first upload)
3. Add trusted publisher: Owner `perfsage`, repo `signalpilot`, workflow `release.yml`
4. Re-push tag or push `v1.0.1` to trigger release workflow

See https://github.com/perfsage/signalpilot/blob/main/docs/PYPI_PUBLISHING.md

**Until then**, users can install from GitHub Release wheel (documented in README).

### Launch day posts (requires your accounts)

Post in this order using copy in this folder:

1. [show-hn.md](show-hn.md) → https://news.ycombinator.com/submit
2. [linkedin-personal.md](linkedin-personal.md) → your profile (attach sample report screenshot)
3. `node scripts/linkedin-company-post.mjs --post` (requires logged-in Chrome: `npm run linkedin:chrome`)
4. [reddit-devops.md](reddit-devops.md) → r/devops and r/kubernetes
5. [devto-crosspost.md](devto-crosspost.md) → Dev.to with canonical URL

### Week 1

| Day | Action | File |
|-----|--------|------|
| D+1 | LinkedIn checklist | [week1-linkedin-checklist.md](week1-linkedin-checklist.md) |
| D+3 | Awesome-list PRs | [awesome-list-pr.md](awesome-list-pr.md) |
| D+4 | Medium post | [medium-draft.md](medium-draft.md) |
| D+5 | LinkedIn poll | [week1-linkedin-poll.md](week1-linkedin-poll.md) |
| D+7 | LinkedIn company About | `npm run linkedin:apply` |

## Pin repo on GitHub org

In GitHub UI: https://github.com/orgs/perfsage → customize pinned repositories → add `signalpilot`.
