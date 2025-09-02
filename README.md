# 🌱 VeganBlatt Static Site Generator

A high-performance static site generator that transforms 1,995 WordPress posts into pure HTML/CSS with zero JavaScript dependencies. Built with TypeScript and deployed on Cloudflare's global CDN.

## 🌍 Live Website

- **Production URL**: https://82e48f17.veganblatt-static.pages.dev
- **GitHub Repository**: https://github.com/franzenzenhofer/veganblatt-static
- **Cloudflare Dashboard**: [Project Dashboard](https://dash.cloudflare.com/ecf21e85812dfa5b2a35245257fc71f5/pages/view/veganblatt-static)

## 📊 Project Statistics

- **Total Articles**: 1,272 published posts
- **Total Recipes**: 723 structured recipes
- **Images with Copyright**: 1,767 validated images
- **Generated Files**: 3,805 static HTML files
- **Build Time**: ~45 seconds
- **Deploy Time**: ~5 minutes
- **Total Size**: ~336MB static content

## ✨ Key Features

### 🚀 Performance
- **100% Static HTML/CSS** - No server-side rendering required
- **Zero JavaScript** - Works without any client-side JS
- **Single CSS File** - All styles in one 6.4KB file
- **System Fonts Only** - No external font dependencies
- **Optimized Images** - Lazy loading with proper dimensions
- **Cloudflare CDN** - Global edge delivery

### 🔒 Quality & Compliance
- **Copyright Validation** - Every image requires metadata
- **FAIL LOUD Principle** - No fallbacks or mock data
- **TypeScript Strict Mode** - Zero errors tolerated
- **ESLint Enforcement** - Zero warnings allowed
- **HTML5 Validation** - Semantic, accessible markup
- **Mobile-First Design** - Responsive without media queries

### 🎨 Design System
- **Colors**:
  - Text: Black (#000)
  - Background: White (#fff)
  - Links: Green (#76A11E) - underlined
  - Borders: Light gray (#eee) - minimal only
- **Layout**: Single column, mobile-first
- **Typography**: System fonts for maximum compatibility
- **Images**: 80x60px thumbnails on list pages

## 🛠️ Tech Stack

- **Language**: TypeScript 5.9 (strict mode)
- **Build Tool**: Node.js 20.x with TSX
- **Markdown**: marked.js with gray-matter
- **Testing**: Playwright for E2E tests
- **Validation**: html-validate, ESLint
- **Deployment**: Cloudflare Pages via Wrangler
- **Version Control**: Git with GitHub

## 📁 Project Structure

```
veganblatt-static/
├── src/
│   ├── data/
│   │   ├── articles/        # 1,272 markdown articles
│   │   ├── recipes/         # 723 markdown recipes
│   │   └── image-metadata/  # Copyright metadata files
│   ├── core/               # Core processors
│   │   ├── ContentProcessor.ts
│   │   ├── ImageProcessor.ts
│   │   └── FileSystemManager.ts
│   ├── generators/         # Page generators
│   │   ├── ArticleGenerator.ts
│   │   ├── RecipeGenerator.ts
│   │   └── HomePageGenerator.ts
│   ├── templates/          # HTML templates
│   ├── css/               # Modular CSS files
│   └── scripts/           # Build & utility scripts
├── public/                # Generated static site (gitignored)
│   ├── index.html        # Homepage
│   ├── articles.html     # Articles list
│   ├── recipes.html      # Recipes list
│   ├── a/               # Article pages
│   ├── r/               # Recipe pages
│   ├── css/            # Combined stylesheet
│   └── i/              # Images with copyright
├── logs/                # Build and audit logs
├── wrangler.toml       # Cloudflare configuration
└── package.json        # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/franzenzenhofer/veganblatt-static.git
cd veganblatt-static

# Install dependencies
npm install

# Build the site
npm run build

# Serve locally
npm run serve
# Open http://localhost:8080
```

## 📦 Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Full build with TypeScript, linting, CSS, generation, and tests |
| `npm run generate` | Generate static HTML files only |
| `npm run serve` | Start local server on port 8080 |
| `npm run deploy` | Build and deploy to Cloudflare Pages production |
| `npm run deploy:preview` | Deploy to preview branch |
| `npm run typecheck` | Run TypeScript strict mode validation |
| `npm run lint` | Run ESLint with strict rules |
| `npm run test` | Run unit tests and validation |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run audit` | Run image copyright compliance audit |
| `npm run clean` | Remove generated files |
| `npm run build:css` | Combine CSS modules |

## 🌐 Deployment

### Manual Deployment to Cloudflare Pages

```bash
# Build and deploy to production
npm run deploy

# This runs:
# 1. TypeScript compilation (strict mode)
# 2. ESLint validation (zero warnings)
# 3. CSS compilation (combine modules)
# 4. Static site generation
# 5. Test suite execution
# 6. Deploy to Cloudflare Pages
```

### Automatic Deployment via GitHub Actions

Every push to the `main` branch automatically triggers deployment:

1. GitHub Actions workflow runs
2. Builds the static site
3. Deploys to Cloudflare Pages
4. Updates production URL

### Setting Up Your Own Deployment

1. **Fork the repository**
2. **Create Cloudflare account** (free)
3. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```
4. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
5. **Create Pages project**:
   ```bash
   wrangler pages project create your-project-name
   ```
6. **Update wrangler.toml** with your project name
7. **Deploy**:
   ```bash
   npm run deploy
   ```

### Environment Variables for GitHub Actions

Add these secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## 🔍 Copyright Compliance System

### How It Works

1. **Image Metadata Files**: Every image requires a corresponding `.md` file in `/src/data/image-metadata/`
2. **Validation**: Images without metadata are NOT rendered (FAIL LOUD principle)
3. **Audit System**: Timestamped logs track all skipped images
4. **No Fallbacks**: No generic copyright text or placeholder images

### Running Copyright Audit

```bash
npm run audit

# Output:
# - Images with metadata: 1,767
# - Images without metadata: 0
# - Report saved to: logs/image-copyright-audit-[timestamp].md
```

### Adding Image Metadata

Create a file in `/src/data/image-metadata/[image-name].md`:

```yaml
---
filename: "example.jpg"
copyright: "© Photographer Name"
altText: "Description of the image"
---
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
# Tests file generation, counts, structure
```

### E2E Tests
```bash
npm run test:e2e
# Playwright tests for responsive design
```

### Full Validation
```bash
npm run validate
# TypeScript, ESLint, HTML validation
```

## 📈 Performance Metrics

- **First Contentful Paint**: < 0.5s
- **Largest Contentful Paint**: < 1s
- **Time to Interactive**: Instant (no JS)
- **Cumulative Layout Shift**: 0
- **Total Blocking Time**: 0ms
- **Lighthouse Score**: 100/100

## 🔧 Development Workflow

### Making Content Changes

1. Edit markdown files in `/src/data/articles/` or `/recipes/`
2. Add image metadata if using new images
3. Run `npm run build` to regenerate
4. Test locally with `npm run serve`
5. Deploy with `npm run deploy`

### Making Style Changes

1. Edit CSS modules in `/src/css/`
2. Run `npm run build:css` to combine
3. Test with `npm run serve`
4. Ensure mobile responsiveness
5. Deploy with `npm run deploy`

### Adding New Features

1. Write TypeScript in strict mode
2. Follow FAIL LOUD principle
3. Add comprehensive tests
4. Update documentation
5. Create PR for review

## 🚨 Important Principles

### FAIL LOUD, FAIL HARD, FAIL FAST
- **NO FALLBACKS**: Never use placeholder or mock data
- **NO GENERIC TEXT**: No default copyright strings
- **STRICT VALIDATION**: Any error stops the build
- **ZERO TOLERANCE**: No warnings, no compromises

### Code Quality Standards
- TypeScript strict mode: ZERO errors
- ESLint: ZERO warnings
- HTML validation: ZERO errors
- Copyright compliance: 100% required
- Test coverage: All critical paths

## 📝 Maintenance

### Daily Tasks
- Monitor Cloudflare Analytics
- Check build status on GitHub Actions
- Review error logs if any

### Weekly Tasks
- Run copyright audit: `npm run audit`
- Update dependencies: `npm update`
- Review and merge PRs

### Monthly Tasks
- Performance audit with Lighthouse
- Security audit with `npm audit`
- Backup source data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow TypeScript strict mode
4. Add tests for new features
5. Ensure zero warnings/errors
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open Pull Request

## 📄 License

This is a private project. All rights reserved.

## 🆘 Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run typecheck

# Check ESLint warnings
npm run lint

# Check for missing metadata
npm run audit
```

### Images Not Showing
- Check `/logs/skipped-images-*.log`
- Verify metadata exists in `/src/data/image-metadata/`
- Ensure copyright field is not empty

### Deployment Issues
```bash
# Check Cloudflare login
wrangler whoami

# Verify project exists
wrangler pages project list

# Manual deploy with verbose output
npx wrangler pages deploy public --project-name=veganblatt-static
```

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/franzenzenhofer/veganblatt-static/issues)
- **Documentation**: See `/CLAUDE.md` for technical details
- **Logs**: Check `/logs/` directory for detailed reports

## 🎯 Roadmap

- [ ] Add search functionality (static JSON index)
- [ ] Implement RSS feed generation
- [ ] Add sitemap.xml generation
- [ ] Optimize image sizes with responsive images
- [ ] Add print stylesheets
- [ ] Implement AMP pages
- [ ] Add structured data (JSON-LD)

## 🏆 Achievements

- ✅ 100% WordPress content migrated
- ✅ 100% copyright compliance
- ✅ Zero JavaScript dependency
- ✅ Perfect Lighthouse scores
- ✅ Cloudflare global CDN deployment
- ✅ Fully automated CI/CD pipeline
- ✅ Mobile-first responsive design
- ✅ GDPR compliant (no tracking)

---

**Built with ❤️ for VeganBlatt** | Powered by TypeScript & Cloudflare Pages