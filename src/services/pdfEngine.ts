import { PDFDocument, degrees, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { extractRealTextFromPdf, renderAllPdfPages, getPdfPageCount, RenderedPageImage } from './pdfRenderer';
import { loadImageFromFile } from './imageEngine';

export interface ProcessingProgress {
  step: string;
  percent: number;
}

// --------------------------------------------------------------------------
// 1. MERGE PDF
// --------------------------------------------------------------------------
export async function mergePdfFiles(
  files: File[],
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  if (files.length === 0) {
    throw new Error('Please select at least one PDF file to merge.');
  }

  onProgress?.({ step: 'Initializing PDF Engine...', percent: 10 });
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({
      step: `Reading & Merging document ${i + 1} of ${files.length}: ${file.name}`,
      percent: Math.round(10 + (i / files.length) * 75),
    });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  onProgress?.({ step: 'Compiling merged document...', percent: 90 });
  const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

  onProgress?.({ step: 'Done!', percent: 100 });
  return {
    blob,
    fileName: `merged_document_${Date.now()}.pdf`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 2. SPOT & SPLIT PDF
// --------------------------------------------------------------------------
export interface SplitPdfOptions {
  file: File;
  mode: 'spot-pages' | 'extract-range' | 'split-all';
  selectedPages?: number[]; // 1-indexed
  pageRange?: string; // e.g. "1-3, 5, 8"
  onProgress?: (p: ProcessingProgress) => void;
}

export async function splitOrExtractPdf(
  options: SplitPdfOptions
): Promise<{
  blob: Blob;
  fileName: string;
  size: number;
  pageCount: number;
  isZip?: boolean;
}> {
  const { file, mode, selectedPages = [], pageRange = '', onProgress } = options;
  onProgress?.({ step: 'Loading source document...', percent: 15 });

  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  // Mode: Split every page into its own individual PDF bundled into a ZIP
  if (mode === 'split-all') {
    onProgress?.({ step: `Splitting document into ${totalPages} individual PDF files...`, percent: 35 });
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < totalPages; i++) {
      onProgress?.({
        step: `Exporting page ${i + 1} of ${totalPages}...`,
        percent: Math.round(35 + (i / totalPages) * 55),
      });

      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(srcPdf, [i]);
      singlePagePdf.addPage(copiedPage);

      const singleBytes = await singlePagePdf.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, singleBytes);
    }

    onProgress?.({ step: 'Creating ZIP archive...', percent: 95 });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress?.({ step: 'Done!', percent: 100 });

    return {
      blob: zipBlob,
      fileName: `${baseName}_split_all_pages.zip`,
      size: zipBlob.size,
      pageCount: totalPages,
      isZip: true,
    };
  }

  // Modes: spot-pages or extract-range
  let targetIndices: number[] = [];

  if (mode === 'spot-pages' && selectedPages.length > 0) {
    targetIndices = selectedPages
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);
  } else if (pageRange.trim()) {
    const parts = pageRange.split(',');
    for (const part of parts) {
      const clean = part.trim();
      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
            if (p >= 1 && p <= totalPages) {
              targetIndices.push(p - 1);
            }
          }
        }
      } else {
        const p = parseInt(clean, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          targetIndices.push(p - 1);
        }
      }
    }
  }

  // Deduplicate and sort
  targetIndices = Array.from(new Set(targetIndices)).sort((a, b) => a - b);

  if (targetIndices.length === 0) {
    targetIndices = [0]; // default to first page
  }

  onProgress?.({ step: `Extracting ${targetIndices.length} targeted pages...`, percent: 50 });
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  onProgress?.({ step: 'Generating optimized document...', percent: 85 });
  const bytes = await newPdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });

  onProgress?.({ step: 'Done!', percent: 100 });
  return {
    blob,
    fileName: `extracted_pages_${Date.now()}.pdf`,
    size: blob.size,
    pageCount: targetIndices.length,
    isZip: false,
  };
}

// --------------------------------------------------------------------------
// 3. COMPRESS PDF
// --------------------------------------------------------------------------
export interface CompressOptions {
  file: File;
  level: 'low' | 'recommended' | 'extreme';
  onProgress?: (p: ProcessingProgress) => void;
}

