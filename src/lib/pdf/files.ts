export async function readBytes(file: Blob): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}

export function isPdfFile(file: File): boolean {
	return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;

export function isImageFile(file: File): boolean {
	return file.type.startsWith('image/') || IMAGE_EXT.test(file.name);
}

/** Quick signature check: a PDF starts with "%PDF-" somewhere in the first KB. */
export function looksLikePdf(bytes: Uint8Array): boolean {
	const head = bytes.subarray(0, 1024);
	for (let i = 0; i < head.length - 4; i++) {
		if (
			head[i] === 0x25 &&
			head[i + 1] === 0x50 &&
			head[i + 2] === 0x44 &&
			head[i + 3] === 0x46 &&
			head[i + 4] === 0x2d
		) {
			return true;
		}
	}
	return false;
}

/** File name without the extension. */
export function baseName(name: string): string {
	const clean = name.replace(/^.*[\\/]/, '');
	const dot = clean.lastIndexOf('.');
	return (dot > 0 ? clean.slice(0, dot) : clean) || 'document';
}

/** Builds an output file name such as "report-merged.pdf". */
export function outputName(source: string, suffix: string, ext = 'pdf'): string {
	return `${baseName(source)}${suffix ? `-${suffix}` : ''}.${ext}`;
}

export function toBlob(data: Uint8Array | Blob, type = 'application/pdf'): Blob {
	return data instanceof Blob ? data : new Blob([data as Uint8Array<ArrayBuffer>], { type });
}

/** Triggers a browser download. */
export function downloadBlob(data: Uint8Array | Blob, filename: string, type?: string): void {
	const blob = toBlob(data, type);
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = 'noopener';
	anchor.style.display = 'none';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	// Give slower browsers (Safari) time to start the download before revoking.
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Opens a file picker programmatically. */
export function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.multiple = multiple;
		input.style.display = 'none';
		input.addEventListener('change', () => {
			resolve(Array.from(input.files ?? []));
			input.remove();
		});
		input.addEventListener('cancel', () => {
			resolve([]);
			input.remove();
		});
		document.body.appendChild(input);
		input.click();
	});
}

let idCounter = 0;
export function uid(prefix = 'id'): string {
	idCounter += 1;
	return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Yields to the event loop so long loops keep the UI responsive.
 * (setTimeout rather than requestAnimationFrame, which stalls in background tabs.)
 */
export function yieldToUI(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}
