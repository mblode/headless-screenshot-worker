<div align="center">

# Headless Screenshot Worker

**Screenshots your pages on demand, caches them in Cloudflare Images, and serves them back as JPEG**

Request a path and get a picture of that page, resized and cropped from the query string.

</div>

## Install

```bash
git clone https://github.com/mblode/headless-screenshot-worker.git
cd headless-screenshot-worker
npm install
```

Needs Node 24 (see `.nvmrc`), a Cloudflare account with [Images](https://developers.cloudflare.com/images/) enabled, and a [Headless Render API](https://headless-render-api.com) account.

Fill in the four `[vars]` in `wrangler.toml`, then set the two secrets and deploy:

```bash
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put HEADLESS_API_TOKEN
npm run deploy
```

## Quickstart

Put the same two tokens in a `.dev.vars` file, then run it locally:

```bash
npm run dev
curl "http://localhost:8787/about?width=800&quality=90" -o about.jpg
```

The first request screenshots `SITE_BASE_URL/about` and uploads the result to Cloudflare Images. Every request after that comes from the cache, resized on delivery. Pass `?invalidate=true` to throw the cached copy away and take a fresh one.

## Parameters

`GET /:path` returns a JPEG of `SITE_BASE_URL/:path`.

| Parameter | Default | Description |
|---|---|---|
| `invalidate` | `false` | Delete the cached image and screenshot the page again. |
| `vw` | `1280` | Viewport width used for capture. |
| `vh` | `800` | Viewport height used for capture. |
| `width` | `500` | Delivery width. |
| `height` | | Delivery height. |
| `quality` | `80` | JPEG quality. |
| `format` | `auto` | Delivery format. |
| `fit` | `cover` | Resize fit mode. |
| `gravity` | | Crop gravity. |

## Configuration

`[vars]` in `wrangler.toml`:

| Variable | Description |
|---|---|
| `SITE_BASE_URL` | Base URL of the site to screenshot. |
| `IMAGE_URL` | Cloudflare Images delivery URL. |
| `CLOUDFLARE_API_URL` | Cloudflare Images API endpoint for your account. |
| `HEADLESS_API_URL` | Headless Render API endpoint. |

Secrets, set with `wrangler secret put` in production and `.dev.vars` locally:

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Images:Edit permission. |
| `HEADLESS_API_TOKEN` | Headless Render API token. |

## Notes

- Responses carry `Cache-Control: public, max-age=86400`, so a CDN or browser in front of the worker holds them for a day.
- The Cloudflare Images key is the request path with `/` replaced by `--`, plus `.jpeg`, so `/blog/post` is stored as `blog--post.jpeg`.
- Only `GET` and `HEAD` are answered. Anything else gets a 405, and a request with no path gets a 400.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