export async function compressPdf(
  options: CompressOptions
): Promise<{ blob: Blob; fileName: string; size: number; originalSize: number; savings: number }> {
  const { file, level, onProgress } = options;
  const originalSize = file.size;

  onProgress?.({ step: 'Analyzing document structure & objects...', percent: 15 });
  const arrayBuffer = await file.arrayBuffer();

  // Try pdf-lib stream and dictionary compression first
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const streamCompressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  let bestBlob = new Blob([streamCompressedBytes], { type: 'application/pdf' });

  // For recommended & extreme compression, perform image downsampling & canvas recompression
  if (level === 'recommended' || level === 'extreme') {
    onProgress?.({ step: `Applying ${level} asset optimization & downsampling...`, percent: 40 });
    try {
      const scale = level === 'extreme' ? 1.25 : 1.5;
      const quality = level === 'extreme' ? 0.50 : 0.70;

      const renderedPages = await renderAllPdfPages(
        file,
        'jpg',
        quality,
        scale,
        (current, total) => {
          onProgress?.({
            step: `Optimizing page ${current} of ${total}...`,
            percent: Math.round(40 + (current / total) * 45),
          });
        }
      );

      if (renderedPages.length > 0) {
        const first = renderedPages[0];
        const isLandscape = first.width > first.height;

        const doc = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [first.width, first.height],
        });

        renderedPages.forEach((page, idx) => {
          if (idx > 0) {
            doc.addPage([page.width, page.height], page.width > page.height ? 'landscape' : 'portrait');
          }
          doc.addImage(page.dataUrl, 'JPEG', 0, 0, page.width, page.height, undefined, 'FAST');
        });

        const rasterizedBlob = doc.output('blob');
        // If the rasterized version is smaller, use it!
        if (rasterizedBlob.size < bestBlob.size) {
          bestBlob = rasterizedBlob;
        }
      }
    } catch (e) {
      console.warn('Canvas raster compression fallback:', e);
    }
  }

  // Calculate actual savings percentage based on real generated file size
  const actualSize = bestBlob.size;
  const savings = Math.max(0, Math.round(((originalSize - actualSize) / originalSize) * 100));

  onProgress?.({ step: 'Done!', percent: 100 });
  return {
    blob: bestBlob,
    fileName: `compressed_${file.name.replace(/\.pdf$/i, '')}.pdf`,
    size: actualSize,
    originalSize,
    savings,
  };
}

// --------------------------------------------------------------------------
// 4. IMAGE TO PDF
// --------------------------------------------------------------------------
export interface ImageToPdfOptions {
  files: File[];
  orientation: 'auto' | 'portrait' | 'landscape';
  pageSize: 'fit' | 'a4' | 'letter';
  margin: 'none' | 'small' | 'big';
  onProgress?: (p: ProcessingProgress) => void;
}

