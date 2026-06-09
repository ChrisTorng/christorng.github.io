# Project Instructions

## Development And Build Safety

- The user commonly keeps `npm run start` running for live preview. In this repository, that command runs `next dev`.
- Never run `npm run build`, `next build`, or another production build while a Next.js development server is running in this workspace.
- `next dev` and `next build` share `.next`, while Contentlayer also shares `.contentlayer`. Concurrent execution can corrupt manifests or expose partially written generated files.
- Before any full build, check for a running `next dev` process. If one is running, do not stop it automatically and do not run the build. Use focused formatting, linting, type checking, or the existing dev server output instead.
- Run a full build only when the development server is confirmed stopped or when the user explicitly asks to stop it and build.
- Do not delete `.next` or `.contentlayer` unless troubleshooting requires it and the development server has already stopped.
