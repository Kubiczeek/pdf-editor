/**
 * Files dropped on the home page are kept in memory and picked up by the tool
 * page after client-side navigation, so the user doesn't have to choose them again.
 */
let pending: File[] | null = null;

export function setHandoff(files: File[]): void {
	pending = files.length ? files : null;
}

export function takeHandoff(): File[] | null {
	const files = pending;
	pending = null;
	return files;
}
