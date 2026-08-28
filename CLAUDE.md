# Detail Tech — project context for Claude Code

Static marketing site for **Detail Tech** (Crystal Lake, IL — PPF, wraps, tint, ceramic, detailing). Hand-written HTML/CSS/JS exported from Claude Design (claude.ai/design) and deployed on Vercel from GitHub.

## Where things live

- **Repo**: https://github.com/argon-media/detail-tech (public, main branch)
- **Vercel project**: `detail-tech` under the `argon-medias-projects` team
- **Production URLs**:
  - https://detail-tech.vercel.app (default)
  - https://detailtech.argon-devsite.com (custom domain, already aliased — auto-updates on `vercel deploy --prod`)
- **Git identity**: `Argon Media <website@argonmedia.co>` — always pass with `-c user.email=… -c user.name="Argon Media"` when committing (never rely on global git config)

## Project structure

```
detail-tech/
├── index.html                          # homepage
├── about.html, contact.html, reviews.html, tesla.html, sitemap.html
├── ppf.html, ceramic.html, tint.html, wrap.html, fleet.html,
│   mobile.html, auto-detailing.html, correction.html, pdr.html
├── *-options.html                      # 6 A/B mockup pages, UNUSED — nothing links to them
├── styles.css, sections.css, blog.css, script.js
├── blog/
│   ├── index.html                      # blog landing
│   ├── <slug>.html × 7 articles
│   └── tag-<slug>.html × 6 tag pages
├── assets/
│   ├── img/                            # page-specific photos
│   ├── gallery/                        # homepage gallery
│   ├── video/                          # background videos
│   ├── banner.mp4, ppf-banner.mp4
│   ├── logo*.png, favicon.png, og-image.jpg
│   └── award-best-detailer*.png
└── uploads/                            # Claude Design source photos —
                                        # tesla.html references 4 unsplash files here,
                                        # don't blanket-exclude this folder from syncs
```

Files that are **local-only, not in Claude Design bundles**: `.git`, `.vercel`, `.DS_Store`, `uploads/` (partial), `shots/` — all in `.gitignore` except `uploads/` and `shots/`, which ARE tracked. Safe.

## The sync-from-bundle workflow (what the user asks for every few days)

The user works on the site in Claude Design (claude.ai/design), then downloads a "Detail Tech Latest.zip" (or `Detail Tech Latest (N).zip`) into `~/Downloads/`. Ask contains something like *"push latest to git and vercel, find in downloaded, added pages"*.

Steps:

```bash
# 1. Find the latest bundle
ls -lt ~/Downloads | grep -i detail | head -3

# 2. Extract
rm -rf /tmp/dt-latest && mkdir /tmp/dt-latest
unzip -o -q "/Users/waseemaslam/Downloads/Detail Tech Latest*.zip" -d /tmp/dt-latest
find /tmp/dt-latest -maxdepth 3 -type d      # find the actual project root inside

# 3. DIFF everything — DO NOT skip blog/ or asset subdirs (I've missed both before)
P=/tmp/dt-latest/<project-root>
cd "/Users/waseemaslam/Local Sites/detail-tech"

# Root files
for f in $(ls $P | grep -v "^assets$\|^blog$\|^screenshots$\|^uploads$\|\.thumbnail$"); do
  [ -f "$f" ] || echo "  NEW: $f"
  cmp -s "$f" "$P/$f" 2>/dev/null || echo "  CHANGED: $f"
done

# Blog files — DON'T FORGET
for f in $(ls $P/blog/); do
  [ -f "blog/$f" ] || echo "  NEW: blog/$f"
  cmp -s "blog/$f" "$P/blog/$f" 2>/dev/null || echo "  CHANGED: blog/$f"
done

# Assets
diff -rq assets $P/assets 2>&1 | head -30

# 4. Copy changed files (adjust to what the diff shows)
cp "$P"/*.html "$P"/*.css "$P"/*.js .
cp "$P"/blog/*.html blog/
# Only copy referenced uploads/ files — the bundle has ~185 upload files,
# only a handful are actually referenced. See Gotchas #3.

# 5. Audit refs before deploy
python3 -c "
import re, os, glob
missing = set()
for path in glob.glob('*.html') + glob.glob('blog/*.html'):
    base = os.path.dirname(path)
    with open(path) as f: html = f.read()
    for m in re.findall(r'(?:src|href)=\"([^\"?#]+)\"', html):
        if m.startswith(('http://','https://','#','mailto:','tel:','/')): continue
        resolved = os.path.normpath(os.path.join(base, m) if base else m)
        if not os.path.isfile(resolved) and m.endswith(('.jpg','.jpeg','.png','.gif','.webp','.avif','.svg','.mp4','.css','.js','.html')):
            missing.add((path, m))
print(f'Missing refs: {len(missing)}')
for pg, ref in sorted(missing): print(f'  {pg} -> {ref}')
"

# 6. Commit + push + deploy
git add -A
git status --short
git -c user.email=website@argonmedia.co -c user.name="Argon Media" \
    commit -m "Sync Detail Tech Latest bundle: <one-line summary>"
git push origin main
vercel deploy --prod --yes 2>&1 | grep -E "Aliased|Production:|Error" | tail -3
```

