# Screenshot Worker

A Cloudflare Worker that generates, caches, and serves website screenshots using [Headless Render API](https://headless-render-api.com) and Cloudflare Images.

## How it works

1. A request comes in for a specific route (e.g., `/opengraph/:slug`)
2. The worker checks Cloudflare Images for a cached version
3. If no cache exists (or `invalidate` is set), it requests a screenshot from Headless Render API
4. The screenshot is uploaded to Cloudflare Images for future requests
5. The image is served with the requested dimensions, format, and quality

## Prerequisites

- Node.js 22+
- Cloudflare account with Images enabled
- [Headless Render API](https://headless-render-api.com) account

## Setup

```bash
npm install
```

Edit `wrangler.toml` with your account-specific values (see Configuration below).

## Configuration

### Environment variables (wrangler.toml)

| Variable | Description |
|---|---|
| `SITE_BASE_URL` | Base URL of the site to screenshot |
| `SCREENSHOT_BASE_URL` | This worker's production URL (for self-referencing routes) |
| `IMAGE_URL` | Cloudflare Images delivery URL |
| `CLOUDFLARE_API_URL` | Cloudflare Images API endpoint |
| `HEADLESS_API_URL` | Headless Render API endpoint |

### Secrets

Set these with `wrangler secret put`:

- `CLOUDFLARE_API_TOKEN` -- Cloudflare API token with Images permissions
- `HEADLESS_API_TOKEN` -- Headless Render API token

## Routes

| Route | Description | Viewport |
|---|---|---|
| `GET /preview/:slug/:page?` | Mobile preview screenshot | 440x880 @2x |
| `GET /screenshot/:slug/:page?` | Screenshot with device frame | 440x875 @2x |
| `GET /opengraph/:slug/:page?` | OpenGraph image (1200x630) | 1200x630 |
| `GET /theme-preview/:slug` | Small theme thumbnail | 78x60 @2x |
| `GET /linktree-preview/:slug` | Linktree page screenshot | 440x880 @2x |

### Query parameters

| Parameter | Default | Description |
|---|---|---|
| `invalidate` | `false` | Force regenerate the screenshot |
| `width` | `500` | Delivery width |
| `height` | -- | Delivery height |
| `quality` | `80` | JPEG quality |
| `format` | `auto` | Image format |
| `fit` | `cover` | Resize fit mode |
| `gravity` | -- | Crop gravity |

## Development

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Customization

To add new screenshot routes, edit the `ROUTE_CONFIGS` object in `src/handler.ts`.
