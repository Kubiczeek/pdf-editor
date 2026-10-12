import type { UiDict } from '#lib/i18n/index.ts';
import { closePdf } from '#lib/pdf/pdfjs.ts';
import { loadPdfLib } from '#lib/pdf/pdflib.ts';
import { takeHandoff } from '#lib/stores/handoff.ts';
import type { ResultFile } from '#lib/components/ResultPanel.svelte';
import {
	openPdfFile,
	describeError,
	filterFiles,
	UserFacingError,
	type LoadedPdf
} from './shared.ts';
import { fmt } from '#lib/i18n/index.ts';

/** Shared state machine for tools that work on one PDF: pick → configure → process → download. */
export class SinglePdfTool {
	pdf = $state<LoadedPdf | null>(null);
	opening = $state<string | null>(null);
	error = $state<string | null>(null);
	busy = $state(false);
	progress = $state<number | null>(null);
	result = $state<ResultFile[] | null>(null);
	resultNote = $state<string | undefined>(undefined);

	#t: () => UiDict;

	constructor(t: () => UiDict) {
		this.#t = t;
	}

	/** Opens files handed over from another page (home drop zone or a previous tool). */
	pickupHandoff(): void {
		const files = takeHandoff();
		if (files?.length) void this.open(files);
	}

	async open(files: File[]): Promise<boolean> {
		const t = this.#t();
		const { ok, rejected } = filterFiles(files, 'pdf');
		if (!ok.length) {
			this.error = rejected.length ? fmt(t.errors.notPdf, { name: rejected[0].name }) : null;
			return false;
		}
		const file = ok[0];
		this.error = null;
		this.opening = file.name;
		try {
			const loaded = await openPdfFile(file, t);
			await this.close();
			this.pdf = loaded;
			// Warm up the PDF writer while the user picks options.
			void loadPdfLib().catch(() => undefined);
			return true;
		} catch (error) {
			this.error = describeError(t, error);
			return false;
		} finally {
			this.opening = null;
		}
	}

	/** Runs the tool's processing step with progress and error handling. */
	async run(
		task: (pdf: LoadedPdf, onProgress: (fraction: number) => void) => Promise<ResultFile[] | void>
	) {
		if (!this.pdf || this.busy) return;
		this.busy = true;
		this.progress = null;
		this.error = null;
		try {
			const files = await task(this.pdf, (fraction) => {
				this.progress = fraction;
			});
			if (files) this.result = files;
		} catch (error) {
			this.error = describeError(this.#t(), error);
		} finally {
			this.busy = false;
			this.progress = null;
		}
	}

	fail(message: string): void {
		this.error = message;
	}

	async close(): Promise<void> {
		const previous = this.pdf;
		this.pdf = null;
		if (previous) await closePdf(previous.doc);
	}

	async reset(): Promise<void> {
		this.result = null;
		this.resultNote = undefined;
		this.error = null;
		await this.close();
	}
}

export { UserFacingError };
