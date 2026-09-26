# paidbyagent.com

Static site for paidbyagent.com — daily agentic-payments industry briefings,
plus the Agentic Payments Map (`site/map.njk`), a D3 visualization of
`data/agentic-payments-graph.yaml`.

Built with [Eleventy](https://www.11ty.dev/). D3 is loaded via CDN in
`map.njk`; there's no client-side build step.

## Local development

    npm install
    npm run dev   # http://localhost:8080

## Structure

- `site/index.njk` — homepage, lists posts
- `site/map.njk` — Agentic Payments Map
- `site/posts/*.md` — daily briefings
- `site/_includes/base.njk` — shared layout
- `site/_data/graph.js` — Eleventy data file, reads `data/agentic-payments-graph.yaml`
- `data/agentic-payments-graph.yaml` — map data, curated manually via the
  `briefed` repo's `graph-candidates`/`graph-audit-sources` CLI commands and
  copied here by hand after each curation session

## Content source: briefed

Daily posts are published from the
[`briefed`](https://github.com/zdne/briefed) pipeline: its
`daily-digest.yml` workflow generates a briefing, checks out this repo, adds
one new file under `site/posts/`, and pushes — which triggers this repo's own
deploy below. `briefed` never renders HTML or touches templates/CSS; it only
ever writes a Markdown file with front matter. The interface between the two
repos is that front-matter shape:

```yaml
---
layout: base.njk
title: "Briefing <date>"
date: <date>
tags: post
summary: "<one-line summary>"
---
```

If this front-matter shape ever changes here, `briefed`'s
`.github/scripts/prepare-post.mjs` needs a matching update, and vice versa.

## Deploy

Hosted on Cloudflare Pages, connected directly to this repo's `main` branch —
Cloudflare builds and deploys automatically on every push (including the
daily bot-committed post), no GitHub Actions workflow involved. Build
settings (configured in the Cloudflare dashboard, not checked into the repo):

- Build command: `npm run build`
- Build output directory: `site/_site`
- Environment variable: `NODE_VERSION=22`

Custom domains `paidbyagent.com` and `www.paidbyagent.com` are attached to
the Pages project; `www` redirects to the bare domain via a Cloudflare
Redirect Rule. DNS lives in the same Cloudflare account/zone as the domain
registration.
