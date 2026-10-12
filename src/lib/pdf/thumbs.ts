/**
 * A small queue so that dozens of thumbnails don't all render at once
 * (which wastes memory and delays the ones actually on screen).
 */
type Job = { run: () => Promise<void>; cancelled: () => boolean; done: () => void };

const MAX_ACTIVE = 3;
const queue: Job[] = [];
let active = 0;

function pump(): void {
	while (active < MAX_ACTIVE && queue.length) {
		const job = queue.shift()!;
		if (job.cancelled()) {
			job.done();
			continue;
		}
		active++;
		job
			.run()
			.catch(() => undefined)
			.finally(() => {
				active--;
				job.done();
				pump();
			});
	}
}

/** Schedules a render; `signal` aborts it if it hasn't started yet. */
export function scheduleRender(run: () => Promise<void>, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		queue.push({ run, cancelled: () => signal.aborted, done: resolve });
		pump();
	});
}
