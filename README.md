# KubiPDF — free, private PDF tools in the browser

**Live site:** [pdf.jakubjakubek.cz](https://pdf.jakubjakubek.cz) · English & Czech

KubiPDF is an Acrobat-style PDF editor plus a full set of PDF utilities (merge, split,
compress, convert, protect, …) that runs **entirely in the user's browser**. Files are
never uploaded: they are read, processed and saved in the browser tab's memory. That
makes the site free to operate (it is just static files) and private by construction.

---

## Features

| Category              | Tools                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Edit & sign**       | Edit PDF (incl. editing existing text), Sign PDF, Fill PDF form, Add watermark, Add page numbers, Redact PDF       |
| **Organize pages**    | Merge, Split, Organize (reorder / rotate / delete / duplicate / insert), Rotate, Delete pages, Extract pages, Crop |
| **Convert**           | PDF → JPG, PDF → PNG, JPG/PNG/WebP → PDF, PDF → text                                                               |
| **Optimize & secure** | Compress, Protect (AES-256 password), Unlock, Flatten forms & annotations, Edit metadata                           |

The editor supports: replacing existing text (cover-and-retype with colour sampling),
adding text in several Unicode fonts (full Czech/Latin-Extended, Greek, Cyrillic), images,
drawn/typed/uploaded signatures, freehand drawing, highlighting, rectangles, ellipses,
lines, arrows, whiteout, sticky-note comments, tick/cross symbols, filling AcroForm
fields, page reordering/rotation/deletion, undo/redo and zoom — all saved back into the
original document so links, bookmarks and form fields survive.

Other details that matter:

- **Password-protected input** works everywhere — the user is prompted for the password.
- **Correct on rotated pages:** every tool that places content works in "display space"
  (what the reader sees) and converts to PDF user space, so watermarks, page numbers and
  edits are upright on `/Rotate 90/180/270` pages and pages with offset crop boxes.
- **Real redaction:** redacted pages are re-rendered as images, so nothing survives under
  the boxes; the output is a fresh document without the original metadata.
- **Compression** recompresses oversized images (JPEG and Flate incl. PNG predictors),
  drops unreachable objects/old revisions and writes object streams.
- **Tool chaining:** the result of one tool can be passed straight into another
  (e.g. merge → compress) without downloading and re-uploading.

## Privacy model

There is no backend. The production build is a set of prerendered HTML pages plus
JavaScript. PDF engines are lazy-loaded only when a file is opened:

- [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (Mozilla PDF.js) renders pages and extracts text,
- [`@cantoo/pdf-lib`](https://github.com/cantoo-scribe/pdf-lib) (maintained pdf-lib fork with
  encryption/decryption) modifies and writes documents,
- [`@cantoo/fontkit`](https://github.com/cantoo-scribe/fontkit) subsets embedded fonts,
- [`fflate`](https://github.com/101arrowz/fflate) creates ZIP archives and inflates image data.

No analytics, cookies, CDNs or third-party requests — fonts and pdf.js assets are served
from the site's own origin. The only `localStorage` use is remembering a dismissed language
suggestion.

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
    config.ts              site URL, name, author
    i18n/                  language helpers + UI dictionary (en, cs)
    tools/registry.ts      the list of tools: ids, slugs per language, categories, loaders
    server/content/        SEO copy per tool & page (server-only, prerendered)
    components/            layout, SEO head, drop zone, page thumbnails, result panel, …
    tools-ui/              one Svelte component per tool (lazy-loaded per route)
    editor/                the full PDF editor
    pdf/                   PDF engine wrappers and operations
      pdfjs.ts, pdflib.ts  lazy loaders, open/render/save helpers
      geometry.ts          display-space ↔ PDF-space math
      structure.ts         page-tree rebuild, annotation flattening, garbage collection
      ops/                 merge/split/organize, stamping, security, compression, images, redaction
scripts/                   build helpers (pdf.js asset copy, OG image generation)
static/                    favicons, fonts, robots.txt, hosting config
tests/                     Vitest suite for the PDF operations
```

## Development

Requires **Node.js 22+**.

```bash
npm install
npm run dev        # http://localhost:5173 (copies pdf.js assets first)
npm test           # PDF operation tests (merge, reorder, rotation geometry, encryption, …)
npm run check      # svelte-check / TypeScript
npm run build      # static site in ./build
npm run preview    # serve the production build locally
```

`npm run dev` and `npm run build` automatically copy pdf.js runtime assets (CMaps, standard
fonts, WASM decoders, ICC profiles) from `node_modules/pdfjs-dist` to `static/pdfjs/`
(git-ignored).

### Adding a tool

1. Add the id to `TOOL_IDS` and an entry to `TOOLS` in `src/lib/tools/registry.ts`
   (category, slug per language, accent colour, lazy component loader) and to `RELATED`.
2. Add its name/short description to both dictionaries in `src/lib/i18n/ui.ts`.
3. Add SEO copy to `src/lib/server/content/tools.en.ts` and `tools.cs.ts`.
4. Create the component in `src/lib/tools-ui/` (most single-file tools use
   `SinglePdfTool` + `ToolShell` + `Workspace`).
5. Map an icon in `src/lib/tools/icons.ts`.

Routes, sitemap, navigation, footer and structured data pick the tool up automatically.

## Deployment

The build output (`build/`) is plain static files, so any static host works. Two are
pre-configured:

### Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
2. Build settings: framework preset **SvelteKit** (or none), build command `npm run build`,
   output directory `build`, environment variable `NODE_VERSION=22`.
3. **Custom domains → Set up a custom domain** → `pdf.jakubjakubek.cz`. If the
   `jakubjakubek.cz` zone is on Cloudflare the DNS record is created for you; otherwise add a
   `CNAME pdf → <project>.pages.dev` record at your DNS provider.

`static/_headers` sets security headers and long-term caching for hashed assets;
`static/_redirects` is not needed (trailing-slash URLs map to `index.html` files).

### Vercel

1. **Add New → Project** → import this repo. Vercel detects SvelteKit; `adapter-static` has
   zero-config Vercel support. Node.js 22 is the default.
2. **Settings → Domains** → add `pdf.jakubjakubek.cz` and create the `CNAME pdf →
cname.vercel-dns.com` record it asks for.

`vercel.json` mirrors the security and caching headers.

## SEO

- Every page is prerendered HTML with a unique `<title>`, meta description, canonical URL,
  `hreflang` alternates (`en`, `cs`, `x-default`), Open Graph/Twitter cards and a per-tool
  1200×630 social image.
- JSON-LD: `WebSite`, `WebApplication`, `FAQPage`, `HowTo` and `BreadcrumbList`.
- Localised URL slugs (`/cs/spojit-pdf/`, `/cs/komprimovat-pdf/`, …) and fully translated copy.
- `sitemap.xml` with alternates, `robots.txt`, web app manifest, fast static delivery and
  lazy-loaded PDF engines for good Core Web Vitals.

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
