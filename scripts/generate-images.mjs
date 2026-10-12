// Generates favicons, app icons and the 1200×630 Open Graph cards for every
// page and language. Text is converted to vector paths with fontkit, so the
// output doesn't depend on fonts installed on the machine.
//
// Run with: npm run images   (output is committed to static/)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import fontkit from '@cantoo/fontkit';
import { ICONS } from '../src/lib/components/icons.ts';
import { TOOL_IDS, TOOLS } from '../src/lib/tools/registry.ts';
import { TOOL_ICONS } from '../src/lib/tools/icons.ts';
import { ui } from '../src/lib/i18n/ui.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...parts) => path.join(root, 'static', ...parts);

const bold = fontkit.create(await readFile(out('fonts', 'NotoSans-Bold.ttf')));
const regular = fontkit.create(await readFile(out('fonts', 'NotoSans-Regular.ttf')));

const INK = '#16213a';
const INK_2 = '#46526d';
const ROYAL = '#1f35c4';
const DESK = '#e8ecf2';
const HIGHLIGHT = '#ffe14d';

/** Converts a line of text to an SVG path placed with its baseline at (x, y). */
function textPath(font, text, size, x, y, fill) {
	const run = font.layout(text);
	const scale = size / font.unitsPerEm;
	let cursor = 0;
	const parts = [];
	run.glyphs.forEach((glyph, i) => {
		const pos = run.positions[i];
		const d = glyph.path.toSVG();
		if (d) {
			const gx = x + (cursor + pos.xOffset) * scale;
			const gy = y - pos.yOffset * scale;
			parts.push(
				`<path transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" d="${d}"/>`
			);
		}
		cursor += pos.xAdvance;
	});
	return { svg: `<g fill="${fill}">${parts.join('')}</g>`, width: cursor * scale };
}

function measure(font, text, size) {
	return (font.layout(text).advanceWidth * size) / font.unitsPerEm;
}

/** Greedy word wrap. */
function wrap(font, text, size, maxWidth) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = '';
	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (line && measure(font, candidate, size) > maxWidth) {
			lines.push(line);
			line = word;
		} else {
			line = candidate;
		}
	}
	if (line) lines.push(line);
	return lines;
}

const LOGO = `
	<path d="M8.5 3.5h10.2l7.3 7.3v16.2a1.6 1.6 0 0 1-1.6 1.6H8.5a1.6 1.6 0 0 1-1.6-1.6V5.1a1.6 1.6 0 0 1 1.6-1.6z" fill="#fff" stroke="${ROYAL}" stroke-width="2" stroke-linejoin="round"/>
	<path d="M18.7 3.5v7.3H26" fill="none" stroke="${ROYAL}" stroke-width="2" stroke-linejoin="round"/>
	<path d="M9.6 15.2 22.6 14l.5 5.2-13 1.2z" fill="${HIGHLIGHT}"/>
	<path d="M10.5 17.6h11.6M10.5 23.6h7.4" stroke="${ROYAL}" stroke-width="2" stroke-linecap="round"/>`;

function card({ title, subtitle, icon, color, footer }) {
	const W = 1200;
	const H = 630;
	const left = 80;
	const textWidth = 640;
	let titleSize = 84;
	let titleLines = wrap(bold, title, titleSize, textWidth);
	while (titleLines.length > 2 && titleSize > 56) {
		titleSize -= 6;
		titleLines = wrap(bold, title, titleSize, textWidth);
	}
	// The subtitle may use at most two lines so it never runs into the footer.
	let subSize = 34;
	let subLines = wrap(regular, subtitle, subSize, textWidth);
	while (subLines.length > 2 && subSize > 26) {
		subSize -= 2;
		subLines = wrap(regular, subtitle, subSize, textWidth);
	}
	subLines = subLines.slice(0, 2);

	const brand = textPath(bold, 'KubiPDF', 40, left + 64, 122, INK);
	let y = 250;
	const titleSvg = titleLines
		.map((line) => {
			const t = textPath(bold, line, titleSize, left, y, INK);
			y += titleSize * 1.12;
			return t.svg;
		})
		.join('');
	y += 12;
	const subSvg = subLines
		.map((line) => {
			const t = textPath(regular, line, subSize, left, y, INK_2);
			y += subSize * 1.35;
			return t.svg;
		})
		.join('');
	const foot = textPath(bold, footer, 26, left, 560, ROYAL);

	// A sheet of paper on the right with the tool icon.
	const sheet = `
	<g transform="translate(860 120) rotate(4)">
		<rect x="8" y="10" width="270" height="360" rx="8" fill="#d3dae5"/>
		<path d="M0 0h212l58 58v302a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8z" fill="#fff"/>
		<path d="M212 0v50a8 8 0 0 0 8 8h50" fill="#dfe4ec"/>
		<rect x="30" y="200" width="200" height="10" rx="5" fill="#e7ebf2"/>
		<rect x="30" y="226" width="160" height="10" rx="5" fill="#e7ebf2"/>
		<rect x="26" y="250" width="190" height="18" rx="2" fill="${HIGHLIGHT}" transform="skewX(-8)"/>
		<rect x="30" y="284" width="210" height="10" rx="5" fill="#e7ebf2"/>
		<rect x="30" y="310" width="120" height="10" rx="5" fill="#e7ebf2"/>
		<g transform="translate(46 44)">
			<rect width="120" height="120" rx="28" fill="${color}" opacity="0.12"/>
			<g transform="translate(18 18) scale(3.5)" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
		</g>
	</g>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<rect width="${W}" height="${H}" fill="${DESK}"/>
	<rect x="0" y="${H - 14}" width="${W}" height="14" fill="${ROYAL}"/>
	<g transform="translate(${left} 78) scale(1.75)">${LOGO}</g>
	${brand.svg}
	${titleSvg}
	${subSvg}
	${foot.svg}
	${sheet}
</svg>`;
}

