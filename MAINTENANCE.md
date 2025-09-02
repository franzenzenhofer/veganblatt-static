# 🔧 VeganBlatt Maintenance Guide

## 📋 Daily Checklist
- [ ] Check site availability: https://82e48f17.veganblatt-static.pages.dev
- [ ] Monitor response times: `npm run monitor`
- [ ] Check Cloudflare dashboard for anomalies

## 📋 Weekly Checklist
- [ ] Run full test suite: `npm run test:live`
- [ ] Check copyright compliance: `npm run audit`
- [ ] Review error logs: `ls -la logs/`
- [ ] Backup source data: `tar -czf backup-$(date +%Y%m%d).tar.gz src/data/`

## 📋 Monthly Checklist
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit fix`
- [ ] Performance review: `npm run monitor`
- [ ] Clean old logs: `rm -f logs/*-2025-*.log`
- [ ] Review Cloudflare analytics
- [ ] Test deployment pipeline: `npm run deploy:preview`

## 🚨 Emergency Procedures

### Site is Down
```bash
# 1. Check status
curl -I https://82e48f17.veganblatt-static.pages.dev

# 2. Check Cloudflare status
# Visit: https://www.cloudflarestatus.com

# 3. Redeploy if needed
npm run deploy

# 4. Verify
npm run test:live
```

### Performance Issues
```bash
# 1. Run monitoring
npm run monitor

# 2. Check specific pages
time curl -s https://82e48f17.veganblatt-static.pages.dev > /dev/null

# 3. Clear Cloudflare cache (via dashboard)

# 4. Rebuild and redeploy
npm run clean
npm run deploy
```

### Content Issues
```bash
# 1. Fix content in src/data/
vim src/data/articles/[filename].md

# 2. Rebuild
npm run build

# 3. Test locally
npm run serve

# 4. Deploy
npm run deploy
```

### Rollback Deployment
```bash
# 1. Revert to previous commit
git revert HEAD
git push

# 2. Redeploy
npm run deploy

# 3. Verify
npm run test:live
```

## 📊 Monitoring Commands

| Command | Purpose | Frequency |
|---------|---------|-----------|
| `npm run monitor` | Full health check | Daily |
| `npm run test:live` | Test all endpoints | Weekly |
| `npm run audit` | Copyright compliance | Weekly |
| `npm run health` | Quick status check | As needed |

## 🔐 Security

### Regular Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check for exposed secrets
grep -r "password\|secret\|api" src/

# Review git history
git log --oneline | grep -i "secret\|password"
```

## 📈 Performance Optimization

### Monitor Performance
```bash
# Real-time monitoring
npm run monitor

# Watch mode (updates every 60s)
watch -n 60 npm run monitor

# Test specific endpoint
time curl -s [URL] > /dev/null
```

### Optimize Images
```bash
# Check image sizes
ls -lh public/i/*.jpg | sort -k5 -h | tail -20

# Future: Convert to WebP
# for img in public/i/*.jpg; do
#   cwebp "$img" -o "${img%.jpg}.webp"
# done
```

## 🚀 Deployment

### Standard Deployment
```bash
# Production
npm run deploy

# Preview branch
npm run deploy:preview
```

### Manual Deployment
```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy public \
  --project-name=veganblatt-static \
  --commit-dirty=true

# Test
npm run test:live
```

## 📝 Content Management

### Add New Article
```bash
# 1. Create markdown file
cat > src/data/articles/$(date +%Y-%m-%d)-new-article.md << EOF
---
title: "Article Title"
date: $(date +%Y-%m-%d)
excerpt: "Article excerpt"
featuredImage: "image.jpg"
---

Article content here...
EOF

# 2. Add image metadata
cat > src/data/image-metadata/image.md << EOF
---
filename: "image.jpg"
copyright: "© Photographer"
altText: "Description"
---
EOF

# 3. Build and deploy
npm run deploy
```

### Update Existing Content
```bash
# 1. Edit file
vim src/data/articles/[filename].md

# 2. Build locally
npm run build

# 3. Test
npm run serve

# 4. Deploy
npm run deploy
```

## 🔍 Troubleshooting

### Build Failures
```bash
# Check TypeScript
npm run typecheck

# Check ESLint
npm run lint

# Clean and rebuild
rm -rf dist public
npm run build
```

### Missing Images
```bash
# Check metadata
ls src/data/image-metadata/ | grep [image-name]

# Run audit
npm run audit

# Check logs
cat logs/skipped-images-*.log
```

### Deployment Failures
```bash
# Check authentication
wrangler whoami

# Manual deploy
npx wrangler pages deploy public --project-name=veganblatt-static

# Check logs
cat ~/.wrangler/logs/wrangler-*.log
```

## 📞 Support Contacts

- **GitHub Issues**: https://github.com/franzenzenhofer/veganblatt-static/issues
- **Cloudflare Support**: https://support.cloudflare.com
- **Documentation**: See README.md and CLAUDE.md

## 📅 Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Monitor health | Daily | `npm run monitor` |
| Test endpoints | Weekly | `npm run test:live` |
| Copyright audit | Weekly | `npm run audit` |
| Update deps | Monthly | `npm update` |
| Security audit | Monthly | `npm audit` |
| Full backup | Monthly | `tar -czf backup.tar.gz .` |

---

**Last Updated**: September 2, 2025  
**Next Review**: October 2, 2025