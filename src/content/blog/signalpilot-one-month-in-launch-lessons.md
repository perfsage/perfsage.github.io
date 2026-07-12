---
title: "SignalPilot, One Month In: Zero Stars, Real Installs, and What I'd Do Differently"
description: "One month after shipping SignalPilot: 0 GitHub stars, a working pip install, and the honest channel-by-channel breakdown of what worked and what didn't."
pubDate: 2026-07-12
heroImage: "/images/blog/signalpilot-one-month-in-og.svg"
tags: ["open source", "Field Notes", "Kubernetes", "product launch", "building in public"]
author: "Aashish Bajpai"
---

<div class="callout callout-info">
<strong>Field Notes #6 · TL;DR</strong> — <a href="https://github.com/perfsage/signalpilot" target="_blank" rel="noopener noreferrer">SignalPilot</a> shipped v1.0 on June 17. A month later: <span class="hl-red">0 GitHub stars</span>, <span class="hl-orange">0 forks</span> — and <code>pip install perfsage-signalpilot</code> that actually works, which is more than I could say on launch day. Here's the honest scoreboard, channel by channel, plus what I'm changing for month two.
</div>

---

## The scoreboard, no spin

I write "analysis over dashboards" on every PerfSage landing page. Fair enough that I hold myself to it. So here's the dashboard, unfiltered:

<div class="result-grid">
  <div class="result-stat">
    <span class="result-value hl-red">0</span>
    <span class="result-label">SignalPilot GitHub Stars</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-red">0</span>
    <span class="result-label">Reveal GitHub Stars</span>
  </div>
  <div class="result-stat">
    <span class="result-value">13</span>
    <span class="result-label">LinkedIn Followers</span>
  </div>
  <div class="result-stat">
    <span class="result-value hl-teal">1</span>
    <span class="result-label">Working PyPI Package</span>
  </div>
</div>

Reveal launched seven weeks ago, cross-posted to Medium and pinned on the tools page. Same GitHub star count as a two-week-old SignalPilot: zero. That's not a SignalPilot problem — it's the actual, un-hyped baseline for a solo-founder OSS launch with no existing audience.

I could have skipped this post. Nobody makes you publish your zeros. But **Field Notes** exists to be the field notes, not the highlight reel — and the highlight-reel version of "I launched three open-source tools this year" hides the part that's actually useful to anyone else about to do the same thing.

---

## What I actually tried

Launch day, I ran the same distribution checklist I'd use for a client: post everywhere the audience already is, cross-link for SEO, automate what's automatable.

| Channel | Result |
|---------|--------|
| LinkedIn (company page) | **Posted** — automated via company admin composer |
| LinkedIn (personal) | **Posted** — auto-attached blog link preview |
| Dev.to | **Posted**, canonical URL pointed back to `perfsage.com/blog` |
| r/devops | **Removed by Reddit's filters** within minutes — no human explanation given |
| r/kubernetes | **Blocked** — rate-limited, then Rule 6 flagged it as a "new tool" post that belongs in the weekly self-promo thread |
| Show HN | **Never posted** — not logged into a Hacker News account, and that's not something you script around |
| GitHub Discussions | **Opened**, zero replies so far |
| PyPI | **Broken on day one**, fixed within the week |

That last row deserves its own paragraph, because it's the one with a concrete root cause and a concrete fix — the kind of thing I'd want in *my* postmortem template.

---

## The PyPI outage was self-inflicted, and instructive

`pip install signalpilot` doesn't work. The name was already taken by an unrelated project — a five-minute check I should have run before writing any launch copy. Renamed to `perfsage-signalpilot`, which also happens to namespace every future PerfSage CLI tool the same way. One naming mistake, one durable convention.

The bigger issue: PyPI's trusted-publisher OIDC wasn't configured before the release tag fired, so the very first `pip install` command I shared publicly returned nothing installable. For about a week, the honest instruction was "install the wheel from the GitHub Release instead." I fixed the publisher trust relationship, re-tagged, and verified `pip install perfsage-signalpilot` end-to-end before writing this post.

<div class="callout callout-warning">
<strong>Lesson:</strong> Run the install command yourself, from a clean machine, <em>after</em> the release workflow finishes — not just after you believe the workflow finished. A green CI run and a working <code>pip install</code> are not the same claim.
</div>

---

## What Reddit and Hacker News actually taught me

Neither of these are complaints about moderators — the filters exist for good reasons, mainly to keep low-effort self-promotion out of communities that vote with their attention. But the mechanics are worth naming plainly, because "just post it on Reddit and HN" is common launch advice that undersells the friction:

