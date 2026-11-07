# Project Instructions

## Development And Build Safety

- The user commonly keeps `npm run start` running for live preview. In this repository, that command runs `next dev`.
- Never run `npm run build`, `next build`, or another production build while a Next.js development server is running in this workspace.
- `next dev` and `next build` share `.next`, while Contentlayer also shares `.contentlayer`. Concurrent execution can corrupt manifests or expose partially written generated files.
- Before any full build, check for a running `next dev` process. If one is running, do not stop it automatically and do not run the build. Use focused formatting, linting, type checking, or the existing dev server output instead.
- Run a full build only when the development server is confirmed stopped or when the user explicitly asks to stop it and build.
- Do not delete `.next` or `.contentlayer` unless troubleshooting requires it and the development server has already stopped.

## Shared Media Repository

- Audio and video assets live in the sibling `D:\Projects\GitHub\ChrisTorng\blog-media` repository, not under this repository's `public/static/audio` or `public/static/videos` directories.
- Reference those assets from pages and data files with root-relative URLs in the form `/blog-media/<path-from-blog-media-root>`. For example, `..\blog-media\audio\example.mp3` is referenced as `/blog-media/audio/example.mp3`.
- Do not use `localhost:3001` or the deployed hostname in content. Media components resolve `/blog-media/*` to `http://localhost:3001/*` in development and `https://media.christorng.idv.tw/*` in production. The development-only Next.js rewrite also maps `/blog-media/:path*` to the local media server.
- When checking a media reference, URL-decode its path and verify that the corresponding file exists under the `blog-media` repository.

## Shared Article Image Repository

- Article images live in the sibling `D:\Projects\GitHub\ChrisTorng\blog-assets` repository. Website-functional images such as the logo and author avatar remain under this repository's `public/static/images` directory.
- Reference article images with root-relative URLs in the form `/blog-assets/images/<path-from-images-root>`.
- In development, `<picture>` URLs resolve to `http://localhost:3002`, and the development-only Next.js rewrite maps `/blog-assets/:path*` to that local server. In production, image URLs resolve to `https://assets.christorng.idv.tw`.
- Run `npm run build` in `blog-assets` after adding or changing article images. Commit both the generated `blog-assets/responsive` files and this repository's updated `data/responsive-images.json` manifest.
- Do not add responsive image generation back to this repository's GitHub Actions workflow; generated image assets are local build artifacts committed before deployment.
- RSS is served by the App Router routes under `app/feed.xml` and `app/tags/[tag]/feed.xml`. RSS content resolves `/blog-assets/*` and `/blog-media/*` to their production hostnames. Do not generate `public/feed.xml` or `public/tags/*/feed.xml`; those files conflict with the routes during development.

## Public Articles / Notes / Bookmarks Consistency (authoritative)

The **main site repository is the single visual source of truth** for the three public sections:
- Articles: `/blog/` and `/tags/*/`, primarily `components/ListWithCategories.tsx`, `components/notes/PublicTimeline.tsx` and `layouts/ListLayoutWithTags.tsx`.
- Notes: `/notes/`, primarily `components/notes/NotesList.tsx`.
- Bookmarks: `/bookmarks/`, primarily `components/bookmarks/BookmarksList.tsx` and `components/bookmarks/BookmarkView.tsx`.

The backend repositories [blog-notes](https://github.com/ChrisTorng/blog-notes) and [blog-bookmarks](https://github.com/ChrisTorng/blog-bookmarks) own their APIs, persistence and dynamic RSS, **not** independently maintained public designs. Do not fork the public sidebar, colors, typography, navigation, card spacing, title/links or responsive rules. The shared desktop category navigation lives in `components/PublicCategorySidebar.tsx`, and its mobile counterpart in `components/MobileCategorySelect.tsx`. When modifying one public section, inspect the equivalent behavior in the other two and apply intentional changes consistently. Test light/dark and narrow/mobile layouts as well as desktop. Internal/admin screens can legitimately differ.

### Names and navigation
- Root public headings: `文章`, `隨筆`, `書籤`. Root category selectors: `所有文章`, `所有隨筆`, `所有書籤`. Category headings: `{category} · 文章`, `{category} · 隨筆`, `{category} · 書籤`.
- `/tags/*/` currently combines Articles **and** Notes; call this `{category} · 文章與隨筆`, never misleadingly imply that it is articles only. If the distinction needs changing, coordinate the route, navigation, and RSS across all three repositories.
- Root visible RSS labels: `所有文章 RSS`, `所有隨筆 RSS`, `所有書籤 RSS`. Category labels use `{category} · {section} RSS`. Combined feed labels use `所有文章與隨筆 RSS` or `{category} · 文章與隨筆 RSS`.
- XML `<channel><title>` adds ` | ChrisTorng 學習天地` to the visible RSS label, using the same pipe separator as document titles. The **visible site RSS link does not append the site title**. Avoid the old dash separator.
- RSS `<item><link>` must resolve to the website's public article/note/bookmark detail page, so a reader's “View article” action opens the local entry. For Bookmarks, its content also links the Chinese title to the original/selected external URL, includes the distinct original English title and complete rendered Markdown, and uses the canonical `/bookmarks/<slug>/` URL as its GUID. Keep XML/HTML escaped.
- For Notes and Articles, use stored published timestamps. Bookmark public records intentionally suppress precise reading/publication times; keep the date-only API and use documented deterministic synthetic per-day RSS seconds instead of revealing private times. Do not present synthetic times as recorded publishing times.

### Required review when changing any of these areas
Check page heading/document title, browser subscriptions and in-page RSS links, feed XML channel title/link/item link/GUID/description, category selection and counts, list/detail item links, date formatting, desktop sidebar/mobile select, color and layout. Verify that other conversations/branches do not have unmerged parallel changes. When a backend change affects public markup, update this canonical main-site implementation rather than changing a legacy Worker view in isolation.

### Complete public content parity

- Main-site `components/bookmarks/BookmarkPublicItem.tsx` is used by both Bookmarks list and legacy preview; dynamic published bookmark pages plus RSS reuse `blog-bookmarks/src/public-content.js#bookmarkArticleHtml`. Keep date/recommendation, linked Chinese title, English original, entire rendered summary, source favicon/host, redirected original URL and localized category links identical. Do not reintroduce a duplicate '前往網站' link or oversized detail-only typography.
- Main-site `components/notes/NotePublicItem.tsx` is used by Notes list and legacy preview; dynamic published Notes pages plus RSS reuse `blog-notes/src/public-content.js#noteArticleHtml`. Include complete Markdown, bookmark references and localized tags. The same relative links must resolve to the same target in public pages and feeds.
- `SafeMarkdown` is for **trusted display of untrusted Markdown**, not raw HTML injection: keep link validation, image rendering, task lists and tables aligned with the Worker Markdown renderer. Public RSS `description` and `content:encoded` should carry rendered HTML, not unparsed Markdown. Article RSS already includes full post HTML.