That's it. `detailtech.argon-devsite.com` auto-updates from the same Vercel prod deploy.

## Gotchas (from past mistakes — don't repeat these)

1. **Always include `blog/` in the diff.** My first sync only checked root `*.html` and shipped a stale blog for a week. The user noticed. Include blog/ every time.

2. **Don't blanket-exclude `uploads/` when rsyncing.** I once used `rsync --exclude='uploads/'` and broke 4 tesla.html images (`uploads/austin-ramsey-*.jpg`, `carter-baran-*.jpg`, `dmitry-novikov-*.jpg`, `vlad-tchompalov-*.jpg`). Bundle's `uploads/` has ~185 files, most are junk (Instagram exports, source photos) — but a few are referenced from tesla.html. Copy only the referenced ones, or copy all if repo size doesn't matter.

3. **Bundle folder naming varies.** Older bundles extract to `detail-tech-latest/project/`, newer ones to `site-export/`. Always `find` the root before scripting paths.

4. **6 `*-options.html` files are dead weight.** `about-values-options`, `award-options`, `banner-options`, `hero-options`, `ppf-trust-options`, `inner-page-banners` — Claude Design's A/B mockups. Nothing links to them. If they disappear from a bundle, don't add them back. If they appear in a new bundle, don't feel obligated to ship.

5. **Site-wide footer is the Tesla footer.** In July 2026 I unified all page footers to match `tesla.html`'s footer (which has an extra "Quick links" column: Tesla, About, Reviews, Blog, Contact). Later bundles preserve this. If a future bundle regresses one page's footer, re-run the tesla-footer sync — script pattern is preserved in git history under commit "Unify site footer across all pages using Tesla page footer as canonical".

6. **Blog subpage footer links use direct paths (`href="index.html"`), not `../` prefix.** Blog pages live in `blog/`, so their footer's Blog link is just `index.html`. My earlier auto-prefix script made it `../blog/index.html` (works but ugly). Bundle version is cleaner — trust it.

7. **`vercel deploy` sometimes fails with `getaddrinfo ENOTFOUND api.vercel.com`.** Transient DNS resolver issue on this machine, not a real problem. Sleep 3 and retry — succeeds on second attempt.

8. **Never make the repo private.** It was private originally, which broke Claude Design's image importer (raw.githubusercontent.com returns 404 for private-repo assets). It's public now. Keep it public.

9. **`vercel domains inspect detailtech.argon-devsite.com` says "no access"** — but the domain IS aliased and working. Verify with `curl -sI https://detail-tech.vercel.app/` and compare last-modified/etag against a curl to detailtech.argon-devsite.com. They match on prod deploys.

10. **`banner.mp4` is 4.3MB** — largest asset. If a future bundle changes it, that's a real change; if size matches, don't re-copy.

## Post-audit checklist (when the user asks "is everything pushed?")

```bash
cd "/Users/waseemaslam/Local Sites/detail-tech"
git status --short                                    # should be empty
git fetch origin -q
git log origin/main..HEAD --oneline                   # should be empty
diff -rq /tmp/dt-latest/<project-root>/ . 2>&1 | grep -v "screenshots\|uploads\|.thumbnail\|.DS_Store\|.git"
# ^ intentional-diff-only files here (like tint.html if user removed a section) are expected
```

Also run the missing-refs Python check from step 5 above.

## Cross-machine setup (if user opens this on another laptop)

```bash
# Prereqs
brew install gh
npm install -g vercel

# Auth
gh auth login              # argon-media account, HTTPS
vercel login               # website@argonmedia.co

# Clone
gh repo clone argon-media/detail-tech
cd detail-tech
vercel link                # pick argon-medias-projects → detail-tech
```

Then the sync workflow above works identically.

## Things NOT to do

- Don't run `vercel deploy` without `--prod` if the user wants updates on `detailtech.argon-devsite.com` — preview deploys don't propagate.
- Don't `git push --force` or amend.
- Don't touch `sections.css` or `styles.css` unless a bundle changes them or the user explicitly asks. They're stable.
- Don't run `sudo`, don't change git config globally, don't skip hooks.
