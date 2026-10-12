import type { ToolId } from '#lib/tools/registry.ts';
import type { ToolContent, PageLabels } from '#lib/content/types.ts';

export const labelsCs: PageLabels = {
	howTo: 'Jak to funguje',
	why: 'Proč tento nástroj',
	faq: 'Časté dotazy',
	related: 'Související nástroje',
	breadcrumbHome: 'Všechny nástroje PDF',
	free: 'Zdarma',
	noscript: 'Pro použití nástroje zapněte JavaScript — soubory zpracovává váš vlastní prohlížeč.'
};

export const toolsCs: Record<ToolId, ToolContent> = {
	edit: {
		title: 'Upravit PDF online zdarma – text a obrázky',
		description:
			'Upravujte PDF přímo v prohlížeči: měňte existující text, přidávejte text, obrázky, tvary, zvýraznění a komentáře. Zdarma, bez registrace a bez nahrávání.',
		h1: 'Upravit PDF online',
		lead: 'Změňte existující text, přidejte nový text, obrázky, podpisy, tvary, zvýraznění a komentáře — přímo v prohlížeči, bez nahrávání souboru na server.',
		stepsTitle: 'Jak upravit PDF',
		steps: [
			'Vyberte PDF, které chcete upravit, nebo ho přetáhněte na tuto stránku.',
			'Zvolte nástroj: Upravit text pro změnu stávajícího textu, Přidat text pro psaní kamkoli, případně obrázky, tvary, zvýraznění a komentáře.',
			'Položky přesunete tažením a velikost změníte úchyty. Stránky můžete v bočním panelu přeskládat, otočit nebo smazat.',
			'Upravený dokument uložíte tlačítkem Stáhnout PDF.'
		],
		features: [
			{
				title: 'Soukromí na prvním místě',
				text: 'Úpravy probíhají ve vašem zařízení. PDF se nikam nenahrává, takže důvěrné dokumenty zůstanou důvěrné.'
			},
			{
				title: 'Skutečný editor',
				text: 'Přepisujte existující text, přidávejte text v několika písmech s plnou podporou češtiny, vkládejte obrázky, kreslete, zvýrazňujte, zabělujte a komentujte.'
			},
			{
				title: 'Funguje všude',
				text: 'Ve Windows, macOS, Linuxu, Androidu i na iPhonu v jakémkoli moderním prohlížeči. Nic se neinstaluje.'
			}
		],
		faq: [
			{
				q: 'Můžu změnit text, který už v PDF je?',
				a: 'Ano. Zvolte „Upravit text“ a klikněte na řádek textu. Původní text se zakryje a nahradí upravitelným textem ve stejné velikosti a barvě. Nejlépe to funguje na jednobarevném pozadí; na fotkách či vzorech můžete upravit barvu zakrytí.'
			},
			{
				q: 'Je tento PDF editor opravdu zdarma?',
				a: 'Ano. Všechny funkce jsou zdarma, bez vodoznaků, bez omezení počtu stránek a bez účtu. Nástroje běží ve vašem prohlížeči, takže nevznikají náklady na servery.'
			},
			{
				q: 'Nahrávají se moje soubory na server?',
				a: 'Ne. PDF otevírá i ukládá JavaScript ve vašem prohlížeči. Ověřit si to můžete na záložce Síť ve vývojářských nástrojích: soubor se nikam neodesílá.'
			},
			{
				q: 'Funguje čeština a další jazyky?',
				a: 'Ano. Přidaný text používá vložená písma Noto, která pokrývají latinku včetně české diakritiky, řečtinu i cyrilici.'
			},
			{
				q: 'Zachovají se v upraveném PDF formuláře a odkazy?',
				a: 'Ano. Upravuje se původní dokument, takže odkazy, záložky i formulářová pole zůstanou zachovány.'
			}
		]
	},
	sign: {
		title: 'Podepsat PDF online zdarma – vložte svůj podpis',
		description:
			'Podepište PDF online zdarma: nakreslete, napište nebo nahrajte podpis a umístěte ho kamkoli. Bez registrace a bez nahrávání — vše běží v prohlížeči.',
		h1: 'Podepsat PDF',
		lead: 'Nakreslete podpis myší nebo prstem, napište ho ručně psaným písmem nebo nahrajte jeho fotku — a umístěte ho na libovolnou stránku.',
		stepsTitle: 'Jak podepsat PDF',
		steps: [
			'Vyberte PDF, které potřebujete podepsat.',
			'Vytvořte podpis: nakreslete ho, napište své jméno ručně psaným stylem nebo nahrajte obrázek.',
			'Klikněte na místo, kam podpis patří, a podle potřeby ho posuňte a zvětšete. Datum nebo iniciály doplníte pomocí Přidat text.',
			'Stáhněte podepsané PDF.'
		],
		features: [
			{
				title: 'Podpis zůstává u vás',
				text: 'Podpis i dokument se zpracovávají jen ve vašem zařízení a nikdy se neposílají na server.'
			},
			{
				title: 'Tři způsoby podpisu',
				text: 'Kreslete myší, touchpadem, perem nebo prstem; napište jméno jedním z ručně psaných písem; nebo nahrajte sken a odstraňte bílé pozadí.'
			},
			{
				title: 'Ostrý na každé stránce',
				text: 'Nakreslený podpis se ukládá jako vektor, takže zůstane ostrý při tisku i přiblížení.'
			}
		],
		faq: [
			{
				q: 'Je takto vložený podpis právně platný?',
				a: 'Jde o prostý elektronický podpis, který stačí pro řadu běžných dohod. Některé dokumenty vyžadují uznávaný nebo kvalifikovaný elektronický podpis s certifikátem — ověřte si, co příjemce požaduje.'
			},
			{
				q: 'Můžu podepisovat na mobilu?',
				a: 'Ano. Otevřete tuto stránku v telefonu, vyberte PDF a podpis nakreslete prstem.'
			},
			{
				q: 'Můžu vložit více podpisů nebo iniciál?',
				a: 'Ano. Vytvořené podpisy zůstávají k dispozici, dokud je editor otevřený, takže je vložíte na libovolný počet stránek.'
			},
			{
				q: 'Ukládáte si kopii mého podpisu?',
				a: 'Ne. Nic se nenahrává ani neukládá. Po zavření stránky podpis zmizí.'
			}
		]
	},
	'fill-form': {
		title: 'Vyplnit PDF formulář online zdarma',
		description:
			'Vyplňte PDF formulář online: pište do polí, zaškrtávejte políčka, vybírejte možnosti a podepište se. Funguje i bez polí. Zdarma a bez nahrávání.',
		h1: 'Vyplnit PDF formulář',
		lead: 'Pište do formulářových polí, zaškrtávejte políčka a vybírejte možnosti. U formulářů bez polí napíšete text kamkoli na stránku.',
		stepsTitle: 'Jak vyplnit PDF formulář',
		steps: [
			'Vyberte PDF formulář.',
			'Klikněte do zvýrazněných polí a vyplňte je. U naskenovaných formulářů použijte Přidat text.',
			'Pokud formulář vyžaduje podpis, přidejte ho.',
			'Stáhněte vyplněné PDF.'
		],
		features: [
			{
				title: 'Skutečná formulářová pole',
				text: 'Vyplnitelné PDF zůstane funkční: odpovědi se uloží do polí, takže je ostatní mohou dál číst i měnit.'
			},
			{
				title: 'I formuláře bez polí',
				text: 'Žádná pole? Pište text, fajfky a křížky kamkoli na stránku a přesně je zarovnejte.'
			},
			{
				title: 'Nic neopustí vaše zařízení',
				text: 'Formuláře často obsahují osobní údaje. Tady se vyplňují lokálně a nikam se nenahrávají.'
			}
		],
		faq: [
			{
				q: 'Jak poznám, jestli má PDF vyplnitelná pole?',
				a: 'Po otevření souboru editor ukáže, kolik vyplnitelných polí našel, a zvýrazní je. Pokud žádná nejsou, použijte Přidat text.'
			},
			{
				q: 'Můžu odpovědi zamknout, aby je nikdo nezměnil?',
				a: 'Ano. Po stažení soubor zpracujte nástrojem Zploštit PDF, který z polí udělá běžný obsah stránky.'
			},
			{
				q: 'Funguje ve formulářových polích diakritika?',
				a: 'Ano. Vzhled polí se vytváří s vloženým písmem Unicode, takže jména jako Dvořák nebo Šťastná se zobrazí správně.'
			}
		]
	},
	watermark: {
		title: 'Přidat vodoznak do PDF online zdarma',
		description:
			'Přidejte do PDF textový nebo obrázkový vodoznak. Nastavte písmo, barvu, průhlednost, natočení a umístění, nebo ho opakujte přes stránku. Zdarma, bez nahrávání.',
		h1: 'Přidat vodoznak do PDF',
		lead: 'Označte každou stránku nápisem „Důvěrné“, „Koncept“ nebo svým logem a nastavte velikost, barvu, průhlednost i úhel.',
		stepsTitle: 'Jak přidat vodoznak do PDF',
		steps: [
			'Vyberte PDF.',
			'Napište text vodoznaku nebo vyberte obrázek a nastavte velikost, barvu, průhlednost a natočení.',
			'Zvolte umístění — roh, střed, nebo opakování přes celou stránku.',
			'Klikněte na Přidat vodoznak a výsledek stáhněte.'
		],
		features: [
			{
				title: 'Text nebo logo',
				text: 'Použijte libovolný text v několika písmech včetně diakritiky, nebo logo PNG/JPG s průhledností.'
			},
			{
				title: 'Správně i na otočených stránkách',
				text: 'Vodoznak se umísťuje podle stránky tak, jak ji vidíte, i když je otočená nebo na šířku.'
			},
			{
				title: 'Zůstává ve vašem počítači',
				text: 'Dokumenty se označují lokálně v prohlížeči a nikam se nenahrávají.'
			}
		],
		faq: [
			{
				q: 'Můžu vodoznak dát jen na některé stránky?',
				a: 'Ano. Zvolte „Vybrané stránky“ a napište čísla nebo rozsahy, například 1-3, 7.'
			},
			{
				q: 'Může být vodoznak pod textem?',
				a: 'Ano, zaškrtněte „Umístit pod obsah stránky“. U naskenovaných stránek ho ale může sken zakrýt.'
			},
			{
				q: 'Dá se vodoznak odstranit?',
				a: 'Vodoznak se vkládá jako obsah stránky, což odstranění ztěžuje, ale ne znemožňuje. Pro silnější ochranu soubor také zploštěte a zaheslujte.'
			}
		]
	},
	'page-numbers': {
		title: 'Očíslovat stránky PDF online zdarma',
		description:
			'Očíslujte stránky PDF online. Zvolte umístění, formát (1, Strana 1, Strana 1 z 10), písmo, velikost a počáteční číslo. Zdarma, bez registrace a bez nahrávání.',
		h1: 'Očíslovat stránky PDF',
		lead: 'Vložte čísla stránek do libovolného rohu nebo doprostřed ve stylu, který potřebujete — „1“, „Strana 1“ nebo „Strana 1 z 10“.',
		stepsTitle: 'Jak očíslovat stránky v PDF',
		steps: [
			'Vyberte PDF.',
			'Zvolte, kam čísla patří a v jakém formátu.',
			'Případně vynechte titulní stranu nebo začněte číslovat od jiného čísla.',
			'Klikněte na Očíslovat stránky a stáhněte PDF.'
		],
		features: [
			{
				title: 'Flexibilní číslování',
				text: 'Začněte libovolným číslem, na libovolné stránce a zvolte text kolem čísla.'
			},
			{
				title: 'Správně na každé stránce',
				text: 'Čísla se umísťují podle viditelné stránky, takže otočené stránky a stránky na šířku jsou očíslované správně.'
			},
			{
				title: 'Soukromě a zdarma',
				text: 'Vše běží ve vašem prohlížeči — bez nahrávání, bez účtu a bez vodoznaku.'
			}
		],
		faq: [
			{
				q: 'Jak vynechám titulní stranu?',
				a: 'Nastavte „Začít na stránce“ na 2. Pokud má mít druhá stránka číslo 1, nechte „První číslo“ na 1.'
			},
			{
				q: 'Můžu použít formát „Strana 1 z 10“?',
				a: 'Ano, zvolte tento formát. Celkový počet zahrnuje jen číslované stránky.'
			},
			{
				q: 'Nezakryjí čísla obsah stránky?',
				a: 'Čísla se vkládají do zvoleného okraje. Pokud má dokument obsah blízko okraje, okraj zvětšete.'
			}
		]
	},
	redact: {
		title: 'Začernit PDF online zdarma – anonymizace údajů',
		description:
			'Trvale začerněte jména, čísla a další citlivé údaje v PDF. Stránky se začerněním se zploští, takže skrytý obsah nejde obnovit. Zdarma, bez nahrávání.',
		h1: 'Začernit údaje v PDF',
		lead: 'Označte oblasti, které chcete skrýt, a získejte PDF, ve kterém informace pod nimi opravdu zmizí — nejen se překryjí černým obdélníkem.',
		stepsTitle: 'Jak začernit text v PDF',
		steps: [
			'Vyberte PDF.',
			'Tažením označte vše, co chcete skrýt, na libovolném počtu stránek.',
			'Klikněte na Začernit PDF. Každá stránka s označením se převede na obrázek s vyplněnou oblastí.',
			'Stáhněte začerněnou kopii a sdílejte ji místo originálu.'
		],
		features: [
			{
				title: 'Skutečné začernění',
				text: 'Text, obrázky i grafika pod označením se odstraní, ne jen skryjí. Kopírování ani vyhledávání je neodhalí.'
			},
			{
				title: 'Mění se jen to nutné',
				text: 'Stránky bez začernění se zkopírují beze změny, takže jejich text půjde dál označit.'
			},
			{
				title: 'Bez nahrávání',
				text: 'Citlivé dokumenty nemají co dělat na cizím serveru. Tady neopustí vaše zařízení.'
			}
		],
		faq: [
			{
				q: 'Proč nestačí nakreslit v editoru černý obdélník?',
				a: 'Nakreslený obdélník text jen překryje; text v souboru zůstane a dá se zkopírovat. Tento nástroj dotčené stránky převede na obrázky, takže obsah opravdu zmizí.'
			},
			{
				q: 'Co se stane s textem na začerněných stránkách?',
				a: 'Začerněné stránky se stanou obrázky, takže jejich text už nepůjde označit ani vyhledat. Ostatní stránky se nemění.'
			},
			{
				q: 'Odstraní se i metadata dokumentu?',
				a: 'Ano. Začerněné PDF je nový soubor a nepřebírá původní název, autora ani jiná metadata.'
			}
		]
	},
	merge: {
		title: 'Spojit PDF online zdarma – sloučení PDF souborů',
		description:
			'Spojte více PDF souborů do jednoho dokumentu v libovolném pořadí. Přetažením změníte pořadí a pak sloučíte. Zdarma, bez omezení a bez nahrávání.',
		h1: 'Spojit PDF soubory',
		lead: 'Sloučte několik PDF do jednoho dokumentu. Přetáhněte soubory do správného pořadí a během pár sekund je spojte.',
		stepsTitle: 'Jak spojit PDF',
		steps: [
			'Vyberte dva nebo více souborů PDF, případně je přetáhněte na tuto stránku.',
			'Přetažením seřaďte soubory v požadovaném pořadí.',
			'Klikněte na Spojit PDF a stáhněte spojený dokument.'
		],
		features: [
			{
				title: 'Bez omezení',
				text: 'Spojte tolik souborů a stránek, kolik zvládne vaše zařízení. Žádné denní limity ani omezení velikosti.'
			},
			{
				title: 'Rychle a soukromě',
				text: 'Soubory se spojují v prohlížeči. Nic se nenahrává, takže i velké dokumenty jsou hotové rychle.'
			},
			{
				title: 'Zachová kvalitu',
				text: 'Stránky se kopírují přesně — text zůstane textem a obrázky se znovu nekomprimují.'
			}
		],
		faq: [
			{
				q: 'Kolik PDF můžu spojit najednou?',
				a: 'Pevný limit není. Velmi velké úlohy omezuje jen paměť vašeho zařízení.'
			},
			{
				q: 'Můžu spojit PDF chráněná heslem?',
				a: 'Ano, pokud heslo znáte. Při přidání souboru budete o heslo požádáni; spojené PDF heslem chráněné nebude.'
			},
			{
				q: 'Můžu měnit pořadí stránek, nejen souborů?',
				a: 'Nejdřív soubory spojte a pak pomocí Uspořádat stránky přesuňte, otočte nebo smažte jednotlivé stránky.'
			}
		]
	},
	split: {
		title: 'Rozdělit PDF online zdarma – rozdělení na stránky',
		description:
			'Rozdělte PDF na více souborů podle rozsahů stránek, po N stránkách nebo na jednotlivé stránky. Zdarma, rychle a soukromě — PDF se nikam nenahrává.',
		h1: 'Rozdělit PDF',
		lead: 'Rozdělte jedno PDF na několik menších souborů — podle rozsahů, na stejně velké části, nebo na jednotlivé stránky.',
		stepsTitle: 'Jak rozdělit PDF',
		steps: [
			'Vyberte PDF, které chcete rozdělit.',
			'Zvolte způsob: podle rozsahů jako 1-3, 4-8, po několika stránkách, nebo každou stránku zvlášť.',
			'Klikněte na Rozdělit PDF a stáhněte soubory (více souborů dostanete v jednom ZIPu).'
		],
		features: [
			{
				title: 'Tři způsoby rozdělení',
				text: 'Vlastní rozsahy, části o pevné velikosti, nebo každá stránka zvlášť — s náhledem, kolik souborů vznikne.'
			},
			{
				title: 'Bez ztráty kvality',
				text: 'Stránky se kopírují bez nového vykreslení, takže text i kvalita obrázků zůstanou nedotčené.'
			},
			{
				title: 'Ve vašem zařízení',
				text: 'Rozdělení probíhá lokálně. Dokument se nikam neposílá.'
			}
		],
		faq: [
			{
				q: 'Jak vyjmu jen několik stránek do jednoho souboru?',
				a: 'Použijte Vybrat stránky, nebo sem zadejte jediný rozsah, například 5-9.'
			},
			{
				q: 'Co znamená „8-“ v rozsahu?',
				a: 'Od stránky 8 do konce dokumentu. „-3“ znamená od první stránky do třetí.'
			},
			{
				q: 'Proč dostanu soubor ZIP?',
				a: 'Když rozdělením vznikne více PDF, zabalí se do jednoho ZIPu, abyste je stáhli najednou. Každý soubor můžete stáhnout i samostatně.'
			}
		]
	},
	organize: {
		title: 'Uspořádat stránky PDF online – přesunout a smazat',
		description:
			'Přeskládejte stránky PDF přetažením, otáčejte je, mažte, duplikujte, přidávejte prázdné stránky nebo vložte další PDF. Zdarma a soukromě, bez nahrávání.',
		h1: 'Uspořádat stránky PDF',
		lead: 'Prohlédněte si všechny stránky jako náhledy a přetažením je přeskládejte, otočte, smažte, zduplikujte nebo vložte stránky z jiného PDF.',
		stepsTitle: 'Jak změnit pořadí stránek v PDF',
		steps: [
			'Vyberte PDF.',
			'Přetažením náhledů změňte pořadí. Vybrané stránky můžete otočit, zduplikovat nebo smazat.',
			'Kde potřebujete, přidejte prázdné stránky nebo vložte stránky z jiného PDF.',
			'Klikněte na Uložit PDF a stáhněte upravený dokument.'
		],
		features: [
			{
				title: 'Vše na jednom místě',
				text: 'Přesouvejte, otáčejte, mažte, duplikujte a vkládejte stránky bez přepínání mezi nástroji.'
			},
			{
				title: 'Dokument zůstane celý',
				text: 'Formulářová pole, odkazy i metadata původního PDF zůstanou zachované.'
			},
			{
				title: 'Funguje i na dotyku',
				text: 'Přetahování funguje myší i na tabletech a telefonech.'
			}
		],
		faq: [
			{
				q: 'Můžu spojit stránky ze dvou PDF?',
				a: 'Ano. Kliknutím na „Vložit PDF“ přidáte stránky dalšího souboru a přetáhnete je, kam patří.'
			},
			{
				q: 'Jak vyberu více stránek?',
				a: 'Klikněte na stránky, které chcete vybrat; dalším kliknutím výběr zrušíte. Pak použijte tlačítka nad stránkami.'
			},
			{
				q: 'Změní se původní soubor?',
				a: 'Ne. Stáhnete nové PDF; soubor ve vašem počítači zůstane, jak byl.'
			}
		]
	},
	rotate: {
		title: 'Otočit PDF online zdarma – trvale otočit stránky',
		description:
			'Trvale otočte stránky PDF: všechny nebo jen vybrané o 90° či 180° a uložte. Zdarma, funguje na každém zařízení a nic se nenahrává.',
		h1: 'Otočit stránky PDF',
		lead: 'Natočte stránky ležící na boku nebo vzhůru nohama správně a otočení trvale uložte.',
		stepsTitle: 'Jak otočit PDF',
		steps: [
			'Vyberte PDF.',
			'Vyberte stránky k otočení, nebo nevybírejte nic a otočí se všechny.',
			'Otáčejte doleva či doprava, dokud stránky nevypadají správně, a klikněte na Uložit otočené PDF.'
		],
		features: [
			{
				title: 'Trvalé otočení',
				text: 'Otočení se uloží do souboru, takže se stránky správně zobrazí v každém prohlížeči.'
			},
			{
				title: 'Bez ztráty kvality',
				text: 'Otočení mění jen zobrazení stránky — obsah se znovu nevykresluje ani nekomprimuje.'
			},
			{
				title: 'Soukromě',
				text: 'PDF se otáčí v prohlížeči a nikam se nenahrává.'
			}
		],
		faq: [
			{
				q: 'Můžu otočit jen jednu stránku?',
				a: 'Ano. Kliknutím stránku vyberte a použijte tlačítka pro otočení. Nevybrané stránky zůstanou beze změny.'
			},
			{
				q: 'Proč se mi PDF v jiné aplikaci znovu otevře otočené?',
				a: 'Některé prohlížeče otáčejí zobrazení jen dočasně. Tento nástroj otočení zapíše přímo do PDF, takže platí všude.'
			},
			{
				q: 'Sníží otočení kvalitu?',
				a: 'Ne. Text i obrázky zůstanou přesně takové, jaké byly.'
			}
		]
	},
	'delete-pages': {
		title: 'Odstranit stránky z PDF online zdarma',
		description:
			'Odstraňte z PDF nepotřebné stránky: klikněte na ně nebo napište čísla stránek a uložte. Zdarma, rychle a dokument neopustí vaše zařízení.',
		h1: 'Odstranit stránky z PDF',
		lead: 'Smažte prázdné, zdvojené nebo nepotřebné stránky a zbytek dokumentu nechte přesně tak, jak byl.',
		stepsTitle: 'Jak smazat stránky z PDF',
		steps: [
			'Vyberte PDF.',
			'Klikněte na stránky, které chcete smazat, nebo napište jejich čísla, třeba 2, 5-7.',
			'Klikněte na Smazat stránky a stáhněte kratší PDF.'
		],
		features: [
			{
				title: 'Vidíte, co mažete',
				text: 'Díky náhledům snadno najdete prázdné nebo zdvojené stránky ještě před smazáním.'
			},
			{
				title: 'Zbytek zůstane',
				text: 'Ponechané stránky si zachovají text, odkazy i formulářová pole.'
			},
			{
				title: 'Bez nahrávání',
				text: 'Stránky odstraňuje váš prohlížeč, ne server.'
			}
		],
		faq: [
			{
				q: 'Můžu smazání vrátit?',
				a: 'Původní soubor se nikdy nemění. Pokud jste smazali špatnou stránku, začněte znovu s originálem.'
			},
			{
				q: 'Můžu mazat stránky z chráněného PDF?',
				a: 'Ano, po zadání hesla. Výsledek se uloží bez hesla.'
			},
			{
				q: 'Jak si naopak ponechám jen pár stránek?',
				a: 'Použijte Vybrat stránky — označte stránky, které chcete zachovat, a uložte je jako nové PDF.'
			}
		]
	},
	'extract-pages': {
		title: 'Vyjmout stránky z PDF online zdarma',
		description:
			'Vyberte stránky z PDF a uložte je jako nový dokument nebo jako samostatná PDF. Vybírejte kliknutím nebo zadáním rozsahů. Zdarma, bez nahrávání.',
		h1: 'Vybrat stránky z PDF',
		lead: 'Vyberte stránky, které potřebujete, a uložte je jako nové PDF — nebo každou stránku jako samostatné PDF.',
		stepsTitle: 'Jak vyjmout stránky z PDF',
		steps: [
			'Vyberte PDF.',
			'Klikněte na stránky, které chcete zachovat, nebo napište rozsahy jako 1-3, 10.',
			'Zvolte, jestli vytvořit jedno PDF, nebo samostatný soubor pro každou stránku, a klikněte na Vyjmout stránky.'
		],
		features: [
			{
				title: 'Vizuálně i podle čísel',
				text: 'Vybírejte stránky na náhledech nebo zadáním rozsahů — obojí se automaticky sladí.'
			},
			{
				title: 'Jeden soubor, nebo více',
				text: 'Uložte výběr jako jedno PDF, nebo jako samostatné soubory zabalené v ZIPu.'
			},
			{
				title: 'Zůstává u vás',
				text: 'Dokument zpracuje váš prohlížeč a nikam se nenahrává.'
			}
		],
		faq: [
			{
				q: 'Zůstanou vybrané stránky v původním pořadí?',
				a: 'Ano, stránky se uloží v pořadí dokumentu. Pořadí změníte potom nástrojem Uspořádat stránky.'
			},
			{
				q: 'Sníží se tím kvalita?',
				a: 'Ne. Stránky se kopírují přesně, bez nového vykreslení.'
			},
			{
				q: 'Jaký je rozdíl oproti Rozdělit PDF?',
				a: 'Výběr stránek vytvoří dokument ze stránek, které zvolíte. Rozdělení rozloží celý dokument na několik částí.'
			}
		]
	},
	crop: {
		title: 'Oříznout PDF online zdarma – okraje stránek',
		description:
			'Ořízněte stránky PDF online: tažením rámečku nastavte viditelnou oblast, automaticky najděte bílé okraje a použijte na jednu či všechny stránky. Zdarma.',
		h1: 'Oříznout PDF',
		lead: 'Odstraňte bílé okraje nebo zmenšete stránky na podstatnou část — na jedné stránce nebo v celém dokumentu.',
		stepsTitle: 'Jak oříznout PDF',
		steps: [
			'Vyberte PDF.',
			'Tažením rámečku na náhledu stránky nastavte oblast, nebo nechte okraje najít automaticky.',
			'Ořez použijte na všechny stránky nebo jen na aktuální a klikněte na Oříznout PDF.'
		],
		features: [
			{
				title: 'Automatické hledání okrajů',
				text: 'Jedním kliknutím najdete oblast s obsahem a odstraníte bílé místo kolem.'
			},
			{
				title: 'Přesné ovládání',
				text: 'Tažením hran a rohů rámečku přesně určíte, co zůstane viditelné.'
			},
			{
				title: 'Lokální zpracování',
				text: 'PDF se ořízne ve vašem prohlížeči — nikam se nenahrává.'
			}
		],
		faq: [
			{
				q: 'Smaže se oříznutý obsah?',
				a: 'Ne. Oříznutí skryje oblast mimo rámeček, stejně jako v Acrobatu. Pro trvalé odstranění informací použijte Začernit PDF.'
			},
			{
				q: 'Můžu každou stránku oříznout jinak?',
				a: 'Ano. Zvolte „Jen tato stránka“, ořízněte ji a totéž zopakujte u dalších stránek před uložením.'
			},
			{
				q: 'Změní se velikost stránky při tisku?',
				a: 'Ano, oříznutá oblast se stane novou velikostí stránky, takže se vytiskne bez odstraněných okrajů.'
			}
		]
	},
	'pdf-to-jpg': {
		title: 'PDF do JPG online zdarma – převod PDF na obrázky',
		description:
			'Převeďte stránky PDF na obrázky JPG ve vysokém rozlišení (až 300 DPI). Všechny stránky nebo jen vybrané, ke stažení i v ZIPu. Zdarma, bez nahrávání.',
		h1: 'Převést PDF na JPG',
		lead: 'Převeďte každou stránku — nebo jen ty vybrané — na obrázek JPG v rozlišení pro obrazovku i tisk.',
		stepsTitle: 'Jak převést PDF na JPG',
		steps: [
			'Vyberte PDF.',
			'Zvolte rozlišení, kvalitu obrázku a stránky k převodu.',
			'Klikněte na Převést na JPG a stáhněte obrázky.'
		],
		features: [
			{
				title: 'Rozlišení pro tisk',
				text: 'Zvolte 72, 150 nebo 300 DPI. Vyšší rozlišení znamená ostřejší text i detaily.'
			},
			{
				title: 'Věrné vykreslení',
				text: 'Stránky vykresluje PDF.js od Mozilly — stejný engine, kterým PDF zobrazuje Firefox.'
			},
			{
				title: 'Bez nahrávání',
				text: 'Obrázky vznikají ve vašem zařízení, což je rychlejší a dokument zůstane soukromý.'
			}
		],
		faq: [
			{
				q: 'Mám zvolit JPG, nebo PNG?',
				a: 'JPG dává menší soubory a hodí se pro fotky a skeny. PNG je bezeztrátové a lepší pro text, schémata a snímky obrazovky — na to použijte PDF do PNG.'
			},
			{
				q: 'Můžu převést jen jednu stránku?',
				a: 'Ano. Zvolte „Vybrané stránky“ a napište číslo stránky.'
			},
			{
				q: 'Jaké rozlišení zvolit?',
				a: '150 DPI stačí pro obrazovku a běžné dokumenty; 300 DPI pro tisk nebo přibližování detailů.'
			}
		]
	},
	'pdf-to-png': {
		title: 'PDF do PNG online zdarma – ostré obrázky',
		description:
			'Převeďte stránky PDF na bezeztrátové obrázky PNG s ostrým textem, až 300 DPI. Vyberte stránky, stáhněte obrázky jednotlivě nebo v ZIPu. Zdarma.',
		h1: 'Převést PDF na PNG',
		lead: 'Získejte bezeztrátové obrázky PNG ze stránek PDF — ideální pro prezentace, schémata, snímky obrazovky a jemný text.',
		stepsTitle: 'Jak převést PDF na PNG',
		steps: [
			'Vyberte PDF.',
			'Zvolte rozlišení a stránky k převodu.',
			'Klikněte na Převést na PNG a stáhněte obrázky.'
		],
		features: [
			{
				title: 'Bezeztrátová kvalita',
				text: 'PNG zachová každý pixel ostrý, bez kompresních artefaktů kolem textu a čar.'
			},
			{
				title: 'Vyberte stránky',
				text: 'Převeďte celý dokument nebo jen stránky, které potřebujete.'
			},
			{
				title: 'Zůstává ve vašem zařízení',
				text: 'Převod probíhá v prohlížeči; PDF se nikam nenahrává.'
			}
		],
		faq: [
			{
				q: 'Proč jsou soubory PNG větší než JPG?',
				a: 'PNG komprimuje bez ztráty detailů. Pro fotky a skeny je obvykle lepší volbou JPG.'
			},
			{
				q: 'Mají obrázky PNG průhledné pozadí?',
				a: 'Ne, stránky se vykreslí na bílé pozadí, stejně jako v prohlížeči PDF.'
			},
			{
				q: 'Můžu převést více stránek najednou?',
				a: 'Ano. Všechny obrázky se zabalí do jednoho souboru ZIP, nebo je stáhnete jednotlivě.'
			}
		]
	},
	'jpg-to-pdf': {
		title: 'JPG do PDF online zdarma – převod obrázků na PDF',
		description:
			'Převeďte obrázky JPG, PNG, WebP a další do jednoho PDF. Seřaďte je, zvolte velikost stránky, orientaci a okraje. Zdarma, bez registrace a bez nahrávání.',
		h1: 'Převést JPG na PDF',
		lead: 'Udělejte z fotek, skenů a snímků obrazovky jedno PDF — každý obrázek na samostatné stránce v pořadí, které zvolíte.',
		stepsTitle: 'Jak převést obrázky na PDF',
		steps: [
			'Vyberte obrázky — podporované jsou JPG, PNG, WebP, GIF a BMP.',
			'Přetažením je seřaďte a zvolte velikost stránky, orientaci a okraje.',
			'Klikněte na Vytvořit PDF a stáhněte ho.'
		],
		features: [
			{
				title: 'Fotky správně natočené',
				text: 'Fotky z telefonu se otočí podle údajů o orientaci, takže žádná neskončí na boku.'
			},
			{
				title: 'Původní kvalita',
				text: 'Obrázky JPG a PNG se vkládají bez další komprese.'
			},
			{
				title: 'Soukromě',
				text: 'Obrázky se převádějí ve vašem zařízení a nikam se nenahrávají.'
			}
		],
		faq: [
			{
				q: 'Můžu dát více obrázků do jednoho PDF?',
				a: 'Ano, to je výchozí chování: každý obrázek bude jedna stránka stejného PDF.'
			},
			{
				q: 'Jakou velikost stránky zvolit?',
				a: '„Podle obrázku“ přizpůsobí každou stránku obrázku. Pokud budete tisknout, zvolte A4.'
			},
			{
				q: 'Jsou podporované fotky HEIC z iPhonu?',
				a: 'Jen v prohlížečích, které HEIC umí otevřít (např. Safari). Jinde fotky nejdřív exportujte jako JPG.'
			}
		]
	},
	'pdf-to-text': {
		title: 'PDF na text online zdarma – získat text z PDF',
		description:
			'Získejte veškerý text z PDF a zkopírujte ho nebo stáhněte jako soubor .txt. Zachová zalomení řádků a funguje v prohlížeči. Zdarma, bez nahrávání.',
		h1: 'Převést PDF na text',
		lead: 'Vytáhněte text z PDF a vložte ho do e-mailu, dokumentu nebo překladače.',
		stepsTitle: 'Jak získat text z PDF',
		steps: [
			'Vyberte PDF.',
			'Klikněte na Získat text.',
			'Text zkopírujte nebo ho stáhněte jako soubor .txt.'
		],
		features: [
			{
				title: 'Čistý prostý text',
				text: 'Text se získá stránku po stránce se zachovaným zalomením řádků.'
			},
			{
				title: 'Libovolná délka',
				text: 'Funguje pro krátké dopisy i knihy se stovkami stránek.'
			},
			{
				title: 'Bez nahrávání',
				text: 'Text se získává v prohlížeči, takže dokument zůstane soukromý.'
			}
		],
		faq: [
			{
				q: 'Proč se v mém PDF nenašel žádný text?',
				a: 'Naskenovaná PDF obsahují obrázky stránek, ne text. Ty vyžadují OCR (rozpoznání textu), které tento nástroj neumí.'
			},
			{
				q: 'Zachová se formátování?',
				a: 'Dostanete prostý text se zalomením řádků. Písma, barvy a tabulky se nezachovají.'
			},
			{
				q: 'Můžu získat text z chráněného PDF?',
				a: 'Ano, po zadání hesla k otevření.'
			}
		]
	},
	compress: {
		title: 'Komprimovat PDF online zdarma – zmenšit PDF',
		description:
			'Zmenšete PDF optimalizací obrázků a odstraněním nepotřebných dat. Zvolte úroveň komprese a uvidíte úsporu. Zdarma, soukromě, bez nahrávání.',
		h1: 'Komprimovat PDF',
		lead: 'Zmenšete PDF tak, aby prošlo jako příloha e-mailu nebo přes limity nahrávání — a přitom zůstalo čitelné.',
		stepsTitle: 'Jak zmenšit PDF',
		steps: [
			'Vyberte PDF, které chcete zmenšit.',
			'Zvolte úroveň komprese: mírnou, doporučenou, silnou nebo maximální.',
			'Klikněte na Komprimovat PDF a stáhněte menší soubor.'
		],
		features: [
			{
				title: 'Chytrá optimalizace obrázků',
				text: 'Příliš velké fotky se zmenší na rozumné rozlišení a znovu zakódují; text a vektorová grafika zůstanou ostré.'
			},
			{
				title: 'Odstraní zbytečnosti',
				text: 'Nepoužívané objekty, staré revize a vložené miniatury se automaticky zahodí.'
			},
			{
				title: 'Komprese ve vašem zařízení',
				text: 'PDF se optimalizuje v prohlížeči. Nikdy se nenahrává na server.'
			}
		],
		faq: [
			{
				q: 'O kolik se PDF zmenší?',
				a: 'Záleží na obsahu. PDF plná fotek nebo skenů se často zmenší o 50–90 %. PDF jen s textem bývají malá už předem.'
			},
			{
				q: 'Půjde text dál označit?',
				a: 'Ano, při mírné, doporučené i silné kompresi. Jen maximální úroveň převede stránky na obrázky.'
			},
			{
				q: 'Co když se PDF nezmenší?',
				a: 'Pak už bylo dobře optimalizované. Dozvíte se to a můžete zkusit silnější úroveň.'
			}
		]
	},
	protect: {
		title: 'Zaheslovat PDF online zdarma – šifrování AES-256',
		description:
			'Zašifrujte PDF heslem pomocí AES-256. Volitelně omezte tisk, kopírování a úpravy. Zdarma a soubor se šifruje přímo ve vašem prohlížeči.',
		h1: 'Zaheslovat PDF',
		lead: 'Zamkněte PDF tak, aby ho otevřel jen ten, kdo zná heslo, a rozhodněte, jestli smí tisknout, kopírovat nebo upravovat.',
		stepsTitle: 'Jak dát heslo na PDF',
		steps: [
			'Vyberte PDF.',
			'Dvakrát zadejte heslo a zvolte, co smí čtenáři dělat.',
			'Klikněte na Zaheslovat PDF a stáhněte zašifrovaný soubor.'
		],
		features: [
			{
				title: 'Silné šifrování',
				text: 'Soubory se šifrují pomocí AES-256, nejsilnějšího standardního šifrování PDF, které podporují všechny současné čtečky.'
			},
			{
				title: 'Nastavení oprávnění',
				text: 'Povolte nebo zakažte tisk, kopírování, úpravy a komentáře.'
			},
			{
				title: 'Heslo zůstane tajné',
				text: 'Šifrování probíhá ve vašem zařízení, takže se nikam neposílá ani soubor, ani heslo.'
			}
		],
		faq: [
			{
				q: 'Co když heslo zapomenu?',
				a: 'Nejde obnovit — v tom je smysl šifrování. Uschovejte si heslo nebo nezaheslovanou kopii souboru na bezpečném místě.'
			},
			{
				q: 'Fungují omezení oprávnění spolehlivě?',
				a: 'Seriózní čtečky PDF je respektují, nejsou ale tak silná jako heslo k otevření. Pro utajení obsahu použijte heslo k otevření.'
			},
			{
				q: 'Které aplikace zaheslované PDF otevřou?',
				a: 'Všechny moderní čtečky PDF včetně Adobe Acrobat Reader, webových prohlížečů, Náhledu v macOS a mobilních aplikací.'
			}
		]
	},
	unlock: {
		title: 'Odemknout PDF online zdarma – odstranit heslo',
		description:
			'Odstraňte heslo a omezení z PDF, které umíte otevřít. Zadejte heslo jednou a stáhněte odemčenou kopii. Zdarma, soukromě, bez nahrávání.',
		h1: 'Odemknout PDF',
		lead: 'Už vás nebaví pokaždé psát heslo? Zadejte ho jednou a uložte si kopii bez hesla a omezení.',
		stepsTitle: 'Jak odstranit heslo z PDF',
		steps: [
			'Vyberte chráněné PDF.',
			'Na výzvu zadejte jeho heslo.',
			'Klikněte na Odemknout PDF a stáhněte odemčenou kopii.'
		],
		features: [
			{
				title: 'Odstraní i omezení',
				text: 'Spolu s heslem k otevření zmizí i omezení tisku, kopírování a úprav.'
			},
			{
				title: 'Stejný obsah',
				text: 'Odstraní se jen šifrování — stránky, text i obrázky zůstanou úplně stejné.'
			},
			{
				title: 'Zůstává ve vašem zařízení',
				text: 'Soubor se dešifruje v prohlížeči; heslo se nikam nepřenáší.'
			}
		],
		faq: [
			{
				q: 'Odemknete PDF i bez hesla?',
				a: 'Ne. Tento nástroj odstraňuje ochranu ze souborů, které umíte otevřít. Hesla neprolamuje.'
			},
			{
				q: 'PDF se otevře bez hesla, ale nejde vytisknout. Pomůže to?',
				a: 'Ano. Takové soubory mají jen omezení oprávnění a tento nástroj je odstraní bez zadávání hesla.'
			},
			{
				q: 'Je legální odstranit heslo z PDF?',
				a: 'Odstranit ochranu z vlastních dokumentů nebo z dokumentů, které smíte používat, je v pořádku. Respektujte práva ostatních.'
			}
		]
	},
	flatten: {
		title: 'Zploštit PDF online zdarma – formuláře a anotace',
		description:
			'Zploštěte PDF, aby se formulářová pole, komentáře, zvýraznění a razítka staly součástí stránky a nešly změnit. Zdarma, bez registrace a bez nahrávání.',
		h1: 'Zploštit PDF',
		lead: 'Převeďte vyplněná pole formuláře, komentáře a značky na běžný obsah stránky, který všude vypadá stejně a nejde upravit.',
		stepsTitle: 'Jak zploštit PDF',
		steps: [
			'Vyberte PDF.',
			'Zvolte, co zploštit: formulářová pole, komentáře a značky, nebo obojí.',
			'Klikněte na Zploštit PDF a stáhněte výsledek.'
		],
		features: [
			{
				title: 'Všude vypadá stejně',
				text: 'Zploštěné formuláře se tisknou i zobrazují stejně v každém prohlížeči, i v těch, které formulářová pole ignorují.'
			},
			{
				title: 'Brání změnám',
				text: 'Hodnoty už nejde ve formulářových polích měnit, což se hodí před odesláním podepsaného formuláře.'
			},
			{
				title: 'Zpracování u vás',
				text: 'Údaje z formuláře zůstávají ve vašem zařízení — nic se nenahrává.'
			}
		],
		faq: [
			{
				q: 'Co znamená zploštění PDF?',
				a: 'Interaktivní prvky — formulářová pole a anotace — se natrvalo vykreslí do stránky a jejich interaktivní verze se odstraní.'
			},
			{
				q: 'Fungují po zploštění odkazy?',
				a: 'Ano. Odkazy zůstanou; zploští se jen formulářová pole a anotace se značkami.'
			},
			{
				q: 'Jde zploštění vrátit?',
				a: 'Ve zploštěném souboru ne. Pokud budete formulář ještě upravovat, ponechte si originál.'
			}
		]
	},
	metadata: {
		title: 'Upravit metadata PDF online – název a autor',
		description:
			'Zobrazte a změňte metadata PDF: název, autora, předmět, klíčová slova a aplikaci — nebo všechna metadata kvůli soukromí odstraňte. Zdarma, bez nahrávání.',
		h1: 'Upravit metadata PDF',
		lead: 'Podívejte se na skryté vlastnosti dokumentu PDF, změňte je, nebo je před sdílením souboru vymažte.',
		stepsTitle: 'Jak změnit vlastnosti PDF',
		steps: [
			'Vyberte PDF.',
			'Upravte název, autora, předmět, klíčová slova a aplikaci — nebo zaškrtněte Odstranit všechna metadata.',
			'Klikněte na Uložit metadata a stáhněte upravené PDF.'
		],
		features: [
			{
				title: 'Lepší vyhledávání',
				text: 'Správný název a popis pomohou vyhledávačům a dokumentovým systémům vaše PDF zařadit.'
			},
			{
				title: 'Úklid kvůli soukromí',
				text: 'Odstraňte jména autorů, údaje o softwaru a data, která nechcete sdílet.'
			},
			{
				title: 'Bez nahrávání',
				text: 'Metadata se čtou i zapisují jen ve vašem zařízení.'
			}
		],
		faq: [
			{
				q: 'Kde se metadata PDF zobrazují?',
				a: 'Ve vlastnostech dokumentu ve čtečkách PDF, v záložce prohlížeče (název), ve správcích souborů a ve výsledcích vyhledávání.'
			},
			{
				q: 'Co smaže „Odstranit všechna metadata“?',
				a: 'Název, autora, předmět, klíčová slova, aplikaci, producenta, data a skrytý balík metadat XMP.'
			},
			{
				q: 'Změní úprava metadat stránky?',
				a: 'Ne. Mění se jen vlastnosti dokumentu, obsah zůstane stejný.'
			}
		]
	}
};
