# Screenshot Worker

A Cloudflare Worker that generates, caches, and serves website screenshots using [Headless Render API](https://headless-render-api.com) and [Cloudflare Images](https://developers.cloudflare.com/images/).

## How it works

1. Request comes in (e.g., `GET /about`)
2. The worker checks Cloudflare Images for a cached screenshot
3. On cache miss, it takes a screenshot via Headless Render API. Pass `?invalidate=true` to force a fresh screenshot.
4. The screenshot is uploaded to Cloudflare Images for future requests
5. The image is returned as JPEG

## Prerequisites

- Node.js 22+
- Cloudflare account with [Images](https://developers.cloudflare.com/images/) enabled
- [Headless Render API](https://headless-render-api.com) account

## Setup

```bash
npm install
```

Edit `wrangler.toml` with your values, then set your secrets:

```bash
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put HEADLESS_API_TOKEN
```

For local development, create a `.dev.vars` file:

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
HEADLESS_API_TOKEN=your_headless_api_token
```

## Configuration

### Environment variables (`wrangler.toml`)

| Variable | Description |
|---|---|
| `SITE_BASE_URL` | Base URL of the site to screenshot |
| `IMAGE_URL` | Cloudflare Images delivery URL |
| `CLOUDFLARE_API_URL` | Cloudflare Images API endpoint |
| `HEADLESS_API_URL` | Headless Render API endpoint |

### Secrets

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Images:Edit permission |
| `HEADLESS_API_TOKEN` | Headless Render API token |

## API

### `GET /:path`

Returns a JPEG screenshot of `SITE_BASE_URL/:path`.

| Parameter | Default | Description |
|---|---|---|
| `invalidate` | `false` | Force regenerate the screenshot |
| `vw` | `1280` | Viewport width for screenshot capture |
| `vh` | `800` | Viewport height for screenshot capture |
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
