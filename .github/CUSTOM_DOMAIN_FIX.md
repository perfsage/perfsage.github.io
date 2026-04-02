# Custom domain shows GitHub Pages “404 / Site not found” while `*.github.io` works

## What we verified

- `https://perfsage.github.io/` serves the built site (HTTP 200).
- `https://perfsage.com/` and `https://www.perfsage.com/` return GitHub’s Pages 404 HTML.
- DNS is already correct: apex `A` records point at GitHub Pages IPs; `www` `CNAME` points at `perfsage.github.io`.

So the problem is **not** the Astro build or the `dist` artifact. GitHub is receiving traffic for your hostnames but **has not bound those hostnames to this Pages site** (or the binding needs to be refreshed after changing the publish source).

## Fix (repository admin)

1. Open **Settings → Pages** for `perfsage/perfsage.github.io`.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).  
   After the Astro migration, branch-based publishing would serve the repo root, which no longer contains a top-level `index.html`, so you must use Actions + the `dist` artifact.
3. Under **Custom domain**, enter `perfsage.com` and click **Save**.  
   If it was already set, use **Remove**, Save, then add `perfsage.com` again and Save (this re-establishes the mapping after the deploy source changed).
4. Wait until the DNS check shows **verified** (you already have the right records; GitHub may just need to re-check).
5. Enable **Enforce HTTPS** once the certificate is available.
6. If your org uses **verified domains**, ensure `perfsage.com` is allowed for GitHub Pages at the org level (org **Settings → Pages** / domain verification), if required by your org policy.

## Repo files related to the domain

- **`public/CNAME`** (and the copy in **`dist/CNAME`** after build): should stay `perfsage.com` so the published site carries the custom hostname metadata.
- **Root `CNAME`**: kept in sync for visibility and tooling that still looks at the default branch.

After the settings above are saved, `https://www.perfsage.com/` and `https://perfsage.com/` should stop returning the generic GitHub “no site here” page once DNS and certificate provisioning complete (often within a few minutes; TLS can take longer).
