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
- Do not use `localhost:3001` or the deployed hostname in content. In local development, the development-only Next.js rewrite maps `/blog-media/:path*` to `http://localhost:3001/:path*`; in production, `/blog-media/*` resolves on the deployed site without that rewrite.
- When checking a media reference, URL-decode its path and verify that the corresponding file exists under the `blog-media` repository.

## Shared Article Image Repository

- Article images live in the sibling `D:\Projects\GitHub\ChrisTorng\blog-assets` repository. Website-functional images such as the logo and author avatar remain under this repository's `public/static/images` directory.
- Reference article images with root-relative URLs in the form `/blog-assets/images/<path-from-images-root>`.
- In development, `<picture>` URLs resolve to `http://localhost:3002`, and the development-only Next.js rewrite maps `/blog-assets/:path*` to that local server. In production, image URLs resolve to `https://assets.christorng.idv.tw`.
- Run `npm run build` in `blog-assets` after adding or changing article images. Commit both the generated `blog-assets/responsive` files and this repository's updated `data/responsive-images.json` manifest.
- Do not add responsive image generation back to this repository's GitHub Actions workflow; generated image assets are local build artifacts committed before deployment.
- RSS is served by the App Router routes under `app/feed.xml` and `app/tags/[tag]/feed.xml`. Do not generate `public/feed.xml` or `public/tags/*/feed.xml`; those files conflict with the routes during development.
