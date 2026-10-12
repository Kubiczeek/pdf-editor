export interface ZipEntry {
	name: string;
	data: Uint8Array;
}

/** Makes names unique inside the archive: "a.pdf", "a (2).pdf", … */
function uniqueName(name: string, used: Set<string>): string {
	if (!used.has(name)) return name;
	const dot = name.lastIndexOf('.');
	const stem = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : '';
	let n = 2;
	while (used.has(`${stem} (${n})${ext}`)) n++;
	return `${stem} (${n})${ext}`;
}

/** Stores files in a ZIP without recompression (PDFs and images are already compressed). */
export async function makeZip(entries: ZipEntry[]): Promise<Uint8Array> {
	const { zipSync } = await import('fflate');
	const used = new Set<string>();
	const files: Record<string, [Uint8Array, { level: 0 }]> = {};
	for (const entry of entries) {
		const name = uniqueName(entry.name, used);
		used.add(name);
		files[name] = [entry.data, { level: 0 }];
	}
	return zipSync(files, { level: 0 });
}
