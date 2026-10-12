// Copies the runtime assets pdf.js loads on demand (CMaps for CJK text, standard
// fonts for PDFs without embedded fonts, WebAssembly image decoders, ICC
// profiles) into static/pdfjs so they are served from our own origin.
// Runs automatically before `dev` and `build`; the output is git-ignored.
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkgDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const { version } = JSON.parse(await readFile(path.join(pkgDir, 'package.json'), 'utf8'));
const target = path.join(root, 'static', 'pdfjs');
const stamp = path.join(target, '.version');

if (existsSync(stamp) && (await readFile(stamp, 'utf8')).trim() === version) {
	console.log(`pdf.js ${version} assets are up to date`);
	process.exit(0);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
	const from = path.join(pkgDir, dir);
	if (existsSync(from)) await cp(from, path.join(target, dir), { recursive: true });
}
await writeFile(stamp, `${version}\n`);
console.log(`Copied pdf.js ${version} assets to static/pdfjs`);
