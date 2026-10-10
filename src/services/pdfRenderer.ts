import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is configured using our locally hosted worker script
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  lines: string[];
}

/**
 * Loads a PDF document from an ArrayBuffer or Uint8Array
 */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    useSystemFonts: true,
  });
  return await loadingTask.promise;
}

/**
 * Gets the total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await loadPdfDocument(arrayBuffer);
    return pdf.numPages;
  } catch (err) {
    console.warn('Could not read page count via pdfjs-dist:', err);
    return 1;
  }
}

/**
 * Renders a specific page of a PDF onto an HTML5 canvas and returns image data
 */
export async function renderPdfPage(
  pdf: any,
  pageNumber: number,
  scale: number = 2.0,
  format: 'jpg' | 'png' | 'webp' = 'jpg',
  quality: number = 0.92
): Promise<RenderedPageImage> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    throw new Error('Unable to create 2D canvas context for PDF rendering.');
  }

  // Fill pure white background
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || new Blob([], { type: mimeType })),
      mimeType,
      quality
    );
  });

  return {
    pageNumber,
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Renders all pages of a PDF document into real high-resolution images
 */
export async function renderAllPdfPages(
  file: File,
  format: 'jpg' | 'png' | 'webp' = 'jpg',
  quality: number = 0.92,
  scale: number = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await loadPdfDocument(arrayBuffer);
  const total = pdf.numPages;
  const pages: RenderedPageImage[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const rendered = await renderPdfPage(pdf, i, scale, format, quality);
    pages.push(rendered);
  }

  return pages;
}

/**
 * Extracts real text content page by page from a PDF document
 */
export async function extractRealTextFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<{ fullText: string; pages: ExtractedPageText[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await loadPdfDocument(arrayBuffer);
  const total = pdf.numPages;
  const pageTexts: ExtractedPageText[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items by line based on vertical position (transform[5])
    interface TextItem {
      str: string;
      x: number;
      y: number;
      height: number;
    }

    const items: TextItem[] = [];
    for (const rawItem of content.items) {
      if ('str' in rawItem && rawItem.str) {
        const item = rawItem as any;
        items.push({
          str: item.str,
          x: item.transform ? item.transform[4] : 0,
          y: item.transform ? item.transform[5] : 0,
          height: item.height || 12,
        });
      }
    }

    // Sort items vertically (top to bottom), then horizontally (left to right)
    items.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y);
      if (yDiff < 4) {
        // Same line
        return a.x - b.x;
      }
      return b.y - a.y; // PDF Y is bottom-up: higher Y is higher on page
    });

    // Assemble lines
    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of items) {
      if (lastY === null) {
        currentLine = item.str;
        lastY = item.y;
      } else if (Math.abs(item.y - lastY) < 4) {
        // Append to current line with space if needed
        if (currentLine.endsWith(' ') || item.str.startsWith(' ')) {
          currentLine += item.str;
        } else {
          currentLine += ' ' + item.str;
        }
      } else {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = item.str;
        lastY = item.y;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const pageContent = lines.join('\n');
    pageTexts.push({
      pageNumber: i,
      text: pageContent,
      lines,
    });
  }

  const fullText = pageTexts
    .map((p) => `--- PAGE ${p.pageNumber} ---\n` + (p.text.trim() || '[No selectable text on this page]'))
    .join('\n\n');

  return { fullText, pages: pageTexts };
}
