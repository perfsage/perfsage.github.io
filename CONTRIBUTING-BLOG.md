# Blog Contribution Workflow

Publishing a new post to the PerfSage blog is a three-step process:
**write → drop file → push**.

---

## Directory layout

```
src/content/blog/
  └── my-post-slug.md          ← one file per post
```

All posts live in `src/content/blog/`. The filename becomes the URL slug:
`my-post-slug.md` → `perfsage.com/blog/my-post-slug/`

---

## Required frontmatter

Every post must start with YAML frontmatter (Obsidian writes this automatically when you use the *Properties* pane):

```yaml
---
title: "Your Post Title Here"
description: "One-line summary shown in cards and SEO meta (~140 chars)."
pubDate: 2026-04-05
tags: ["JMeter", "SLO", "performance engineering"]
draft: false
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | ✅ | Short and punchy |
| `description` | ✅ | ~140 chars, shown on listing cards |
| `pubDate` | ✅ | `YYYY-MM-DD` — sets sort order |
| `tags` | — | Array of strings; first 2–3 shown on cards |
| `draft` | — | `true` = skip in build (safe to commit WIP) |
| `updatedDate` | — | `YYYY-MM-DD` shown on post if set |
| `author` | — | Defaults to `"Aashish Bajpai"` |

---

## Obsidian workflow

### Option A — Point Obsidian directly at the content folder

1. Open Obsidian **Settings → Files & Links → Default location for new notes**  
   → set to `src/content/blog` (relative to your vault root, which is the repo root).
2. Write posts as normal `.md` files in Obsidian.  
3. Use the *Properties* pane (Cmd/Ctrl + ;) to fill in the frontmatter fields.

### Option B — Write anywhere, drop the file

1. Write the post in any Obsidian vault.
2. Copy/move the final `.md` file into `src/content/blog/`.
3. Make sure the frontmatter block is at the top.

### Tips for Obsidian-friendly markdown

- Use `[[wikilinks]]` sparingly — Astro won't resolve them. Use standard `[text](url)` links instead.
- Images: place image files in `public/images/blog/<post-slug>/` and reference them as:
  ```md
  ![Alt text](/images/blog/my-post-slug/screenshot.png)
  ```
- Code blocks with language hints render nicely: ` ```python `, ` ```bash `, etc.
- Obsidian callouts (`> [!NOTE]`) render as standard blockquotes (styled in CSS).

---

## Preview locally

```bash
npm run dev
```

Open `http://localhost:4321/blog/` to see the listing, and  
`http://localhost:4321/blog/<your-slug>/` for the post.

Posts with `draft: true` are **excluded** from the build but visible in dev mode via:
```bash
# temporarily — Astro dev shows drafts by default
npm run dev
```

---

## Publish

```bash
git add src/content/blog/my-post-slug.md
git commit -m "blog: add post about <topic>"
git push origin main
```

GitHub Actions builds and deploys automatically. The post is live on `perfsage.com/blog/` within ~2 minutes.

---

## Checklist before publishing

- [ ] `draft: false` (or field removed)
- [ ] `pubDate` set to today
- [ ] `description` written (~140 chars)
- [ ] `tags` added (1–4 tags)
- [ ] Wikilinks converted to standard markdown links
- [ ] Images placed in `public/images/blog/<slug>/` if any
- [ ] `npm run build` passes locally (no errors)
- [ ] Smoke-tested in `npm run dev`
