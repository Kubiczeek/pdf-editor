import type { ToolId } from '#lib/tools/registry.ts';
import type { ToolContent, PageLabels } from '#lib/content/types.ts';

export const labelsEn: PageLabels = {
	howTo: 'How it works',
	why: 'Why use this tool',
	faq: 'Frequently asked questions',
	related: 'Related tools',
	breadcrumbHome: 'All PDF tools',
	free: 'Free'
};

export const toolsEn: Record<ToolId, ToolContent> = {
	edit: {
		title: 'Edit PDF Online Free – Change Text & Add Images',
		description:
			'Edit PDF files in your browser: change existing text, add text, images, shapes, highlights and comments. Free, no sign-up, and your file never leaves your device.',
		h1: 'Edit PDF online',
		lead: 'Change existing text, add new text, images, signatures, shapes, highlights and comments — right in your browser, without uploading the file anywhere.',
		stepsTitle: 'How to edit a PDF',
		steps: [
			'Choose the PDF you want to edit, or drop it on this page.',
			'Pick a tool from the toolbar: Edit text to change what’s already there, Add text to type anywhere, or images, shapes, highlights and comments.',
			'Drag items to move them and use the handles to resize. Reorder, rotate or delete pages in the side panel.',
			'Click Download PDF to save the edited document.'
		],
		features: [
			{
				title: 'Private by design',
				text: 'Editing happens on your device. The PDF is never uploaded, so confidential documents stay confidential.'
			},
			{
				title: 'A real editor, not a demo',
				text: 'Replace existing text, add text in several fonts with full Unicode support, insert images, draw, highlight, white out and comment.'
			},
			{
				title: 'Works everywhere',
				text: 'Use it on Windows, macOS, Linux, Android or iPhone in any modern browser. Nothing to install.'
			}
		],
		faq: [
			{
				q: 'Can I change text that is already in the PDF?',
				a: 'Yes. Choose “Edit text” and click a line of text. The original is covered and replaced with editable text in a matching size and colour. It works best on plain backgrounds; on photos or patterns you may want to adjust the cover colour.'
			},
			{
				q: 'Is this PDF editor really free?',
				a: 'Yes. Every feature is free, there are no watermarks, no page limits and no account. The tools run in your browser, so there are no server costs to pass on to you.'
			},
			{
				q: 'Are my files uploaded to a server?',
				a: 'No. The PDF is opened and saved by JavaScript running in your browser. You can even disconnect from the internet after the page has loaded and keep editing.'
			},
			{
				q: 'Which characters and languages are supported?',
				a: 'Added text uses embedded Noto fonts, which cover Latin (including Czech, Polish and other accented letters), Greek and Cyrillic scripts.'
			},
			{
				q: 'Will the edited PDF keep its form fields and links?',
				a: 'Yes. The original document is modified rather than rebuilt, so links, bookmarks and form fields are preserved.'
			}
		]
	},
	sign: {
		title: 'Sign PDF Online Free – Add a Signature to PDF',
		description:
			'Sign PDF documents online for free: draw, type or upload your signature and place it anywhere. No sign-up, no upload — signing happens in your browser.',
		h1: 'Sign a PDF',
		lead: 'Draw your signature with a mouse or finger, type it in a handwriting font or upload a photo of it — then place it on any page.',
		stepsTitle: 'How to sign a PDF',
		steps: [
			'Choose the PDF you need to sign.',
			'Create your signature: draw it, type your name in a handwriting style or upload an image.',
			'Click on the page where the signature belongs, then move and resize it as needed. Add the date or initials with Add text.',
			'Download the signed PDF.'
		],
		features: [
			{
				title: 'Your signature stays with you',
				text: 'The signature and the document are processed only on your device and are never sent to a server.'
			},
			{
				title: 'Three ways to sign',
				text: 'Draw with a mouse, trackpad, pen or finger; type in one of several handwriting fonts; or upload a scan and remove its white background.'
			},
			{
				title: 'Crisp on every page',
				text: 'Drawn signatures are saved as vector paths, so they stay sharp when printed or zoomed.'
			}
		],
		faq: [
			{
				q: 'Is a signature added this way legally binding?',
				a: 'It is a simple electronic signature, which many everyday agreements accept. Some documents require a qualified electronic signature backed by a certificate; check what the recipient needs.'
			},
			{
				q: 'Can I sign on my phone?',
				a: 'Yes. Open this page on your phone, choose the PDF and draw the signature with your finger.'
			},
			{
				q: 'Can I add several signatures or initials?',
				a: 'Yes. Signatures you create stay available while the editor is open, so you can place them on as many pages as you need.'
			},
			{
				q: 'Do you keep a copy of my signature?',
				a: 'No. Nothing is uploaded or stored. When you close the page, the signature is gone.'
			}
		]
	},
	'fill-form': {
		title: 'Fill PDF Forms Online Free – No Sign-up',
		description:
			'Fill in PDF forms online: type into fields, tick checkboxes, choose options and sign. Works with fillable and flat forms. Free and private — no upload.',
		h1: 'Fill in a PDF form',
		lead: 'Type into form fields, tick boxes and pick options. For forms without fields, add text anywhere on the page.',
		stepsTitle: 'How to fill a PDF form',
		steps: [
			'Choose the PDF form.',
			'Click into the highlighted fields and fill them in. On scanned or flat forms, use Add text to type on the page.',
			'Add your signature if the form needs one.',
			'Download the completed PDF.'
		],
		features: [
			{
				title: 'Real form fields',
				text: 'Fillable PDFs keep working: your answers are saved into the form fields, so others can still read or change them.'
			},
			{
				title: 'Flat forms too',
				text: 'No fields? Type text, tick marks and crosses anywhere on the page and line them up exactly.'
			},
			{
				title: 'Nothing leaves your device',
				text: 'Forms often contain personal data. Here they are filled in locally and never uploaded.'
			}
		],
		faq: [
			{
				q: 'How do I know whether my PDF has fillable fields?',
				a: 'When you open the file, the editor tells you how many fillable fields it found and highlights them. If there are none, use Add text.'
			},
			{
				q: 'Can I lock the answers so nobody can change them?',
				a: 'Yes. After downloading, run the file through Flatten PDF to turn the fields into regular page content.'
			},
			{
				q: 'Are accented characters supported in form fields?',
				a: 'Yes. Field appearances are generated with an embedded Unicode font, so names like Dvořák or Łukasz display correctly.'
			}
		]
	},
	watermark: {
		title: 'Add Watermark to PDF Online – Free Tool',
		description:
			'Add a text or image watermark to PDF pages. Choose font, colour, opacity, rotation and position, or tile it across the page. Free, private, no upload.',
		h1: 'Add a watermark to a PDF',
		lead: 'Stamp “Confidential”, “Draft” or your logo onto every page, with full control over size, colour, transparency and angle.',
		stepsTitle: 'How to watermark a PDF',
		steps: [
			'Choose the PDF.',
			'Type the watermark text or pick an image, then set its size, colour, opacity and rotation.',
			'Choose the position — a corner, the centre, or repeated across the page.',
			'Click Add watermark and download the result.'
		],
		features: [
			{
				title: 'Text or logo',
				text: 'Use any text in several fonts, including accented characters, or a PNG/JPG logo with transparency.'
			},
			{
				title: 'Correct on rotated pages',
				text: 'The watermark is placed relative to the page as you see it, even when pages are rotated or landscape.'
			},
			{
				title: 'Stays on your computer',
				text: 'Documents are stamped locally in your browser and never uploaded.'
			}
		],
		faq: [
			{
				q: 'Can I watermark only some pages?',
				a: 'Yes. Choose “Selected pages” and type the page numbers or ranges, for example 1-3, 7.'
			},
			{
				q: 'Can the watermark go behind the text?',
				a: 'Yes, tick “Place behind page content”. Note that on scanned pages the scan itself may cover a watermark placed behind it.'
			},
			{
				q: 'Can someone remove the watermark?',
				a: 'A watermark is added as page content, which makes it harder but not impossible to remove. For stronger protection, also flatten and password-protect the file.'
			}
		]
	},
	'page-numbers': {
		title: 'Add Page Numbers to PDF Online Free',
		description:
			'Number the pages of a PDF online. Pick the position, format (1, Page 1, 1 of 10), font, size and starting number. Free, no sign-up, no upload.',
		h1: 'Add page numbers to a PDF',
		lead: 'Put page numbers in any corner or centred, in the style you need — “1”, “Page 1” or “Page 1 of 10”.',
		stepsTitle: 'How to number PDF pages',
		steps: [
			'Choose the PDF.',
			'Pick where the numbers go and the format you want.',
			'Optionally skip a cover page or start counting from a different number.',
			'Click Add page numbers and download the PDF.'
		],
		features: [
			{
				title: 'Flexible numbering',
				text: 'Start at any number, begin on any page and choose the text around the number.'
			},
			{
				title: 'Looks right on every page',
				text: 'Numbers are positioned on the visible page, so rotated and landscape pages are numbered correctly.'
			},
			{
				title: 'Private and free',
				text: 'Everything runs in your browser — no upload, no account, no watermark.'
			}
		],
		faq: [
			{
				q: 'How do I skip the title page?',
				a: 'Set “Start on page” to 2. If the second page should show number 1, leave “First number” at 1.'
			},
			{
				q: 'Can I use “Page 1 of 10”?',
				a: 'Yes, choose that format. The total counts only the pages that get a number.'
			},
			{
				q: 'Will page numbers cover my content?',
				a: 'Numbers are placed inside the margin you choose. Increase the margin if your document has content close to the edge.'
			}
		]
	},
	redact: {
		title: 'Redact PDF Online Free – Black Out Text',
		description:
			'Permanently black out names, numbers and other sensitive details in a PDF. Redacted pages are flattened so hidden content can’t be recovered. Free, no upload.',
		h1: 'Redact a PDF',
		lead: 'Mark the areas to hide and get a PDF where the information underneath is truly gone — not just covered by a black box.',
		stepsTitle: 'How to redact a PDF',
		steps: [
			'Choose the PDF.',
			'Drag boxes over everything you want to hide, on as many pages as you need.',
			'Click Redact PDF. Each page with a box is turned into an image with the area filled in.',
			'Download the redacted copy and share it instead of the original.'
		],
		features: [
			{
				title: 'True redaction',
				text: 'Text, images and vector graphics under the boxes are removed, not hidden. Copying or searching won’t reveal them.'
			},
			{
				title: 'Only what’s needed changes',
				text: 'Pages without redactions are copied as they are, so their text stays selectable.'
			},
			{
				title: 'Never uploaded',
				text: 'Sensitive documents shouldn’t travel to a stranger’s server. Here they don’t leave your device.'
			}
		],
		faq: [
			{
				q: 'Why can’t I just draw a black rectangle in an editor?',
				a: 'A drawn rectangle only covers the text; the text is still in the file and can be copied out. This tool rebuilds the affected pages as images so the content is actually removed.'
			},
			{
				q: 'What happens to the text on redacted pages?',
				a: 'Redacted pages become images, so their text can no longer be selected or searched. Other pages are unchanged.'
			},
			{
				q: 'Is the document metadata removed too?',
				a: 'Yes. The redacted PDF is a new file and does not carry over the original title, author or other metadata.'
			}
		]
	},
	merge: {
		title: 'Merge PDF Files Online Free – Combine PDFs',
		description:
			'Combine multiple PDF files into one document in the order you want. Drag to reorder, then merge. Free, unlimited, and files never leave your device.',
		h1: 'Merge PDF files',
		lead: 'Combine several PDFs into one document. Drag the files into the right order and merge them in seconds.',
		stepsTitle: 'How to merge PDFs',
		steps: [
			'Choose two or more PDF files, or drop them on this page.',
			'Drag the files into the order you want.',
			'Click Merge PDFs and download the combined document.'
		],
		features: [
			{
				title: 'No limits',
				text: 'Merge as many files and pages as your device can handle. No daily quotas, no file-size caps.'
			},
			{
				title: 'Fast and private',
				text: 'Files are combined in your browser. Nothing is uploaded, so even large documents merge quickly.'
			},
			{
				title: 'Keeps the quality',
				text: 'Pages are copied exactly as they are — text stays text and images aren’t recompressed.'
			}
		],
		faq: [
			{
				q: 'How many PDFs can I merge at once?',
				a: 'There is no fixed limit. Very large jobs are limited only by your device’s memory.'
			},
			{
				q: 'Can I merge password-protected PDFs?',
				a: 'Yes, if you know the password. You’ll be asked for it when adding the file; the merged PDF is not password-protected.'
			},
			{
				q: 'Can I change the order of pages, not just files?',
				a: 'Merge the files first, then use Organize pages to move, rotate or delete individual pages.'
			}
		]
	},
	split: {
		title: 'Split PDF Online Free – Separate PDF Pages',
		description:
			'Split a PDF into several files by page ranges, every N pages, or one file per page. Free, fast and private — the PDF is never uploaded.',
		h1: 'Split a PDF',
		lead: 'Cut one PDF into several smaller files — by page ranges, into equal parts, or one file for every page.',
		stepsTitle: 'How to split a PDF',
		steps: [
			'Choose the PDF you want to split.',
			'Pick how to split it: by ranges such as 1-3, 4-8, every few pages, or every page separately.',
			'Click Split PDF and download the files (several files come as one ZIP).'
		],
		features: [
			{
				title: 'Three ways to split',
				text: 'Custom ranges, fixed-size chunks, or every single page — with a preview of how many files you’ll get.'
			},
			{
				title: 'Lossless',
				text: 'Pages are copied without re-rendering, so text, links on the page and image quality are untouched.'
			},
			{
				title: 'On your device',
				text: 'Splitting happens locally. Your document is never sent anywhere.'
			}
		],
		faq: [
			{
				q: 'How do I extract just a few pages into one file?',
				a: 'Use Extract pages, or enter a single range here, such as 5-9.'
			},
			{
				q: 'What does “8-” mean in a range?',
				a: 'It means from page 8 to the end of the document. “-3” means from the first page to page 3.'
			},
			{
				q: 'Why do I get a ZIP file?',
				a: 'When a split produces several PDFs, they are packed into one ZIP so you can download them together. You can also download each file separately.'
			}
		]
	},
	organize: {
		title: 'Organize PDF Pages Online – Reorder & Delete',
		description:
			'Rearrange PDF pages by drag and drop, rotate or delete them, duplicate pages, add blank pages or insert another PDF. Free and private, no upload needed.',
		h1: 'Organize PDF pages',
		lead: 'See every page as a thumbnail, then drag to reorder, rotate, delete, duplicate or insert pages from another PDF.',
		stepsTitle: 'How to reorder PDF pages',
		steps: [
			'Choose the PDF.',
			'Drag thumbnails to change the order. Select pages to rotate, duplicate or delete them.',
			'Add blank pages or insert pages from another PDF where you need them.',
			'Click Save PDF to download the reorganised document.'
		],
		features: [
			{
				title: 'Everything in one view',
				text: 'Reorder, rotate, delete, duplicate and insert pages without switching between tools.'
			},
			{
				title: 'Keeps your document intact',
				text: 'Form fields, links and metadata of the original PDF are preserved.'
			},
			{
				title: 'Touch-friendly',
				text: 'Drag and drop works with a mouse and on tablets and phones.'
			}
		],
		faq: [
			{
				q: 'Can I combine pages from two PDFs?',
				a: 'Yes. Click “Insert PDF” to add another file’s pages, then drag them where they belong.'
			},
			{
				q: 'How do I select several pages?',
				a: 'Click pages to select them; click again to deselect. Then use the buttons above the pages.'
			},
			{
				q: 'Is the original file changed?',
				a: 'No. You download a new PDF; the file on your computer stays as it was.'
			}
		]
	},
	rotate: {
		title: 'Rotate PDF Pages Online Free – Save Rotation',
		description:
			'Rotate PDF pages permanently: turn all pages or only selected ones by 90° or 180° and save. Free, works on any device, and nothing is uploaded.',
		h1: 'Rotate PDF pages',
		lead: 'Turn sideways or upside-down pages the right way up and save the rotation permanently.',
		stepsTitle: 'How to rotate a PDF',
		steps: [
			'Choose the PDF.',
			'Select the pages to turn, or leave nothing selected to rotate them all.',
			'Rotate left or right until every page looks right, then click Save rotated PDF.'
		],
		features: [
			{
				title: 'Permanent rotation',
				text: 'The rotation is saved in the file, so the pages open correctly in every viewer.'
			},
			{
				title: 'No quality loss',
				text: 'Rotation only changes how the page is displayed — content is not re-rendered or compressed.'
			},
			{
				title: 'Private',
				text: 'Your PDF is rotated in the browser and never uploaded.'
			}
		],
		faq: [
			{
				q: 'Can I rotate just one page?',
				a: 'Yes. Click the page to select it and use the rotate buttons. Unselected pages stay as they are.'
			},
			{
				q: 'Why does my PDF open rotated again in another app?',
				a: 'Some viewers only rotate the view temporarily. This tool writes the rotation into the PDF so it sticks everywhere.'
			},
			{
				q: 'Does rotating reduce quality?',
				a: 'No. Text and images are kept exactly as they are.'
			}
		]
	},
	'delete-pages': {
		title: 'Delete Pages from PDF Online Free',
		description:
			'Remove unwanted pages from a PDF: click the pages or type page numbers, then save. Free, quick, and your document never leaves your device.',
		h1: 'Delete pages from a PDF',
		lead: 'Remove blank, duplicate or unneeded pages and keep the rest of the document exactly as it was.',
		stepsTitle: 'How to remove pages from a PDF',
		steps: [
			'Choose the PDF.',
			'Click the pages you want to delete, or type their numbers such as 2, 5-7.',
			'Click Delete pages and download the shorter PDF.'
		],
		features: [
			{
				title: 'See what you remove',
				text: 'Thumbnails make it easy to spot blank or duplicate pages before deleting them.'
			},
			{
				title: 'Everything else stays',
				text: 'The remaining pages keep their text, links and form fields.'
			},
			{
				title: 'Nothing uploaded',
				text: 'Pages are removed by your browser, not on a server.'
			}
		],
		faq: [
			{
				q: 'Can I undo a deletion?',
				a: 'Your original file is never changed. If you removed the wrong page, simply start again with the original.'
			},
			{
				q: 'Can I delete pages from a protected PDF?',
				a: 'Yes, after entering its password. The result is saved without the password.'
			},
			{
				q: 'How do I keep only a few pages instead?',
				a: 'Use Extract pages — select the pages to keep and save them as a new PDF.'
			}
		]
	},
	'extract-pages': {
		title: 'Extract Pages from PDF Online Free',
		description:
			'Pick pages from a PDF and save them as a new document, or as separate PDFs. Select with a click or type page ranges. Free and private, no upload.',
		h1: 'Extract pages from a PDF',
		lead: 'Select the pages you need and save them as a new PDF — or as one PDF per page.',
		stepsTitle: 'How to extract PDF pages',
		steps: [
			'Choose the PDF.',
			'Click the pages to keep or type ranges such as 1-3, 10.',
			'Choose whether to create one PDF or a separate file for each page, then click Extract pages.'
		],
		features: [
			{
				title: 'Pick visually or by number',
				text: 'Select pages on thumbnails or type ranges — both stay in sync.'
			},
			{
				title: 'One file or many',
				text: 'Save the selection as a single PDF or as separate files packed in a ZIP.'
			},
			{
				title: 'Stays local',
				text: 'The document is processed by your browser and never uploaded.'
			}
		],
		faq: [
			{
				q: 'Are extracted pages kept in their original order?',
				a: 'Yes, pages are saved in document order. To change the order, use Organize pages afterwards.'
			},
			{
				q: 'Does extracting reduce the quality?',
				a: 'No. Pages are copied exactly, without re-rendering.'
			},
			{
				q: 'What is the difference from Split PDF?',
				a: 'Extract creates a document from the pages you choose. Split divides the whole document into several parts.'
			}
		]
	},
	crop: {
		title: 'Crop PDF Online Free – Trim PDF Margins',
		description:
			'Crop PDF pages online: drag a frame to set the visible area, detect white margins automatically and apply to one or all pages. Free, no upload.',
		h1: 'Crop a PDF',
		lead: 'Trim white margins or cut pages down to the part that matters, on one page or across the whole document.',
		stepsTitle: 'How to crop a PDF',
		steps: [
			'Choose the PDF.',
			'Drag the frame on the page preview, or let the tool detect the margins.',
			'Apply the crop to all pages or only the current one, then click Crop PDF.'
		],
		features: [
			{
				title: 'Automatic margin detection',
				text: 'One click finds the content area and removes surrounding whitespace.'
			},
			{
				title: 'Precise control',
				text: 'Drag the frame’s edges and corners to set exactly what stays visible.'
			},
			{
				title: 'Local processing',
				text: 'The PDF is cropped in your browser — it is never uploaded.'
			}
		],
		faq: [
			{
				q: 'Is the cropped content deleted?',
				a: 'No. Cropping hides the area outside the frame, as in Acrobat. To remove information permanently, use Redact PDF.'
			},
			{
				q: 'Can I crop pages differently?',
				a: 'Yes. Choose “Only this page”, crop it, and repeat for other pages before saving.'
			},
			{
				q: 'Will the page size change when printing?',
				a: 'Yes, the cropped area becomes the new page size, so the page prints without the removed margins.'
			}
		]
	},
	'pdf-to-jpg': {
		title: 'PDF to JPG Converter Online Free – High Quality',
		description:
			'Convert PDF pages to JPG images in high resolution (up to 300 DPI). Convert all pages or a selection and download them as a ZIP. Free, no upload.',
		h1: 'Convert PDF to JPG',
		lead: 'Turn every page — or just the ones you pick — into a JPG image, at screen or print resolution.',
		stepsTitle: 'How to convert PDF to JPG',
		steps: [
			'Choose the PDF.',
			'Pick the resolution and image quality, and which pages to convert.',
			'Click Convert to JPG and download the images.'
		],
		features: [
			{
				title: 'Print-ready resolution',
				text: 'Choose 72, 150 or 300 DPI. Higher settings give sharper text and detail.'
			},
			{
				title: 'Accurate rendering',
				text: 'Pages are drawn with Mozilla’s PDF.js engine, the same one Firefox uses to display PDFs.'
			},
			{
				title: 'No upload',
				text: 'Images are created on your device, which is faster and keeps the document private.'
			}
		],
		faq: [
			{
				q: 'Should I choose JPG or PNG?',
				a: 'JPG gives smaller files and suits photos and scans. PNG is lossless and better for text, diagrams and screenshots — use PDF to PNG for that.'
			},
			{
				q: 'Can I convert only one page?',
				a: 'Yes. Choose “Selected pages” and type the page number.'
			},
			{
				q: 'What resolution should I use?',
				a: '150 DPI is good for screens and documents; 300 DPI for printing or zooming in on details.'
			}
		]
	},
	'pdf-to-png': {
		title: 'PDF to PNG Converter Online Free',
		description:
			'Convert PDF pages to lossless PNG images with sharp text, up to 300 DPI. Pick pages, download single images or a ZIP. Free and private, no upload.',
		h1: 'Convert PDF to PNG',
		lead: 'Get lossless PNG images of your PDF pages — ideal for slides, diagrams, screenshots and anything with fine text.',
		stepsTitle: 'How to convert PDF to PNG',
		steps: [
			'Choose the PDF.',
			'Select the resolution and the pages to convert.',
			'Click Convert to PNG and download the images.'
		],
		features: [
			{
				title: 'Lossless quality',
				text: 'PNG keeps every pixel crisp, with no compression artefacts around text and lines.'
			},
			{
				title: 'Choose the pages',
				text: 'Convert the whole document or only the pages you need.'
			},
			{
				title: 'Stays on your device',
				text: 'The conversion runs in your browser; your PDF is never uploaded.'
			}
		],
		faq: [
			{
				q: 'Why are PNG files bigger than JPG?',
				a: 'PNG compresses without losing detail. For photos or scans, JPG is usually a better trade-off.'
			},
			{
				q: 'Do PNGs have a transparent background?',
				a: 'No, pages are rendered on white like they appear in a PDF viewer.'
			},
			{
				q: 'Can I convert many pages at once?',
				a: 'Yes. All images are packed into one ZIP file, or you can download them one by one.'
			}
		]
	},
	'jpg-to-pdf': {
		title: 'JPG to PDF Converter Online Free – Images to PDF',
		description:
			'Convert JPG, PNG, WebP and other images to one PDF. Reorder images, choose page size, orientation and margins. Free, no sign-up, no upload.',
		h1: 'Convert JPG to PDF',
		lead: 'Turn photos, scans and screenshots into a single PDF, one image per page, in the order you choose.',
		stepsTitle: 'How to convert images to PDF',
		steps: [
			'Choose your images — JPG, PNG, WebP, GIF and BMP are supported.',
			'Drag them into the right order and choose page size, orientation and margins.',
			'Click Create PDF and download it.'
		],
		features: [
			{
				title: 'Photos the right way up',
				text: 'Phone photos are rotated according to their orientation data, so nothing ends up sideways.'
			},
			{
				title: 'Original quality',
				text: 'JPG and PNG images are embedded without recompression.'
			},
			{
				title: 'Private',
				text: 'Your pictures are converted on your device and never uploaded.'
			}
		],
		faq: [
			{
				q: 'Can I put several images into one PDF?',
				a: 'Yes, that is the default: every image becomes one page of the same PDF.'
			},
			{
				q: 'Which page size should I choose?',
				a: '“Same as image” makes each page fit its picture. Choose A4 or Letter if you plan to print.'
			},
			{
				q: 'Are HEIC photos from iPhone supported?',
				a: 'Only in browsers that can open HEIC (such as Safari). Elsewhere, export the photos as JPG first.'
			}
		]
	},
	'pdf-to-text': {
		title: 'PDF to Text Online Free – Extract Text from PDF',
		description:
			'Extract all text from a PDF and copy it or download it as a .txt file. Keeps line breaks, works offline in your browser. Free, no upload.',
		h1: 'Convert PDF to text',
		lead: 'Pull the text out of a PDF to copy it into an email, a document or a translator.',
		stepsTitle: 'How to extract text from a PDF',
		steps: [
			'Choose the PDF.',
			'Click Extract text.',
			'Copy the text or download it as a .txt file.'
		],
		features: [
			{
				title: 'Clean plain text',
				text: 'Text is extracted page by page with line breaks preserved.'
			},
			{
				title: 'Any length',
				text: 'Works for short letters and books with hundreds of pages.'
			},
			{
				title: 'Never uploaded',
				text: 'Extraction runs in your browser, so the document stays private.'
			}
		],
		faq: [
			{
				q: 'Why is no text found in my PDF?',
				a: 'Scanned PDFs contain pictures of pages rather than text. Those need OCR (text recognition), which this tool does not do.'
			},
			{
				q: 'Is formatting kept?',
				a: 'You get plain text with line breaks. Fonts, colours and tables are not preserved.'
			},
			{
				q: 'Can I extract text from a protected PDF?',
				a: 'Yes, after entering the password to open it.'
			}
		]
	},
	compress: {
		title: 'Compress PDF Online Free – Reduce PDF Size',
		description:
			'Make PDF files smaller by optimising images and removing unused data. Choose the compression level and see the saving. Free, private, no upload.',
		h1: 'Compress a PDF',
		lead: 'Reduce the file size of a PDF so it fits email attachments and upload limits — while keeping it readable.',
		stepsTitle: 'How to compress a PDF',
		steps: [
			'Choose the PDF you want to shrink.',
			'Pick a compression level: Light, Recommended, Strong, or Maximum.',
			'Click Compress PDF and download the smaller file.'
		],
		features: [
			{
				title: 'Smart image optimisation',
				text: 'Oversized photos are scaled to a sensible resolution and re-encoded; text and vector graphics stay sharp.'
			},
			{
				title: 'Removes dead weight',
				text: 'Unused objects, old revisions and embedded thumbnails are dropped automatically.'
			},
			{
				title: 'Compressed locally',
				text: 'Your PDF is optimised in the browser. It is never uploaded to a server.'
			}
		],
		faq: [
			{
				q: 'How much smaller will my PDF get?',
				a: 'It depends on the content. PDFs full of photos or scans often shrink by 50–90 %. Text-only PDFs are usually already small.'
			},
			{
				q: 'Will the text still be selectable?',
				a: 'Yes, at the Light, Recommended and Strong levels. Only the Maximum level turns pages into images.'
			},
			{
				q: 'What if the PDF doesn’t get smaller?',
				a: 'Then it was already well optimised. You’ll be told, and you can try a stronger level.'
			}
		]
	},
	protect: {
		title: 'Password Protect PDF Online Free – AES-256',
		description:
			'Encrypt a PDF with a password using AES-256. Optionally restrict printing, copying and editing. Free, and the file is encrypted in your browser.',
		h1: 'Protect a PDF with a password',
		lead: 'Lock a PDF so only people with the password can open it, and decide whether they may print, copy or edit it.',
		stepsTitle: 'How to password-protect a PDF',
		steps: [
			'Choose the PDF.',
			'Enter a password twice and choose what readers may do.',
			'Click Protect PDF and download the encrypted file.'
		],
		features: [
			{
				title: 'Strong encryption',
				text: 'Files are encrypted with AES-256, the strongest standard PDF encryption, supported by all current readers.'
			},
			{
				title: 'Control permissions',
				text: 'Allow or block printing, copying, editing and commenting.'
			},
			{
				title: 'Your password stays secret',
				text: 'Encryption happens on your device, so neither the file nor the password is sent anywhere.'
			}
		],
		faq: [
			{
				q: 'What if I forget the password?',
				a: 'It cannot be recovered — that is the point of encryption. Keep a copy of the password, or of the unprotected file, in a safe place.'
			},
			{
				q: 'Do permission restrictions really work?',
				a: 'Reputable PDF readers respect them, but they are not as strong as the open password. Use the open password to keep content private.'
			},
			{
				q: 'Which apps can open the protected PDF?',
				a: 'All modern PDF readers, including Adobe Acrobat Reader, browsers, macOS Preview and mobile viewers.'
			}
		]
	},
	unlock: {
		title: 'Unlock PDF Online Free – Remove PDF Password',
		description:
			'Remove the password and restrictions from a PDF you can open. Enter the password once and download an unlocked copy. Free, private, no upload.',
		h1: 'Unlock a PDF',
		lead: 'Tired of typing the password every time? Enter it once and save a copy without the password and restrictions.',
		stepsTitle: 'How to remove a PDF password',
		steps: [
			'Choose the protected PDF.',
			'Enter its password when asked.',
			'Click Unlock PDF and download the unlocked copy.'
		],
		features: [
			{
				title: 'Removes restrictions too',
				text: 'Printing, copying and editing restrictions are lifted along with the open password.'
			},
			{
				title: 'Identical content',
				text: 'Only the encryption is removed — pages, text and images stay exactly the same.'
			},
			{
				title: 'Stays on your device',
				text: 'The file is decrypted in your browser; the password is never transmitted.'
			}
		],
		faq: [
			{
				q: 'Can you unlock a PDF without the password?',
				a: 'No. This tool removes protection from files you are able to open. It does not crack passwords.'
			},
			{
				q: 'My PDF opens without a password but I can’t print it. Can this help?',
				a: 'Yes. Such files only have permission restrictions; this tool removes them without needing a password.'
			},
			{
				q: 'Is it legal to remove a PDF password?',
				a: 'Removing protection from your own documents, or ones you have permission to use, is fine. Respect other people’s rights.'
			}
		]
	},
	flatten: {
		title: 'Flatten PDF Online Free – Forms & Annotations',
		description:
			'Flatten a PDF so form fields, comments, highlights and stamps become part of the page and can’t be changed. Free, no sign-up, no upload.',
		h1: 'Flatten a PDF',
		lead: 'Turn filled-in form fields, comments and markup into ordinary page content that looks the same everywhere and can’t be edited.',
		stepsTitle: 'How to flatten a PDF',
		steps: [
			'Choose the PDF.',
			'Choose what to flatten: form fields, comments and markup, or both.',
			'Click Flatten PDF and download the result.'
		],
		features: [
			{
				title: 'Looks the same everywhere',
				text: 'Flattened forms print and display identically in every viewer, including ones that ignore form fields.'
			},
			{
				title: 'Prevents changes',
				text: 'Values can no longer be edited in a form field, which is useful before sending a signed form.'
			},
			{
				title: 'Processed locally',
				text: 'Your form data stays on your device — nothing is uploaded.'
			}
		],
		faq: [
			{
				q: 'What does flattening a PDF mean?',
				a: 'Interactive elements — form fields and annotations — are drawn permanently onto the page and the interactive versions are removed.'
			},
			{
				q: 'Do links still work after flattening?',
				a: 'Yes. Links are kept; only form fields and markup annotations are flattened.'
			},
			{
				q: 'Can I undo flattening?',
				a: 'Not in the flattened file. Keep the original if you might need to edit the form again.'
			}
		]
	},
	metadata: {
		title: 'Edit PDF Metadata Online – Title, Author, Keywords',
		description:
			'View and change PDF metadata: title, author, subject, keywords and creator — or remove all metadata for privacy. Free, private, no upload.',
		h1: 'Edit PDF metadata',
		lead: 'See the hidden document properties of a PDF, change them, or wipe them before sharing the file.',
		stepsTitle: 'How to change PDF properties',
		steps: [
			'Choose the PDF.',
			'Edit the title, author, subject, keywords and creator — or tick Remove all metadata.',
			'Click Save metadata and download the updated PDF.'
		],
		features: [
			{
				title: 'Better search results',
				text: 'A proper title and description help search engines and document systems index your PDFs.'
			},
			{
				title: 'Privacy clean-up',
				text: 'Remove author names, software details and dates you don’t want to share.'
			},
			{
				title: 'No upload',
				text: 'Metadata is read and written on your device only.'
			}
		],
		faq: [
			{
				q: 'Where is PDF metadata shown?',
				a: 'In the document properties of PDF readers, in browser tabs (the title), in file managers and in search engine results.'
			},
			{
				q: 'What does “Remove all metadata” delete?',
				a: 'Title, author, subject, keywords, creator, producer, dates, and the hidden XMP metadata packet.'
			},
			{
				q: 'Does editing metadata change the pages?',
				a: 'No. Only the document properties change; the content stays the same.'
			}
		]
	}
};
