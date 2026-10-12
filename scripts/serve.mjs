// Serves ./build like Cloudflare Pages would: applies static/_headers
// (including the Content-Security-Policy), redirects /page to /page/,
// and answers unknown URLs with 404.html. Used to test production builds.
//
//   npm run build && npm run serve   →   http://localhost:4173
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const port = Number(process.env.PORT ?? 4173);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.webmanifest': 'application/manifest+json',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.wasm': 'application/wasm',
	'.bcmap': 'application/octet-stream',
	'.pfb': 'application/octet-stream',
	'.icc': 'application/vnd.iccprofile'
};

/** Parses Cloudflare's _headers format into [pattern, headers] rules. */
async function loadHeaderRules() {
	const text = await readFile(path.join(root, '_headers'), 'utf8').catch(() => '');
	const rules = [];
	let current = null;
	for (const line of text.split(/\r?\n/)) {
		if (!line.trim() || line.trim().startsWith('#')) continue;
		if (!/^\s/.test(line)) {
			const pattern = new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
			current = { pattern, headers: {} };
			rules.push(current);
		} else if (current) {
			const index = line.indexOf(':');
			current.headers[line.slice(0, index).trim()] = line.slice(index + 1).trim();
		}
	}
	return rules;
}

const rules = await loadHeaderRules();

async function isFile(file) {
	try {
		return (await stat(file)).isFile();
	} catch {
		return false;
	}
}

http
	.createServer(async (req, res) => {
		const url = new URL(req.url ?? '/', `http://localhost:${port}`);
		const pathname = decodeURIComponent(url.pathname);
		const headers = {};
		for (const rule of rules) if (rule.pattern.test(pathname)) Object.assign(headers, rule.headers);

		let file = path.join(root, pathname);
		if (!file.startsWith(root)) {
			res.writeHead(403).end();
			return;
		}
		let status = 200;
		if (pathname.endsWith('/')) file = path.join(file, 'index.html');
		if (!(await isFile(file))) {
			if (!pathname.endsWith('/') && (await isFile(path.join(root, pathname, 'index.html')))) {
				res.writeHead(308, { ...headers, Location: `${pathname}/${url.search}` }).end();
				return;
			}
			file = path.join(root, '404.html');
			status = 404;
		}
		const body = await readFile(file);
		res.writeHead(status, {
			...headers,
			'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
			'Content-Length': body.length
		});
		res.end(req.method === 'HEAD' ? undefined : body);
	})
	.listen(port, () => console.log(`Serving build/ on http://localhost:${port}`));
