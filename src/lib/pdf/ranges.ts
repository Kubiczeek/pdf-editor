/**
 * Parses page ranges such as "1-3, 5, 8-" into groups of zero-based page indices.
 * Returns null when the text is invalid or refers to pages that don't exist.
 * "8-" means "from 8 to the last page"; "-3" means "from the first page to 3".
 */
export function parseRanges(text: string, pageCount: number): number[][] | null {
	const parts = text
		.split(/[,;]+/)
		.map((part) => part.trim())
		.filter(Boolean);
	if (!parts.length) return null;
	const groups: number[][] = [];
	for (const part of parts) {
		const match = /^(\d*)\s*(?:[-–—]\s*(\d*))?$/.exec(part);
		if (!match) return null;
		const [, startText, endText] = match;
		const isRange = part.includes('-') || part.includes('–') || part.includes('—');
		if (!startText && !endText) return null;
		const start = startText ? Number(startText) : 1;
		const end = isRange ? (endText ? Number(endText) : pageCount) : start;
		if (start < 1 || end < 1 || start > pageCount || end > pageCount) return null;
		const group: number[] = [];
		if (start <= end) for (let p = start; p <= end; p++) group.push(p - 1);
		else for (let p = start; p >= end; p--) group.push(p - 1);
		groups.push(group);
	}
	return groups;
}

/** Flattens parsed ranges into a sorted list of unique page indices. */
export function parsePageSet(text: string, pageCount: number): number[] | null {
	const groups = parseRanges(text, pageCount);
	if (!groups) return null;
	return [...new Set(groups.flat())].sort((a, b) => a - b);
}

/** Formats zero-based indices as compact one-based ranges: [0,1,2,4] → "1-3, 5". */
export function formatPageSet(indices: Iterable<number>): string {
	const sorted = [...new Set(indices)].sort((a, b) => a - b);
	const parts: string[] = [];
	let i = 0;
	while (i < sorted.length) {
		let j = i;
		while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
		parts.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}-${sorted[j] + 1}`);
		i = j + 1;
	}
	return parts.join(', ');
}

/** Splits page indices into consecutive chunks of `size`. */
export function chunkPages(pageCount: number, size: number): number[][] {
	const groups: number[][] = [];
	const step = Math.max(1, Math.floor(size));
	for (let start = 0; start < pageCount; start += step) {
		const group: number[] = [];
		for (let p = start; p < Math.min(pageCount, start + step); p++) group.push(p);
		groups.push(group);
	}
	return groups;
}
