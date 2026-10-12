/** 24×24 stroke icons. Each entry is the inner SVG markup. */
export const ICONS = {
	upload:
		'<path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
	download:
		'<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
	file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
	files:
		'<path d="M15 2H9a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6z"/><path d="M15 2v4h4"/><path d="M5 7v12a2 2 0 0 0 2 2h8"/>',
	x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
	plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
	minus: '<path d="M5 12h14"/>',
	trash:
		'<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12"/><path d="M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7"/>',
	rotateLeft: '<path d="M4 4v5h5"/><path d="M4.6 9A8 8 0 1 1 6 16.9"/>',
	rotateRight: '<path d="M20 4v5h-5"/><path d="M19.4 9A8 8 0 1 0 18 16.9"/>',
	copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
	chevronLeft: '<path d="m15 18-6-6 6-6"/>',
	chevronRight: '<path d="m9 18 6-6-6-6"/>',
	chevronDown: '<path d="m6 9 6 6 6-6"/>',
	chevronUp: '<path d="m18 15-6-6-6 6"/>',
	grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
	check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
	lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
	unlock:
		'<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.7-1.5"/>',
	shield:
		'<path d="M12 3 5 6v5.5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
	info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
	alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
	zoomIn:
		'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/><path d="M11 8v6"/><path d="M8 11h6"/>',
	zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/><path d="M8 11h6"/>',
	fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4"/><path d="M20 9V5a1 1 0 0 0-1-1h-4"/><path d="M4 15v4a1 1 0 0 0 1 1h4"/><path d="M20 15v4a1 1 0 0 1-1 1h-4"/>',
	undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
	redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
	cursor: '<path d="M5 3.5 18.5 10l-6 1.6-2.4 6.4z"/><path d="m12.5 11.6 5 5"/>',
	type: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
	editText:
		'<path d="M4 7V5h11v2"/><path d="M9.5 5v12"/><path d="M7 17h5"/><path d="m14.5 19.5 1-3.5 4.2-4.2a1.5 1.5 0 0 1 2.1 2.1l-4.2 4.2z"/>',
	signature:
		'<path d="M3.5 16.5c2.5-1.5 4-6 4-8.5 0-1.5-.6-2.5-1.5-2.5C4.5 5.5 4 8 4 10.5 4 14 5.5 18 8 18c1.5 0 2.5-1.5 3.5-3.5.3 1.5 1 2.5 2 2.5 1.2 0 2-1.5 2.8-2.5.4 1 1.1 1.5 2 1.5h2.2"/><path d="M3.5 21h17"/>',
	image:
		'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 3.5 3.5L15 14l5 5"/>',
	pencil:
		'<path d="M4 20l1.2-4.4L15.8 5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="m13.5 7.5 3 3"/>',
	highlighter:
		'<path d="m9 15-2.5 2.5L4 20h5l1.5-1.5"/><path d="m8.5 12.5 3 3"/><path d="M8.5 12.5 16 5a2.1 2.1 0 0 1 3 3l-7.5 7.5-4 1z"/>',
	square: '<rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/>',
	circle: '<ellipse cx="12" cy="12" rx="8" ry="7"/>',
	line: '<path d="M5 19 19 5"/>',
	arrow: '<path d="M5 19 19 5"/><path d="M10 5h9v9"/>',
	eraser:
		'<path d="M8.5 20H20"/><path d="m4.5 15.5 9.4-9.4a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19.1a3 3 0 0 1-4.2 0l-2.3-2.3a.9.9 0 0 1 0-1.3z"/><path d="m9 11 5 5"/>',
	note: '<path d="M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-8l-5 3.5V17H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 9h8"/><path d="M8 12.5h5"/>',
	tick: '<path d="m4.5 12.5 5 5L19.5 6"/>',
	cross: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
	menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
	globe:
		'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
	scissors:
		'<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8.2 8.2 20 18"/><path d="M8.2 15.8 20 6"/>',
	merge:
		'<path d="M7 4v5a5 5 0 0 0 5 5h0a5 5 0 0 1 5 5v1"/><path d="M17 4v5a5 5 0 0 1-3 4.6"/><path d="m4 7 3-3 3 3"/><path d="m14 7 3-3 3 3"/>',
	compress:
		'<path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/>',
	layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
	tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8" cy="8" r="1.5"/>',
	hash: '<path d="M9 4 7 20"/><path d="M17 4l-2 16"/><path d="M4.5 9h16"/><path d="M3.5 15h16"/>',
	droplet: '<path d="M12 3.5c3.5 4.2 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.5-6.3 6-10.5z"/>',
	crop: '<path d="M6 2.5V16a2 2 0 0 0 2 2h13.5"/><path d="M2.5 6H16a2 2 0 0 1 2 2v13.5"/>',
	redact:
		'<rect x="3.5" y="5" width="17" height="4" rx="1" fill="currentColor"/><path d="M3.5 13h9"/><rect x="14.5" y="11" width="6" height="4" rx="1" fill="currentColor"/><path d="M3.5 19h17"/>',
	fileImage:
		'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><circle cx="10" cy="12" r="1.5"/><path d="m7 19 4-4 2 2 1.5-1.5L17 18"/>',
	fileText:
		'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7"/><path d="M8.5 16.5h5"/>',
	grid: '<rect x="4" y="4" width="6.5" height="7.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="7.5" rx="1"/><rect x="4" y="14.5" width="6.5" height="5.5" rx="1"/><rect x="13.5" y="14.5" width="6.5" height="5.5" rx="1"/>',
	pagesOut:
		'<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M13 3l4 4"/><path d="M15 12h6"/><path d="m18 9 3 3-3 3"/>',
	pagesDel:
		'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14h6"/>',
	form: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7.5 8.5h9"/><rect x="7.5" y="12" width="9" height="4" rx="1"/>',
	edit: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 17 .6-2.6 4.6-4.6a1.3 1.3 0 0 1 1.9 1.9l-4.6 4.6z"/>',
	eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
	eyeOff:
		'<path d="M3 3l18 18"/><path d="M10.6 6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7"/><path d="M6.6 7.1A16.5 16.5 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
	reverse:
		'<path d="M7 4v16"/><path d="m4 17 3 3 3-3"/><path d="M17 20V4"/><path d="m14 7 3-3 3 3"/>',
	sort: '<path d="M4 7h9"/><path d="M4 12h6"/><path d="M4 17h3"/><path d="M17 5v14"/><path d="m14 16 3 3 3-3"/>',
	alignLeft: '<path d="M4 6h16"/><path d="M4 10h10"/><path d="M4 14h16"/><path d="M4 18h10"/>',
	alignCenter: '<path d="M4 6h16"/><path d="M7 10h10"/><path d="M4 14h16"/><path d="M7 18h10"/>',
	alignRight: '<path d="M4 6h16"/><path d="M10 10h10"/><path d="M4 14h16"/><path d="M10 18h10"/>',
	bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
	italic: '<path d="M10 5h8"/><path d="M6 19h8"/><path d="M14 5 10 19"/>',
	sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15"/>',
	front: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
	sparkle: '<path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2z"/>'
} as const;

export type IconName = keyof typeof ICONS;
