export interface Faq {
	q: string;
	a: string;
}

export interface Feature {
	title: string;
	text: string;
}

/** Search-oriented copy for one tool page in one language. */
export interface ToolContent {
	/** <title>, without the brand suffix (added automatically). Aim for ≤ 50 characters. */
	title: string;
	/** Meta description, 120–160 characters. */
	description: string;
	h1: string;
	lead: string;
	stepsTitle: string;
	steps: string[];
	features: Feature[];
	faq: Faq[];
}

export interface PageLabels {
	howTo: string;
	why: string;
	faq: string;
	related: string;
	breadcrumbHome: string;
	free: string;
}

export interface HomeContent {
	title: string;
	description: string;
	h1: string;
	lead: string;
	points: string[];
	toolsTitle: string;
	privacyTitle: string;
	privacy: Feature[];
	faqTitle: string;
	faq: Faq[];
}

export interface PrivacyContent {
	title: string;
	description: string;
	h1: string;
	updated: string;
	sections: Array<{ heading: string; paragraphs: string[] }>;
}
