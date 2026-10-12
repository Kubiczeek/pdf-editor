import type { Lang } from '#lib/i18n/index.ts';
import type { HomeContent, PrivacyContent } from '#lib/content/types.ts';

export const home: Record<Lang, HomeContent> = {
	en: {
		title: 'Free Online PDF Editor – Edit, Sign & Merge PDFs',
		description:
			'Free PDF tools that run in your browser: edit, sign, merge, split, compress, convert and protect PDFs. No sign-up, and files never leave your device.',
		h1: 'Edit, sign and fix PDFs right in your browser',
		lead: 'Twenty-two free PDF tools that work on your own device. Nothing is uploaded, so your documents stay private.',
		points: [
			'No sign-up or watermarks',
			'Files never leave your device',
			'Works on phone and desktop'
		],
		toolsTitle: 'Every PDF tool you need',
		privacyTitle: 'Private by design, not by promise',
		privacy: [
			{
				title: 'Nothing is uploaded',
				text: 'Most online PDF services send your file to their servers. Here, the PDF is processed by code running in your browser tab, so it never travels over the internet.'
			},
			{
				title: 'Works offline',
				text: 'Once a tool has loaded you can disconnect from the network and it keeps working — a simple way to check that nothing is sent anywhere.'
			},
			{
				title: 'Built on proven open-source engines',
				text: 'Pages are rendered with Mozilla’s PDF.js and documents are written with pdf-lib — the same technology trusted by browsers and thousands of apps.'
			}
		],
		faqTitle: 'Questions and answers',
		faq: [
			{
				q: 'Is everything really free?',
				a: 'Yes. There are no paid plans, no trials, no watermarks and no limits on files or pages. Because your device does the work, running the site costs very little.'
			},
			{
				q: 'How can a PDF editor work without uploading files?',
				a: 'Modern browsers can run complex software. The page downloads the PDF engine once; after that your file is read, changed and saved entirely in the browser’s memory.'
			},
			{
				q: 'Do I need to install anything or create an account?',
				a: 'No. Open a tool, choose a file and you’re done. It works in Chrome, Edge, Firefox and Safari on computers, tablets and phones.'
			},
			{
				q: 'Is there a file size limit?',
				a: 'Only your device’s memory. Typical documents of tens or hundreds of pages work well; very large scans may be slow on older phones.'
			},
			{
				q: 'Can I edit the existing text of a PDF?',
				a: 'Yes. In Edit PDF, choose “Edit text” and click a line — it is covered and replaced with new text in a matching size and colour.'
			}
		]
	},
	cs: {
		title: 'PDF editor online zdarma – úpravy, podpis, spojení',
		description:
			'Bezplatné nástroje pro PDF v prohlížeči: upravte, podepište, spojte, rozdělte, zmenšete a převeďte PDF. Bez registrace, soubory se nikam nenahrávají.',
		h1: 'Upravujte, podepisujte a opravujte PDF přímo v prohlížeči',
		lead: 'Dvaadvacet bezplatných nástrojů pro PDF, které pracují ve vašem zařízení. Nic se nenahrává, takže dokumenty zůstanou soukromé.',
		points: [
			'Bez registrace a vodoznaků',
			'Soubory neopustí vaše zařízení',
			'Funguje na mobilu i počítači'
		],
		toolsTitle: 'Všechny nástroje pro PDF, které potřebujete',
		privacyTitle: 'Soukromí díky konstrukci, ne díky slibům',
		privacy: [
			{
				title: 'Nic se nenahrává',
				text: 'Většina online služeb pro PDF posílá soubor na své servery. Tady PDF zpracuje kód běžící ve vaší záložce prohlížeče, takže soubor nikdy necestuje internetem.'
			},
			{
				title: 'Funguje offline',
				text: 'Po načtení nástroje se můžete odpojit od sítě a nástroj funguje dál — jednoduchý důkaz, že se nic nikam neposílá.'
			},
			{
				title: 'Postaveno na ověřených open-source knihovnách',
				text: 'Stránky vykresluje PDF.js od Mozilly a dokumenty zapisuje knihovna pdf-lib — stejné technologie, kterým věří prohlížeče a tisíce aplikací.'
			}
		],
		faqTitle: 'Otázky a odpovědi',
		faq: [
			{
				q: 'Je opravdu všechno zdarma?',
				a: 'Ano. Nejsou tu placené tarify, zkušební verze, vodoznaky ani limity na soubory či stránky. Práci odvádí vaše zařízení, takže provoz webu stojí velmi málo.'
			},
			{
				q: 'Jak může PDF editor fungovat bez nahrávání souborů?',
				a: 'Moderní prohlížeče zvládnou spustit i složitý software. Stránka si jednou stáhne nástroj pro práci s PDF a pak se váš soubor čte, mění i ukládá jen v paměti prohlížeče.'
			},
			{
				q: 'Musím něco instalovat nebo si zakládat účet?',
				a: 'Ne. Otevřete nástroj, vyberete soubor a je hotovo. Funguje v Chromu, Edge, Firefoxu i Safari na počítačích, tabletech a telefonech.'
			},
			{
				q: 'Je nějaký limit velikosti souboru?',
				a: 'Jen paměť vašeho zařízení. Běžné dokumenty s desítkami či stovkami stránek fungují dobře; velmi velké skeny mohou být na starších telefonech pomalejší.'
			},
			{
				q: 'Můžu upravit existující text v PDF?',
				a: 'Ano. V nástroji Upravit PDF zvolte „Upravit text“ a klikněte na řádek — původní text se zakryje a nahradí novým ve stejné velikosti a barvě.'
			}
		]
	}
};

