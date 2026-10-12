import { getContext, setContext } from 'svelte';
import { ui, type UiDict } from './ui.ts';

export const LANGS = ['en', 'cs'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_NAMES: Record<Lang, string> = { en: 'English', cs: 'Čeština' };
/** Locale codes used for Open Graph and number/date formatting. */
export const LOCALES: Record<Lang, string> = { en: 'en_US', cs: 'cs_CZ' };
export const BCP47: Record<Lang, string> = { en: 'en', cs: 'cs' };

export function isLang(value: unknown): value is Lang {
	return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** Detects the language of a pathname: everything under /cs is Czech. */
export function langFromPath(pathname: string): Lang {
	return pathname === '/cs' || pathname.startsWith('/cs/') ? 'cs' : 'en';
}

/** Home page path of a language. */
export function homePath(lang: Lang): string {
	return lang === 'en' ? '/' : `/${lang}/`;
}

/** Path of a static (non-tool) page per language. */
export const STATIC_PAGES = {
	privacy: { en: '/privacy/', cs: '/cs/ochrana-soukromi/' }
} as const satisfies Record<string, Record<Lang, string>>;

/** Replaces `{name}` placeholders in a string. */
export function fmt(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) =>
		key in values ? String(values[key]) : match
	);
}

type PluralForms = { one: string; few?: string; other: string };

/** Picks a plural form; Czech distinguishes 1 / 2–4 / 5+. Forms may contain `{n}`. */
export function plural(lang: Lang, n: number, forms: PluralForms): string {
	const category = new Intl.PluralRules(BCP47[lang]).select(n);
	const template =
		category === 'one' ? forms.one : category === 'few' ? (forms.few ?? forms.other) : forms.other;
	return fmt(template, { n: formatNumber(lang, n) });
}

export function formatNumber(lang: Lang, n: number, maximumFractionDigits = 0): string {
	return new Intl.NumberFormat(BCP47[lang], { maximumFractionDigits }).format(n);
}

/** Human readable file size, e.g. "1.4 MB". */
export function formatBytes(lang: Lang, bytes: number): string {
	if (bytes < 1024) return `${formatNumber(lang, bytes)} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${formatNumber(lang, value, value < 10 ? 1 : 0)} ${units[unit]}`;
}

export interface I18n {
	readonly lang: Lang;
	readonly t: UiDict;
}

const KEY = Symbol('i18n');

/** Called once in the root layout; `getLang` is read lazily so the value stays reactive. */
export function setI18n(getLang: () => Lang): I18n {
	const i18n: I18n = {
		get lang() {
			return getLang();
		},
		get t() {
			return ui[getLang()];
		}
	};
	setContext(KEY, i18n);
	return i18n;
}

export function useI18n(): I18n {
	const i18n = getContext<I18n | undefined>(KEY);
	if (!i18n) throw new Error('useI18n() called outside of the root layout');
	return i18n;
}

export { ui, type UiDict };