async function png(svg, file, size) {
	let image = sharp(Buffer.from(svg), { density: 144 });
	// Rendered at 2× for crisp edges, then scaled to the exact target size.
	image = size ? image.resize(size, size) : image.resize(1200, 630);
	await image.png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(file);
}

await mkdir(out('og'), { recursive: true });
await mkdir(out('icons'), { recursive: true });

const FOOTER = {
	en: 'pdf.jakubjakubek.cz  ·  Free  ·  No upload  ·  No sign-up',
	cs: 'pdf.jakubjakubek.cz  ·  Zdarma  ·  Bez nahrávání  ·  Bez registrace'
};
const HOME = {
	en: {
		title: 'Free PDF editor in your browser',
		subtitle: 'Edit, sign, merge, compress and convert PDFs. Files never leave your device.'
	},
	cs: {
		title: 'PDF editor zdarma v prohlížeči',
		subtitle: 'Upravujte, podepisujte, spojujte a zmenšujte PDF. Soubory neopustí vaše zařízení.'
	}
};

for (const lang of ['en', 'cs']) {
	await png(
		card({ ...HOME[lang], icon: ICONS.edit, color: ROYAL, footer: FOOTER[lang] }),
		out('og', `home-${lang}.png`)
	);
	for (const id of TOOL_IDS) {
		const names = ui[lang].tools[id];
		await png(
			card({
				title: names.name,
				subtitle: names.short,
				icon: ICONS[TOOL_ICONS[id]],
				color: TOOLS[id].color,
				footer: FOOTER[lang]
			}),
			out('og', `${id}-${lang}.png`)
		);
	}
}

// App icons: the logo on white, with breathing room for maskable icons.
const iconSvg = (
	padding,
	background
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
	<rect width="32" height="32" rx="${background === '#ffffff' ? 7 : 0}" fill="${background}"/>
	<g transform="translate(${padding} ${padding}) scale(${(32 - padding * 2) / 32})">${LOGO}</g>
</svg>`;
await png(iconSvg(3, '#ffffff'), out('apple-touch-icon.png'), 180);
await png(iconSvg(2, '#ffffff'), out('icons', 'icon-192.png'), 192);
await png(iconSvg(2, '#ffffff'), out('icons', 'icon-512.png'), 512);
await png(iconSvg(5.5, '#e8ecf2'), out('icons', 'icon-maskable-512.png'), 512);

// favicon.ico with 16, 32 and 48 px PNG images.
const favicon = await readFile(out('favicon.svg'));
const sizes = [16, 32, 48];
const images = await Promise.all(
	sizes.map((size) => sharp(favicon, { density: 300 }).resize(size, size).png().toBuffer())
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
	const entry = 6 + i * 16;
	header.writeUInt8(size, entry);
	header.writeUInt8(size, entry + 1);
	header.writeUInt8(0, entry + 2);
	header.writeUInt8(0, entry + 3);
	header.writeUInt16LE(1, entry + 4);
	header.writeUInt16LE(32, entry + 6);
	header.writeUInt32LE(images[i].length, entry + 8);
	header.writeUInt32LE(offset, entry + 12);
	offset += images[i].length;
});
await writeFile(out('favicon.ico'), Buffer.concat([header, ...images]));

console.log('Generated favicons, app icons and', 2 + TOOL_IDS.length * 2, 'Open Graph images');
