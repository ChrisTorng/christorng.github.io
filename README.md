# ChrisTorng 學習天地

[ChrisTorng 學習天地](https://christorng.idv.tw/)

Based on [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)

## External content repositories

- Article images are stored in sibling `blog-assets`, served locally from `http://localhost:3002` and in production from <https://assets.christorng.idv.tw>.
- Audio and video are stored in sibling `blog-media`, served locally from `http://localhost:3001` and in production from <https://media.christorng.idv.tw>.
- Content keeps root-relative `/blog-assets/*` and `/blog-media/*` references; application components resolve the correct origin for the current environment.

## Maintainer tools

- [Cloudflare Analytics exclusion UserScript](scripts/CloudflareAnalyticsExclude.user.js): Install in Tampermonkey on the maintainer's browser. Visiting the [blog homepage](https://christorng.idv.tw/) renews a 400-day cookie to exclude subsequent requests from Cloudflare Web Analytics (RUM). Requires a Cloudflare Configuration Rule matching `cf_analytics_ignore=1` with **Disable RUM** enabled. Does not exclude Cloudflare Traffic Analytics or remote AI/browser tools that do not send this cookie.

## License

- Code: [MIT License](LICENSE)
- Content: [CC BY-NC-ND 4.0](data/LICENSE) see [Deed - Attribution-NonCommercial-NoDerivatives 4.0 International - Creative Commons](https://creativecommons.org/licenses/by-nc-nd/4.0/)