- **Reddit's spam filters key heavily on account history and domain reputation**, not just post content. A brand-new domain linking to a brand-new GitHub repo from a low-karma account reads identically to spam, regardless of whether the tool is real and free.
- **Show HN has a login wall that can't be automated around** — and shouldn't be. It's a small, deliberate speed bump that keeps the queue human. If you want that channel, you build the account and the karma *before* launch day, not during it.
- **Weekly self-promo threads exist precisely for tools like mine.** r/kubernetes's Rule 6 wasn't hostile — it was routing me to the right venue. I ignored that the first time because "own thread" felt like a bigger stage. It isn't; it's the wrong stage.

None of this is a reason to skip these channels. It's a reason to treat them as **relationship-building**, not **distribution automation** — which changes what "launch prep" should include next time.

---

## What actually worked

Two things paid off, and neither was flashy:

1. **The Dev.to crosspost with a canonical URL back to the blog.** No launch-day spike, but it's a real, indexable backlink that compounds with every search engine crawl — the opposite of a Reddit post that gets removed in nine minutes.
2. **Owning the audience I do have.** 13 LinkedIn followers is a small number to type out loud. It's also 13 people who chose to see PerfSage content without an algorithm forcing it on them. The "Week 1 recap" post to that small audience got more genuine engagement than either Reddit submission — because it wasn't fighting a spam filter first.

The pattern: **channels I control (blog, LinkedIn, Dev.to canonical links) delivered exactly what I built. Channels gated by someone else's trust algorithm (Reddit, HN) delivered friction** — deserved friction, but friction all the same, for an account with no history on either platform.

---

## The lesson under the lesson

Stars and upvotes are lagging indicators gated by network effects a brand-new org doesn't have. They're also the metric every "I launched on Product Hunt and got 500 upvotes" post leads with — which makes zero feel like failure when it's actually just **week one of a project with no existing audience**.

The leading indicators I should have been watching instead:

- Does the install command work, unattended, on a machine that's never seen the project? *(No, for a week. Fixed now.)*
- Is the documentation indexed and getting organic search impressions? *(Too early to tell — GA4 and IndexNow only went live this cycle.)*
- Did one real person open one real GitHub issue or Discussion? *(Not yet.)*
- Does the content compound — do older posts still get read a month later? *(This is the actual test, and it takes months, not launch weeks, to answer.)*

None of those show up on a launch-day dashboard. All of them matter more than the star count.

---

## What changes in month two

Concretely, not aspirationally:

- **Stop treating Reddit/HN as launch-day automation targets.** Build account history on both before the *next* tool ships, and post there as a person with a track record, not a bot with a link.
- **Run every install command from a clean environment before publishing it**, not just after CI turns green.
- **Give Reveal and SLO Reporter the same content cadence SignalPilot got.** The ladder story — test, gate, RCA — only works if all three rungs have fresh, indexable content, not just the newest one.
- **Set a real revisit date.** I'm coming back to these exact numbers at the 90-day mark, in public, whether they've moved or not.

---

## The PerfSage ladder, still standing on three rungs

1. **[Reveal](/reveal/)** — JMeter JTL analysis in the lab (0 stars, 7 weeks in)
2. **[SLO Reporter](/slo-plugin/)** — CI gates on load tests
3. **[SignalPilot](/signalpilot/)** — post-deploy RCA in production (0 stars, 4 weeks in)

Same DNA across all three, star count notwithstanding: **reports data → explains what to do next.**

---

## Try it, break it, tell me

```bash
pip install perfsage-signalpilot
kubectl apply -f deploy/signalpilot-rbac.yaml
signalpilot analyze my-namespace --deployment my-app --output report.html
```

- **Repo:** [github.com/perfsage/signalpilot](https://github.com/perfsage/signalpilot)
- **Discussions:** [github.com/perfsage/signalpilot/discussions](https://github.com/perfsage/signalpilot/discussions) — genuinely open, genuinely empty right now
- **Background:** [Field Notes #5 — the 5-minute walkthrough](/blog/5-minute-post-deploy-postmortem-signalpilot/) · [Field Notes #4 — why I built it](/blog/why-im-building-signalpilot-kubernetes-rca/)
- **Book a call:** [topmate.io/abajpai](https://topmate.io/abajpai/659595) if you're building something similar and want to skip the PyPI naming mistake

If you're launching your own open-source tool solo, I'd genuinely rather hear what broke for you than take another "we hit #1 on Product Hunt" post at face value. [Issues and war stories welcome](https://github.com/perfsage/signalpilot/issues).

*Field Notes #6 · By Aashish Bajpai*