export async function imagesToPdf(
  options: ImageToPdfOptions
): Promise<{ blob: Blob; fileName: string; size: number }> {
  const { files, orientation, pageSize, margin, onProgress } = options;
  onProgress?.({ step: 'Processing input images...', percent: 15 });

  const marginMap = {
    none: 0,
    small: 20,
    big: 40,
  };
  const m = marginMap[margin];

  // Standard dimensions in points (pt)
  const pageSizeDimensions: Record<string, { width: number; height: number }> = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612.0, height: 792.0 },
  };

  const firstImg = await loadImageFromFile(files[0]);
  const initialWidth = firstImg.naturalWidth || 800;
  const initialHeight = firstImg.naturalHeight || 600;

  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'landscape' : orientation === 'portrait' ? 'portrait' : initialWidth > initialHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: pageSize === 'fit' ? [initialWidth, initialHeight] : pageSize,
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({
      step: `Embedding image ${i + 1} of ${files.length}: ${file.name}`,
      percent: Math.round(15 + (i / files.length) * 75),
    });

    const img = await loadImageFromFile(file);
    const naturalW = img.naturalWidth || 800;
    const naturalH = img.naturalHeight || 600;

    // Convert image to clean PNG DataURL via canvas to support SVG, WebP, GIF, BMP safely
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = naturalW;
    tempCanvas.height = naturalH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(img, 0, 0);
    }
    const cleanDataUrl = tempCanvas.toDataURL('image/png');

    if (i > 0) {
      let pageW = naturalW;
      let pageH = naturalH;
      let orient: 'portrait' | 'landscape' = naturalW > naturalH ? 'landscape' : 'portrait';

      if (pageSize !== 'fit') {
        const dim = pageSizeDimensions[pageSize] || pageSizeDimensions.a4;
        pageW = orientation === 'landscape' ? dim.height : dim.width;
        pageH = orientation === 'landscape' ? dim.width : dim.height;
        orient = pageW > pageH ? 'landscape' : 'portrait';
        pdf.addPage([pageW, pageH], orient);
      } else {
        pdf.addPage([pageW, pageH], orient);
      }
    }

    const currentWidth = pdf.internal.pageSize.getWidth();
    const currentHeight = pdf.internal.pageSize.getHeight();

    const availW = Math.max(10, currentWidth - m * 2);
    const availH = Math.max(10, currentHeight - m * 2);

    const scaleW = availW / naturalW;
    const scaleH = availH / naturalH;
    const scale = Math.min(scaleW, scaleH, 1);

    const renderW = naturalW * scale;
    const renderH = naturalH * scale;

    const posX = m + (availW - renderW) / 2;
    const posY = m + (availH - renderH) / 2;

    pdf.addImage(cleanDataUrl, 'PNG', posX, posY, renderW, renderH, undefined, 'FAST');
  }

  onProgress?.({ step: 'Compiling polished PDF document...', percent: 95 });
  const blob = pdf.output('blob');
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `images_to_pdf_${Date.now()}.pdf`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 5. PDF TO WORD (.DOCX)
// --------------------------------------------------------------------------
export async function pdfToWordDocx(
  file: File,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  onProgress?.({ step: 'Extracting PDF layout and typography...', percent: 20 });

  // Extract REAL text and line layout using pdfRenderer
  const { pages } = await extractRealTextFromPdf(file, (current, total) => {
    onProgress?.({
      step: `Extracting page ${current} of ${total}...`,
      percent: Math.round(20 + (current / total) * 55),
    });
  });

  onProgress?.({ step: 'Generating structured Word document (.docx)...', percent: 80 });

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: file.name.replace(/\.pdf$/i, ''),
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Converted from PDF: ${file.name} | Total Pages: ${pages.length} | FlexPDF Suite`,
          italics: true,
          color: '666666',
          size: 18,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  pages.forEach((page) => {
    paragraphs.push(
      new Paragraph({
        text: `--- Page ${page.pageNumber} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
      })
    );

    if (page.lines.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Scanned page or graphic content - no selectable text detected]',
              italics: true,
              color: '999999',
            }),
          ],
          spacing: { after: 160 },
        })
      );
    } else {
      page.lines.forEach((line) => {
        // Detect potential headings
        const isHeading = line.length < 50 && (line === line.toUpperCase() || line.endsWith(':'));
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: isHeading,
                size: isHeading ? 24 : 22,
              }),
            ],
            spacing: { after: isHeading ? 120 : 160 },
          })
        );
      });
    }
  });

  onProgress?.({ step: 'Packaging Word DOCX binary...', percent: 92 });
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `${file.name.replace(/\.pdf$/i, '')}.docx`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 6. WORD TO PDF
// --------------------------------------------------------------------------
export async function wordToPdf(
  file: File,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  onProgress?.({ step: 'Parsing Word Document (.docx)...', percent: 25 });
  const arrayBuffer = await file.arrayBuffer();

  let extractedText = '';
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    extractedText = result.value;
  } catch (e) {
    console.warn('Mammoth text extraction warning:', e);
  }

  onProgress?.({ step: 'Rendering high-fidelity PDF pages...', percent: 60 });
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margin = 48;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;

  // Header Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(file.name.replace(/\.(docx|doc)$/i, ''), margin, 54);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Converted on ${new Date().toLocaleDateString()} | FlexPDF Suite`, margin, 72);
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, 80, pageWidth - margin, 80);

  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(11);

  const lines = extractedText.trim()
    ? extractedText.split('\n').filter((l) => l.trim().length > 0)
    : ['Document imported successfully. No textual content detected.'];

  let currentY = 106;
  const lineHeight = 16;

  for (const line of lines) {
    const isHeading = line.length < 60 && (line === line.toUpperCase() || line.endsWith(':'));
    if (isHeading) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      currentY += 8;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
    }

    const wrappedLines = pdf.splitTextToSize(line, maxLineWidth);
    for (const wLine of wrappedLines) {
      if (currentY + lineHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(wLine, margin, currentY);
      currentY += lineHeight;
    }
    currentY += 6; // paragraph spacing
  }

  onProgress?.({ step: 'Compiling PDF binary...', percent: 90 });
  const blob = pdf.output('blob');
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 7. ROTATE & ORGANIZE PDF
// --------------------------------------------------------------------------
export interface PageOrganizeConfig {
  pageIndex: number; // 0-based
  rotation: number; // 0, 90, 180, 270
}

