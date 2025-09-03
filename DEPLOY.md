# 🚀 VeganBlatt Deployment - ONE COMMAND!

## Deploy Everything

```bash
npm run deploy
```

**That's it!** This single command does EVERYTHING automatically.

---

## What It Does (Automatically)

1. **Bumps version** (1.0.2 → 1.0.3 → 1.0.4...)
2. **Counts real content** (1,272 articles, 723 recipes) 
3. **Builds everything** (TypeScript, CSS, HTML)
4. **Generates SEO** (sitemaps, robots.txt)
5. **Runs all tests** 
6. **Deploys to Cloudflare**
7. **Commits to Git** with version
8. **Pushes to GitHub**
9. **Verifies deployment** 

---

## Version System

Every deploy creates a new version:
- File: `version.json`
- HTML: `<meta name="version" content="1.0.3">`
- Build time: `<meta name="build-time" content="2025-09-03T...">`

---

## Real Content Numbers

Automatically updates descriptions:
- **1,272 Artikel** (counted from files)
- **723 Rezepte** (counted from files)

No manual updates needed!

---

## Post-Deploy Verification

Automatically checks:
- ✅ All pages load (200 OK)
- ✅ Version deployed correctly
- ✅ Sitemaps exist
- ✅ Response time < 500ms
- ✅ SEO tags present
- ✅ NO Twitter tags

### Custom Domain Health
- Production domain: `https://www.veganblatt.com/`
- The Pages project is `veganblatt-static` and deploys to `*.pages.dev`.
- Custom domains must be attached separately. We attach only `www.veganblatt.com` to Pages.
- The apex `veganblatt.com` is configured at Cloudflare to redirect to `www`.

Notes:
- Do not attach `veganblatt.com` (apex) directly to the Pages project — it can stall certificates and cause 503s.
- DNS for `www` should be a proxied CNAME to `veganblatt-static.pages.dev`.
- If you change DNS, allow propagation (a few minutes). The script now prints domain binding status when API creds are present.

### Apex (veganblatt.com) → www Redirects
- Implemented via a lightweight Cloudflare Worker bound to route `veganblatt.com/*`.
- Behavior: 301 redirect both HTTP and HTTPS apex requests to `https://www.veganblatt.com/:path`.
- Worker source: `cloudflare/apex-redirect.js`.
- This ensures:
  - `http://veganblatt.com/*` → `https://www.veganblatt.com/*`
  - `https://veganblatt.com/*` → `https://www.veganblatt.com/*`


---

## If Deploy Fails

The script shows exactly what failed.

### Quick Rollback
```bash
# In Cloudflare Pages dashboard
# Select previous deployment → Rollback
```

---

## Other Commands

```bash
npm run build         # Build only (no deploy)
npm run test          # Test only
npm run test:live     # Test live site
npm run monitor       # Monitor site health
```

---

## Summary

**ONE COMMAND**: `npm run deploy`

- ✅ Automatic versioning
- ✅ Real content counts
- ✅ Full build & test
- ✅ Deploy to production
- ✅ Git commit & push
- ✅ Post-deploy checks

**ZERO MANUAL WORK!** 🎉

---

Live: https://www.veganblatt.com/
Version: Check `<meta name="version">` on homepage
