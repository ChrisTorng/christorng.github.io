# ChrisTorng's Learning Blog

Personal website: <https://christorng.idv.tw/>. Built with Next.js, Contentlayer, and the [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog).

## Repositories and services

Keep these repositories in the same parent directory:

| Repository             | Purpose                                                         | Local port | Production                                                |
| ---------------------- | --------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| `christorng.github.io` | Articles, navigation, shared page shell, article RSS and search | 3000       | `https://christorng.idv.tw`                               |
| `blog-media`           | Audio and video files                                           | 3001       | `https://media.christorng.idv.tw`                         |
| `blog-assets`          | Article images and generated responsive variants                | 3002       | `https://assets.christorng.idv.tw`                        |
| `blog-notes`           | Markdown notes, editor, feeds, and its own D1 database          | 8787       | Main domain `/notes/*`, served by a Cloudflare Worker     |
| `blog-bookmarks`       | Bookmark collection, publishing, feeds, and its own D1 database | 8788       | Main domain `/bookmarks/*`, served by a Cloudflare Worker |

The main site proxies `/notes/*` and `/bookmarks/*` to their local Workers. Both Workers use `/notes-shell/` from the main site for public pages. Notes also reads `/articles-index.json` to combine articles and notes in the homepage and categories. A note can reference a bookmark; each service keeps its own database.

Article content uses `/blog-media/*` and `/blog-assets/*` paths. Components resolve them to the local servers during development and their production domains after deployment. The main site's logo and avatar stay in `public/static/images`.

## Run locally

Requires **Node.js 22+**, **PowerShell**, and **Windows Terminal** (`wt.exe`). From this repository:

```powershell
npm run start:all
```

This opens a new Windows Terminal window with **five named tabs**, one per service. Each tab shows its own output and stays open after an error. The launcher installs missing dependencies, creates missing Worker `.dev.vars` files with random local tokens, and applies local D1 migrations before starting the Workers. Existing `.dev.vars` files and local data are preserved. It does not run production builds or install the Notes integration.

Wait for the Blog tab to report `Ready`, and for both Workers to report their listening URLs, then open:

| URL                                      | Page                         |
| ---------------------------------------- | ---------------------------- |
| <http://localhost:3000/>                 | Homepage: articles and notes |
| <http://localhost:3000/notes/>           | Notes                        |
| <http://localhost:3000/notes/editor/>    | Notes editor                 |
| <http://localhost:3000/draft/>           | Article and note drafts      |
| <http://localhost:3000/bookmarks/>       | Published bookmarks          |
| <http://localhost:3000/bookmarks/admin/> | Bookmark manager             |

For local sign-in, use `LOCAL_ADMIN_TOKEN` from the corresponding Worker's `.dev.vars`. Notes and Bookmarks have separate tokens. Local D1 data is stored in each Worker's `.wrangler/state/`; it is separate from production data.

Press **Ctrl+C in each service tab** to stop it. Closing the launcher terminal alone does not stop the service tabs. A second launch refuses occupied ports instead of starting duplicate servers.

Check paths, prerequisites, and ports without starting anything:

```powershell
npm run start:check
```

To run services manually, use a separate terminal for each row:

| Directory              | Commands                                 |
| ---------------------- | ---------------------------------------- |
| `christorng.github.io` | `npm run start`                          |
| `../blog-media`        | `npm start`                              |
| `../blog-assets`       | `npm start`                              |
| `../blog-notes`        | `npm run db:migrate`, then `npm run dev` |
| `../blog-bookmarks`    | `npm run db:migrate`, then `npm run dev` |

The launcher handles first-run setup; manual startup assumes dependencies and Worker `.dev.vars` files already exist.

## Troubleshooting

- **Port already in use:** stop the old service in its terminal before running `start:all` again.
- **Main site returns 500 with missing `.next` manifests/pages:** stop all Next.js servers, then run `npm run start:all -- -ResetNextCache`. This removes only the main site's `.next` cache before starting the services. It leaves Contentlayer and local databases intact.
- **Notes or Bookmarks returns 503:** check that the Blog tab is ready; their public pages need the main site's shell.
- **Worker API returns 500 after an update:** check its tab for migration errors. Startup applies local migrations automatically.

Never run `npm run build`, `next build`, or `npm run analyze` while this workspace's development server is running. They share `.next` and `.contentlayer`. Do not clear those directories while the server is running.

## Content maintenance

- Articles: `data/blog/`; author pages: `data/authors/`. Save Markdown as UTF-8 with LF line endings.
- Categories: `data/tagDefinitions.ts`; keep `../blog-notes/shared/tags.json` in sync.
- After changing article images, run `npm run build` in `../blog-assets`. Commit its generated `responsive/` files together with this repository's `data/responsive-images.json`.
- Article RSS is served by `app/feed.xml` and `app/tags/[tag]/feed.xml`. Do not generate conflicting XML files under `public/`.
- Navigation visibility: `data/notesSettings.ts` and `data/bookmarksSettings.ts`.
- Notes integration updates: see `../blog-notes/README.md`. The current checkout already includes the integration.

## Maintainer tools

[Cloudflare Analytics exclusion UserScript](scripts/CloudflareAnalyticsExclude.user.js): install in Tampermonkey. Visiting the production homepage renews a 400-day `cf_analytics_ignore=1` cookie. The Cloudflare Configuration Rule must disable RUM for that cookie; it does not exclude Traffic Analytics.

## License

- Code: [MIT](LICENSE).
- Content: [CC BY-NC-ND 4.0](data/LICENSE).