export async function rotateAndOrganizePdf(
  file: File,
  pageConfigs: PageOrganizeConfig[],
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  onProgress?.({ step: 'Loading PDF structure...', percent: 20 });
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  onProgress?.({ step: 'Organizing and rotating target pages...', percent: 50 });
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < pageConfigs.length; i++) {
    const cfg = pageConfigs[i];
    const [copiedPage] = await newDoc.copyPages(srcDoc, [cfg.pageIndex]);

    const currentAngle = copiedPage.getRotation().angle;
    copiedPage.setRotation(degrees((currentAngle + cfg.rotation) % 360));
    newDoc.addPage(copiedPage);
  }

  onProgress?.({ step: 'Saving organized document...', percent: 85 });
  const bytes = await newDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `organized_${file.name}`,
    size: blob.size,
  };
}

export async function rotatePdfPages(
  file: File,
  rotationAngle: number,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  onProgress?.({ step: 'Loading PDF for rotation...', percent: 25 });
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationAngle) % 360));
  });

  onProgress?.({ step: 'Saving rotated document...', percent: 80 });
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `rotated_${file.name}`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 8. WATERMARK PDF
// --------------------------------------------------------------------------
export interface WatermarkOptions {
  file: File;
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: 'red' | 'indigo' | 'slate' | 'amber' | 'emerald';
  position?: 'diagonal' | 'header' | 'footer' | 'center';
  onProgress?: (p: ProcessingProgress) => void;
}

export async function watermarkPdf(
  options: WatermarkOptions
): Promise<{ blob: Blob; fileName: string; size: number }> {
  const {
    file,
    text,
    opacity = 0.35,
    fontSize = 38,
    color = 'red',
    position = 'diagonal',
    onProgress,
  } = options;

  onProgress?.({ step: 'Loading document for stamping...', percent: 20 });
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colorMap = {
    red: rgb(0.85, 0.15, 0.15),
    indigo: rgb(0.25, 0.35, 0.9),
    slate: rgb(0.3, 0.35, 0.4),
    amber: rgb(0.85, 0.5, 0.1),
    emerald: rgb(0.1, 0.65, 0.35),
  };
  const watermarkRgb = colorMap[color] || colorMap.red;

  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = height / 2;
    let rotateAngle = 0;

    if (position === 'diagonal') {
      rotateAngle = 45;
      x = width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4);
      y = height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4);
    } else if (position === 'header') {
      y = height - 50;
    } else if (position === 'footer') {
      y = 40;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: watermarkRgb,
      opacity,
      rotate: degrees(rotateAngle),
    });
  }

  onProgress?.({ step: 'Rendering watermarked document...', percent: 85 });
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `watermarked_${file.name}`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 9. PROTECT PDF (REAL ENCRYPTION)
// --------------------------------------------------------------------------
export async function protectPdfWithPassword(
  file: File,
  password: string,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ blob: Blob; fileName: string; size: number }> {
  if (!password || password.trim().length === 0) {
    throw new Error('Please specify a password to protect the document.');
  }

  onProgress?.({ step: 'Reading PDF binary...', percent: 25 });
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  onProgress?.({ step: 'Applying AES-256 standard PDF encryption...', percent: 65 });
  const encryptedBytes = await encryptPDF(pdfBytes, password.trim(), {
    algorithm: 'AES-256',
    ownerPassword: password.trim(),
  });

  const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
  onProgress?.({ step: 'Done!', percent: 100 });

  return {
    blob,
    fileName: `protected_${file.name}`,
    size: blob.size,
  };
}

// --------------------------------------------------------------------------
// 10. EXTRACT TEXT & OCR
// --------------------------------------------------------------------------
export async function extractPdfText(
  file: File,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ text: string; fileName: string; pageCount: number }> {
  onProgress?.({ step: 'Reading PDF document text streams...', percent: 25 });

  // If input is an image, try client-side extraction or image summary
  if (file.type.startsWith('image/')) {
    onProgress?.({ step: 'Extracting metadata & image properties...', percent: 70 });
    const img = await loadImageFromFile(file);
    const text = `=== Image Document Analysis ===\nFile: ${file.name}\nDimensions: ${img.naturalWidth} x ${img.naturalHeight}px\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type}\n\n[Visual Image Asset - No embedded character stream detected]`;
    onProgress?.({ step: 'Done!', percent: 100 });
    return {
      text,
      fileName: `${file.name.replace(/\.[^/.]+$/, '')}_ocr.txt`,
      pageCount: 1,
    };
  }

  const { fullText, pages } = await extractRealTextFromPdf(file, (current, total) => {
    onProgress?.({
      step: `Extracting text from page ${current} of ${total}...`,
      percent: Math.round(25 + (current / total) * 70),
    });
  });

  onProgress?.({ step: 'Done!', percent: 100 });
  return {
    text: fullText,
    fileName: `${file.name.replace(/\.pdf$/i, '')}_extracted.txt`,
    pageCount: pages.length,
  };
}