export const privacy: Record<Lang, PrivacyContent> = {
	en: {
		title: 'Privacy',
		description:
			'How KubiPDF handles your data: files are processed in your browser and never uploaded. No accounts, no tracking cookies, no analytics.',
		h1: 'Privacy',
		updated: 'Last updated: 12 October 2026',
		sections: [
			{
				heading: 'Your files never leave your device',
				paragraphs: [
					'All PDF tools on this website run inside your web browser. When you choose a file, it is read into your browser’s memory, processed there, and the result is offered to you as a download. The file is not sent to this website’s server or to anyone else.',
					'When you close or reload the page, the files and everything created from them are discarded.'
				]
			},
			{
				heading: 'No accounts, no tracking',
				paragraphs: [
					'There is no registration, no analytics, no advertising and no tracking cookies. The site does not use third-party scripts or fonts — every resource is served from this domain.',
					'Your browser’s local storage is used only to remember a dismissed language suggestion.'
				]
			},
			{
				heading: 'Server logs',
				paragraphs: [
					'The website is delivered by a static hosting provider (such as Cloudflare or Vercel), which may keep short-lived technical logs — for example IP address, time and requested page — to operate and protect the service. These logs never contain your documents.'
				]
			},
			{
				heading: 'Contact',
				paragraphs: [
					'Questions about privacy can be sent to the site operator, Jakub Jakubek, via jakubjakubek.cz.'
				]
			}
		]
	},
	cs: {
		title: 'Ochrana soukromí',
		description:
			'Jak KubiPDF zachází s vašimi daty: soubory se zpracovávají ve vašem prohlížeči a nikam se nenahrávají. Žádné účty, sledovací cookies ani analytika.',
		h1: 'Ochrana soukromí',
		updated: 'Poslední změna: 12. října 2026',
		sections: [
			{
				heading: 'Vaše soubory neopustí vaše zařízení',
				paragraphs: [
					'Všechny nástroje pro PDF na tomto webu běží ve vašem webovém prohlížeči. Když vyberete soubor, načte se do paměti prohlížeče, zpracuje se tam a výsledek dostanete ke stažení. Soubor se neposílá na server tohoto webu ani nikomu jinému.',
					'Po zavření nebo obnovení stránky se soubory i vše, co z nich vzniklo, zahodí.'
				]
			},
			{
				heading: 'Žádné účty, žádné sledování',
				paragraphs: [
					'Nevyžadujeme registraci a nepoužíváme analytiku, reklamy ani sledovací cookies. Web nenačítá skripty ani písma třetích stran — všechny zdroje se načítají z této domény.',
					'Místní úložiště prohlížeče slouží jen k zapamatování zavřené nabídky jazyka.'
				]
			},
			{
				heading: 'Záznamy serveru',
				paragraphs: [
					'Web doručuje poskytovatel statického hostingu (např. Cloudflare nebo Vercel), který může krátkodobě uchovávat technické záznamy — například IP adresu, čas a požadovanou stránku — kvůli provozu a ochraně služby. Tyto záznamy nikdy neobsahují vaše dokumenty.'
				]
			},
			{
				heading: 'Kontakt',
				paragraphs: [
					'Dotazy k ochraně soukromí můžete poslat provozovateli webu, Jakubu Jakubkovi, prostřednictvím jakubjakubek.cz.'
				]
			}
		]
	}
};
