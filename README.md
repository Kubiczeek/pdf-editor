# KubiPDF — free, private PDF tools in the browser

**Live site:** [pdf.jakubjakubek.cz](https://pdf.jakubjakubek.cz) · English & Czech

KubiPDF is an Acrobat-style PDF editor plus a full set of PDF utilities (merge, split,
compress, convert, protect, …) that runs **entirely in the user's browser**. Files are
never uploaded: they are read, processed and saved in the browser tab's memory. That makes
the site free to operate (it is just static files) and private by construction.

---

## Features

| Category              | Tools                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Edit & sign**       | Edit PDF (incl. editing existing text), Sign PDF, Fill PDF form, Add watermark, Add page numbers, Redact PDF       |
| **Organize pages**    | Merge, Split, Organize (reorder / rotate / delete / duplicate / insert), Rotate, Delete pages, Extract pages, Crop |
| **Convert**           | PDF → JPG, PDF → PNG, JPG/PNG/WebP → PDF, PDF → text                                                               |
| **Optimize & secure** | Compress, Protect (AES-256 password), Unlock, Flatten forms & annotations, Edit metadata                           |

### The editor

- **Edit existing text** — click a line; it is covered (background colour sampled from the
  page) and replaced with editable text in a matching size, colour and style.
- **Add content** — text in six embedded Unicode fonts (full Czech/Latin-Extended, Greek,
  Cyrillic; bold/italic where the font has them), images (paste with Ctrl+V), freehand
  drawing, highlights (multiply blend), rectangles, ellipses, lines, arrows, whiteout,
  tick/cross symbols and sticky-note comments (real PDF annotations).
- **Signatures** — draw (saved as vectors), type in a handwriting font, or upload a photo
  with automatic background removal; reuse them across pages.
- **Forms** — fill text fields, checkboxes, radio buttons and dropdowns; values are written
  into the real AcroForm fields with appearances generated in a Unicode font.
- **Pages** — reorder by drag and drop, rotate, delete and insert blank pages. Content added
  after rotating a page stays upright.
- Undo/redo, zoom, keyboard shortcuts (Delete, Ctrl+Z/Y/D/S, arrows), touch support.
- Saves into the **original document**, so links, bookmarks and form fields survive.

### Other details that matter

- **Password-protected input** works in every tool — the user is asked for the password.
- **Correct on rotated pages:** every tool that places content works in "display space"
  (what the reader sees) and converts to PDF user space, so watermarks, page numbers and
  edits are upright on `/Rotate 90/180/270` pages and pages with offset crop boxes.
- **Real redaction:** redacted pages are re-rendered as images, so nothing survives under the
  boxes; the output is a fresh document without the original metadata.
- **Compression** recompresses oversized images (JPEG and Flate incl. PNG predictors), drops
  unreachable objects and old revisions, and writes object streams.
- **Tool chaining:** a result can be passed straight into another tool (e.g. merge →
  compress) without downloading and re-uploading.

## Privacy model

There is no backend. The production build is a set of prerendered HTML pages plus
JavaScript. PDF engines are lazy-loaded only when a file is opened:

- [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (Mozilla PDF.js) renders pages and extracts text,
- [`@cantoo/pdf-lib`](https://github.com/cantoo-scribe/pdf-lib) (maintained pdf-lib fork with
  encryption/decryption) modifies and writes documents,
- [`@cantoo/fontkit`](https://github.com/cantoo-scribe/fontkit) subsets embedded fonts,
- [`fflate`](https://github.com/101arrowz/fflate) creates ZIP archives and inflates image data.

No analytics, cookies, CDNs or third-party requests — fonts and pdf.js assets are served from
the site's own origin (a strict Content-Security-Policy enforces this). The only
`localStorage` use is remembering a dismissed language suggestion.

## Tech stack

- [SvelteKit 3](https://svelte.dev/docs/kit) + Svelte 5 (runes), TypeScript
- `@sveltejs/adapter-static` — every page is prerendered (great for SEO, free hosting)
- Vite 8, Vitest 5
- Self-hosted fonts: Bricolage Grotesque & Atkinson Hyperlegible Next (UI), Noto Sans/Serif/Mono,
  Dancing Script, Caveat, Great Vibes (embedded into PDFs; SIL OFL)

## Project structure

```
src/
  routes/                  SvelteKit routes
    +layout.*              shell, i18n context, prerender + trailing-slash config
    +page.*                English home            /
    [slug]/                English tool pages      /merge-pdf/, /edit-pdf/, …
    cs/                    Czech home + tool pages /cs/, /cs/spojit-pdf/, …
    privacy/, cs/ochrana-soukromi/
    sitemap.xml/           sitemap with hreflang alternates
  lib/
    config.ts              site URL, brand name, author
    i18n/                  language helpers + UI dictionary (en, cs)
    tools/registry.ts      tool metadata: ids, slugs per language, categories, colours
    tools/loaders.ts       lazy component loaders (kept apart so each page only links its own CSS)
    server/content/        SEO copy per tool & page (server-only, prerendered)
    components/            layout, SEO head, drop zone, page thumbnails, result panel, …
    tools-ui/              one Svelte component per tool
    editor/                the full PDF editor (state, page view, objects, save)
    pdf/                   PDF engine wrappers and operations
      pdfjs.ts, pdflib.ts  lazy loaders, open/render/save helpers
      geometry.ts          display-space ↔ PDF-space math
      structure.ts         page-tree rebuild, annotation flattening, garbage collection
      ops/                 merge/split/organize, stamping, security, compression, images, redaction
scripts/
  copy-pdfjs-assets.mjs    copies pdf.js CMaps/fonts/WASM into static/pdfjs (runs before dev/build)
  generate-images.mjs      favicons, app icons and per-page Open Graph cards
  serve.mjs                serves ./build like Cloudflare Pages (applies _headers incl. CSP)
static/                    fonts, icons, OG images, robots.txt, manifest, _headers
tests/                     Vitest suites (PDF operations, editor saving, SEO copy)
```

## Development

Requires **Node.js 22+** (`.node-version` / `.nvmrc` pin it for hosting providers).

```bash
npm install
npm run dev        # http://localhost:5173 (copies pdf.js assets first)
npm test           # 115 tests: PDF operations, rotation geometry, encryption, editor saving, SEO copy
npm run check      # svelte-check / TypeScript
npm run build      # static site in ./build
npm run serve      # serve ./build at http://localhost:4173 with production headers and CSP
npm run images     # regenerate favicons and Open Graph images (after changing names or copy)
npm run format     # Prettier
```

### How things are verified

- **Unit tests** build real PDFs and check the output with pdf.js: page order and rotation,
  form fields surviving reordering, watermark and page-number placement on rotated pages
  (incl. Czech diacritics), AES-256 protect/unlock round trips, metadata, flattening, crop
  boxes, editor saving (text upright on rotated pages, form values, page restructuring) and
  SEO limits (title ≤ 60 chars, description 110–160 chars, unique slugs).
- **End to end**, every tool was exercised in a real browser against the production build
  served with the production CSP, and outputs were rendered and inspected.

### Adding a tool

1. Add the id to `TOOL_IDS`, an entry to `TOOLS` and to `RELATED` in
   `src/lib/tools/registry.ts`, and its loader in `src/lib/tools/loaders.ts`.
2. Add its name/short description to both dictionaries in `src/lib/i18n/ui.ts`.
3. Add SEO copy to `src/lib/server/content/tools.en.ts` and `tools.cs.ts`.
4. Create the component in `src/lib/tools-ui/` (single-file tools use `SinglePdfTool` +
   `ToolShell` + `Workspace`).
5. Map an icon in `src/lib/tools/icons.ts` and run `npm run images`.

Routes, sitemap, navigation, footer and structured data pick the tool up automatically.

### Changing the brand

The name, URL and author live in `src/lib/config.ts`. After changing them, run
`npm run images` and update `static/manifest.webmanifest` and `static/robots.txt`.

## Deployment

The build output (`build/`) is plain static files, so any static host works. Two are
pre-configured.

### Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
2. Build settings: framework preset **None** (or SvelteKit), build command `npm run build`,
   build output directory `build`. Node 22 is picked up from `.node-version`.
3. **Custom domains → Set up a custom domain** → `pdf.jakubjakubek.cz`. If the
   `jakubjakubek.cz` zone is on Cloudflare the DNS record is created for you; otherwise add a
   `CNAME pdf → <project>.pages.dev` record at your DNS provider.

`static/_headers` sets security headers (CSP, frame and referrer policies) and long-term
caching for hashed assets. Unknown URLs get `404.html` with a real 404 status.

### Vercel

1. **Add New → Project** → import this repo. `vercel.json` sets the build command, the
   `build` output directory and trailing-slash URLs; no framework preset is needed.
2. **Settings → Domains** → add `pdf.jakubjakubek.cz` and create the
   `CNAME pdf → cname.vercel-dns.com` record it asks for.

`vercel.json` mirrors the security and caching headers.

## SEO

- Every page is prerendered HTML with a unique `<title>`, meta description, canonical URL,
  `hreflang` alternates (`en`, `cs`, `x-default`), Open Graph/Twitter cards and a per-tool
  1200×630 social image in the page's language.
- JSON-LD: `WebSite`, `WebApplication`, `FAQPage`, `HowTo` and `BreadcrumbList`.
- Localised URL slugs (`/cs/spojit-pdf/`, `/cs/komprimovat-pdf/`, …) and fully translated copy
  with how-to steps, features and FAQs on every tool page.
- `sitemap.xml` with alternates, `robots.txt`, web app manifest.
- Fast pages: 2 stylesheets per page, PDF engines loaded only when a file is opened,
  self-hosted variable fonts, and accessibility checked with axe (no violations).

After the first deploy, submit `https://pdf.jakubjakubek.cz/sitemap.xml` in
[Google Search Console](https://search.google.com/search-console) and
[Bing Webmaster Tools](https://www.bing.com/webmasters).

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop and mobile). The legacy pdf.js build is used
for broader compatibility. Very large documents are limited by the device's memory.

## Licences

- Application code: © Jakub Jakubek.
- PDF.js — Apache-2.0; pdf-lib (@cantoo fork) — MIT; fontkit (@cantoo fork) — MIT; fflate — MIT;
  SortableJS — MIT.
- Fonts in `static/fonts/` — SIL Open Font License 1.1 (see `static/fonts/OFL.txt`); UI fonts via
  Fontsource — SIL OFL 1.1.
