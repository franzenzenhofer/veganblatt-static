# VeganBlatt Static Site Generator

Pure static site generator that transforms WordPress content into clean HTML/CSS/JS with zero server dependencies.

## Features

- 🚀 **100% Static** - No server required, pure HTML/CSS
- 📸 **Copyright Compliance** - Strict image copyright validation
- 📱 **Mobile-First** - Responsive design without JavaScript
- ⚡ **Performance** - Single CSS file, system fonts, optimized images
- 🔒 **FAIL LOUD** - No fallbacks, strict validation

## Quick Start

```bash
# Install dependencies
npm install

# Build the site
npm run build

# Serve locally
npm run serve

# Deploy to Cloudflare Pages
npm run deploy
```

## Project Structure

```
/src/
  /data/          # Markdown content and metadata
  /core/          # Core processors
  /generators/    # Page generators
  /templates/     # HTML templates
  /scripts/       # Build scripts
/public/          # Generated static site
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Full build with validation |
| `npm run generate` | Generate static site |
| `npm run serve` | Local server on port 8080 |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run audit` | Copyright compliance audit |
| `npm run test` | Run all tests |
| `npm run clean` | Clean generated files |

## Deployment

### Cloudflare Pages

```bash
# Production deployment
npm run deploy

# Preview deployment
npm run deploy:preview
```

### GitHub Actions

Automatic deployment on push to main branch (workflow included).

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Copyright audit
npm run audit
```

## License

Private repository - All rights reserved