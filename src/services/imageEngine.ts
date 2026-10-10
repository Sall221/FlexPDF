import JSZip from 'jszip';
import { ProcessingProgress } from './pdfEngine';
import { renderAllPdfPages, RenderedPageImage } from './pdfRenderer';

export type SupportedImageFormat = 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'ico';

export interface ImageConversionOptions {
  files: File[];
  targetFormat: SupportedImageFormat;
  quality: number; // 0.1 to 1.0
  resizeMode: 'original' | '50%' | '75%' | '150%' | '200%' | 'custom';
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio?: boolean;
  onProgress?: (p: ProcessingProgress) => void;
}

export interface ConvertedImageResult {
  blob: Blob;
  fileName: string;
  originalFileName: string;
  originalSize: number;
  resultSize: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Creates a valid Windows .ICO binary containing PNG data (official standard since Vista)
 */
function createIcoBlob(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  return new Promise(async (resolve) => {
    const pngBuffer = await pngBlob.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);

    const icoHeaderSize = 6;
    const icoEntrySize = 16;
    const totalSize = icoHeaderSize + icoEntrySize + pngBytes.length;

    const icoBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(icoBuffer);

    // ICONDIR Header
    view.setUint16(0, 0, true); // Reserved (must be 0)
    view.setUint16(2, 1, true); // Type (1 = ICO, 2 = CUR)
    view.setUint16(4, 1, true); // Count of images (1)

    // ICONDIRENTRY
    const clampedW = width >= 256 ? 0 : width;
    const clampedH = height >= 256 ? 0 : height;
    view.setUint8(6, clampedW); // Width
    view.setUint8(7, clampedH); // Height
    view.setUint8(8, 0); // Color palette (0 = no palette)
    view.setUint8(9, 0); // Reserved
    view.setUint16(10, 1, true); // Color planes
    view.setUint16(12, 32, true); // Bits per pixel (32-bit RGBA)
    view.setUint32(14, pngBytes.length, true); // Size of image data in bytes
    view.setUint32(18, icoHeaderSize + icoEntrySize, true); // Offset of image data

    // Copy PNG bytes
    const outBytes = new Uint8Array(icoBuffer);
    outBytes.set(pngBytes, icoHeaderSize + icoEntrySize);

    resolve(new Blob([icoBuffer], { type: 'image/x-icon' }));
  });
}

/**
 * Creates a valid uncompressed 24-bit .BMP file from canvas imageData
 */
function createBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Blob([], { type: 'image/bmp' });

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const extraBytes = (4 - ((width * 3) % 4)) % 4;
  const rowSize = width * 3 + extraBytes;
  const imageSize = rowSize * height;
  const headerSize = 54;
  const totalFileSize = headerSize + imageSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, totalFileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, headerSize, true);

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Bottom-up bitmap
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // 24 bits per pixel
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true); // Horizontal resolution (72 DPI)
  view.setInt32(42, 2835, true); // Vertical resolution (72 DPI)
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const outBytes = new Uint8Array(buffer);
  let pos = headerSize;

  // BMP pixels are bottom-to-top, BGR order
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      outBytes[pos++] = b;
      outBytes[pos++] = g;
      outBytes[pos++] = r;
    }
    for (let p = 0; p < extraBytes; p++) {
      outBytes[pos++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Converts image files (JPG, PNG, WEBP, GIF, SVG, BMP, ICO) to any desired target format
 */
export async function convertImages(
  options: ImageConversionOptions
): Promise<{ results: ConvertedImageResult[]; zipBlob?: Blob; zipFileName?: string }> {
  const {
    files,
    targetFormat,
    quality,
    resizeMode,
    customWidth,
    customHeight,
    maintainAspectRatio = true,
    onProgress,
  } = options;

  const results: ConvertedImageResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({
      step: `Converting image ${i + 1} of ${files.length}: ${file.name}`,
      percent: Math.round(10 + (i / files.length) * 80),
    });

    const img = await loadImageFromFile(file);
    let targetW = img.naturalWidth || 800;
    let targetH = img.naturalHeight || 600;

    if (resizeMode === '50%') {
      targetW = Math.round(targetW * 0.5);
      targetH = Math.round(targetH * 0.5);
    } else if (resizeMode === '75%') {
      targetW = Math.round(targetW * 0.75);
      targetH = Math.round(targetH * 0.75);
    } else if (resizeMode === '150%') {
      targetW = Math.round(targetW * 1.5);
      targetH = Math.round(targetH * 1.5);
    } else if (resizeMode === '200%') {
      targetW = Math.round(targetW * 2);
      targetH = Math.round(targetH * 2);
    } else if (resizeMode === 'custom' && customWidth) {
      targetW = customWidth;
      if (maintainAspectRatio && img.naturalWidth) {
        targetH = Math.round((customWidth / img.naturalWidth) * (img.naturalHeight || customWidth));
      } else if (customHeight) {
        targetH = customHeight;
      }
    }

    targetW = Math.max(1, targetW);
    targetH = Math.max(1, targetH);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (targetFormat === 'jpg' || targetFormat === 'bmp') {
        // Fill white background for non-alpha formats
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    let blob: Blob;
    let dataUrl: string;

    if (targetFormat === 'ico') {
      // Create PNG first, then encapsulate in standard ICO container
      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob([], { type: 'image/png' })), 'image/png');
      });
      blob = await createIcoBlob(pngBlob, targetW, targetH);
      dataUrl = canvas.toDataURL('image/png');
    } else if (targetFormat === 'bmp') {
      blob = createBmpBlob(canvas);
      dataUrl = canvas.toDataURL('image/png');
    } else {
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };
      const mime = mimeMap[targetFormat] || 'image/png';
      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob([], { type: mime })), mime, quality);
      });
      dataUrl = canvas.toDataURL(mime, quality);
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outFileName = `${baseName}_converted.${targetFormat}`;

    results.push({
      blob,
      fileName: outFileName,
      originalFileName: file.name,
      originalSize: file.size,
      resultSize: blob.size,
      dataUrl,
      width: targetW,
      height: targetH,
    });
  }

  let zipBlob: Blob | undefined;
  let zipFileName: string | undefined;

  if (results.length > 1) {
    onProgress?.({ step: 'Packing converted files into ZIP archive...', percent: 94 });
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.fileName, r.blob);
    });
    zipBlob = await zip.generateAsync({ type: 'blob' });
    zipFileName = `converted_images_${Date.now()}.zip`;
  }

  onProgress?.({ step: 'Done!', percent: 100 });
  return { results, zipBlob, zipFileName };
}

/**
 * Converts each page of an imported PDF file into a REAL high-resolution raster image (JPG, PNG, WEBP)
 */
export async function convertPdfToImages(
  file: File,
  format: 'jpg' | 'png' | 'webp' = 'jpg',
  quality: number = 0.92,
  dpiScale: number = 2.0,
  onProgress?: (p: ProcessingProgress) => void
): Promise<{ results: ConvertedImageResult[]; zipBlob: Blob; zipFileName: string }> {
  onProgress?.({ step: 'Reading PDF pages with high-fidelity rasterizer...', percent: 15 });

  const renderedPages = await renderAllPdfPages(
    file,
    format,
    quality,
    dpiScale,
    (current, total) => {
      onProgress?.({
        step: `Rendering high-resolution page ${current} of ${total}...`,
        percent: Math.round(15 + (current / total) * 75),
      });
    }
  );

  const results: ConvertedImageResult[] = [];
  const zip = new JSZip();
  const baseName = file.name.replace(/\.pdf$/i, '');

  renderedPages.forEach((page: RenderedPageImage) => {
    const pageFileName = `${baseName}_page_${page.pageNumber}.${format}`;
    results.push({
      blob: page.blob,
      fileName: pageFileName,
      originalFileName: file.name,
      originalSize: file.size,
      resultSize: page.blob.size,
      dataUrl: page.dataUrl,
      width: page.width,
      height: page.height,
    });

    zip.file(pageFileName, page.blob);
  });

  onProgress?.({ step: 'Generating ZIP archive for download...', percent: 95 });
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${baseName}_pages_${format}.zip`;

  onProgress?.({ step: 'Done!', percent: 100 });
  return { results, zipBlob, zipFileName };
}

/**
 * Loads an image file into an HTMLImageElement, supporting SVG, WebP, GIF, PNG, JPG, BMP
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image file: ${file.name}`));
    };
    img.src = url;
  });
}
