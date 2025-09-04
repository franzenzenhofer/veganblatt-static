# CLAUDE.md - VeganBlatt Static Site Generator

## PROJECT OVERVIEW
Pure static site generator for VeganBlatt - transforms WordPress content into clean HTML/CSS/JS with zero server dependencies.

## ARCHITECTURE
```
/src/
  /data/
    /articles/      # 1,272 markdown articles
    /recipes/       # 723 markdown recipes  
    /image-metadata/# Copyright metadata
  /core/           # Core processors
  /generators/     # Page generators
  /templates/      # HTML templates
  /scripts/        # Build & utility scripts
/public/           # Generated static site
  /css/           # Stylesheets
  /i/             # Images with copyright
    /assets/      # Logo and static assets
  *.html          # Generated pages
```

## CORE PRINCIPLES

### 1. FAIL LOUD, FAIL HARD, FAIL FAST
- **NO FALLBACKS**: Never use mock/dummy/placeholder data
- **NO GENERIC COPYRIGHT**: Images without metadata don't render
- **STRICT VALIDATION**: TypeScript strict mode, zero warnings
- **ERROR = STOP**: Any error stops generation immediately

### 2. COPYRIGHT COMPLIANCE
- **METADATA REQUIRED**: Every image needs copyright metadata
- **SOURCE-LEVEL CLEANING**: Fix data in markdown, not generation
- **NO EMOJIS**: Completely removed from entire site
- **AUDIT TRAIL**: Timestamped logs for all skipped content

### 3. PURE STATIC
- **ZERO JAVASCRIPT**: No client-side JS required
- **NO DEPENDENCIES**: No external CDNs or resources
- **SINGLE CSS FILE**: All styles in one minified file
- **SYSTEM FONTS**: No external font dependencies

## BUILD COMMANDS
```bash
# Development
npm run dev          # Watch mode with live reload
npm run build        # Full build with validation
npm run test         # Run all tests

# Production
npm run generate     # Generate static site
npm run deploy       # Deploy to Cloudflare Pages

# Utilities
npm run audit        # Copyright compliance audit
npm run clean        # Clean generated files
```

## DEPLOYMENT

### Cloudflare Pages Configuration
- **Build command**: `npm run build`
- **Build output**: `/public`
- **Node version**: 20.x
- **Environment**: Production

### GitHub Actions Workflow
Automatic deployment on push to main branch.

## DESIGN SPECIFICATIONS

### Colors (CSS Variables)
```css
--color-text: #000        /* Black text */
--color-bg: #fff          /* White background */
--color-link: #76A11E     /* Green links only */
--color-border: #eee      /* Light gray separators */
```

### Layout Rules
1. **Mobile-first**: Single column, proper margins
2. **NO colored backgrounds**: White only
3. **NO thick borders**: Thin gray lines only
4. **Green for links ONLY**: Underlined text links
5. **80x60px thumbnails**: List pages only

### Content Structure
1. **Homepage**: Latest 3 articles + 5 random recipes
2. **Article pages**: Content → Images → Navigation
3. **Recipe pages**: Content → Recipe card → Navigation
4. **List pages**: Single column with thumbnails

## IMAGE PROCESSING

### Copyright Validation
```typescript
// FAIL LOUD - No image without copyright!
if (!this.validateCopyright(metadata)) {
  console.warn(`SKIPPED: ${imageName} - NO METADATA`);
  return ''; // Return empty, don't render
}
```

### Metadata Structure
```yaml
filename: "example.jpg"
copyright: "© Photographer Name"
altText: "Description of image"
```

## URL STRUCTURE & VALIDATION

### URL Generation Rules
1. **SLUG-BASED URLS**: ALL URLs use slugs from markdown frontmatter, NEVER filenames
2. **NO DATE-BASED URLS**: URLs are `/a/slug.html` and `/r/slug.html`, NOT `/a/2013-01-01-slug.html`
3. **FAIL LOUD**: Missing slug = BUILD FAILURE - every markdown file MUST have a slug
4. **AI IMAGES**: Stored in `/i/ai/filename.jpg` with proper URL encoding

### URL Examples
```
✅ CORRECT:
- /r/schoko-mohn-cheesecake.html (from slug: schoko-mohn-cheesecake)
- /i/ai/ai-schoko-mohn-cheesecake.jpg (AI-generated images)

❌ WRONG:
- /r/2013-07-07-schoko-mohn-cheesecake.html (date-based)
- /i/ai%2Fai-schoko-mohn-cheesecake.jpg (double-encoded)
```

### Image URL Encoding
- **Regular images**: `/i/filename.jpg` with `encodeURIComponent(filename)`
- **AI images**: `/i/ai/filename.jpg` (ai/ NOT encoded, filename encoded)
- **NO DOUBLE ENCODING**: Path separators (/) must remain unencoded

## GIT WORKFLOW

### ATOMIC COMMITS - CRITICAL!
- **AFTER EVERY FILE CHANGE** → atomic git commit
- **ONE CHANGE = ONE COMMIT**
- Never batch multiple file changes in one commit
- Commit message describes EXACTLY what changed
- Example workflow:
  ```bash
  # Edit file
  git add path/to/file.ts
  git commit -m "Fix URL encoding in HomePageGenerator"
  
  # Edit another file
  git add path/to/other.ts
  git commit -m "Update prompt for center composition"
  ```

## QUALITY GATES
- ✅ TypeScript strict mode - ZERO errors
- ✅ ESLint - ZERO warnings  
- ✅ HTML validation - Semantic markup
- ✅ Copyright audit - 100% compliance
- ✅ Mobile testing - Responsive design
- ✅ Performance - < 100KB CSS
- ✅ URL validation - All images exist and properly encoded

## STATISTICS
- **Articles**: 1,272 published
- **Recipes**: 723 with structured data
- **Images**: 1,767 with valid copyright
- **Generation time**: ~45 seconds
- **Output size**: ~500MB static files

## TROUBLESHOOTING

### Missing Images
Check `/logs/skipped-images-*.log` for detailed report of images without metadata.

### Copyright Issues
Run `npm run audit` to identify copyright compliance issues.

### Build Failures
1. Check TypeScript: `npm run typecheck`
2. Check ESLint: `npm run lint`
3. Validate HTML: `npm run validate`

## MAINTENANCE

### Adding New Content
1. Add markdown to `/src/data/articles/` or `/recipes/`
2. Add image metadata to `/src/data/image-metadata/`
3. Run `npm run generate`

### Updating Styles
1. Edit CSS modules in `/src/styles/`
2. Run `npm run build:css`
3. Test with `npm run dev`

---
**Status**: PRODUCTION READY
**Last Updated**: 2025-09-02