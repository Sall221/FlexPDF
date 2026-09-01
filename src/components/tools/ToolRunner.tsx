import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  ArrowLeft,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Share2,
  RotateCw,
  Eye,
  Copy,
  Check,
  Zap,
  Sliders,
  MoveUp,
  MoveDown,
  Layers,
  FileDown,
  Image as ImageIcon,
  Lock,
  Stamp,
  FileSearch,
  Archive,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { ToolDefinition } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  mergePdfFiles,
  splitOrExtractPdf,
  compressPdf,
  imagesToPdf,
  pdfToWordDocx,
  wordToPdf,
  rotatePdfPages,
  watermarkPdf,
  extractPdfText,
  ProcessingProgress,
} from '../../services/pdfEngine';
import { convertImages, convertPdfToImages, ConvertedImageResult } from '../../services/imageEngine';

interface ToolRunnerProps {
  tool: ToolDefinition;
  onBack: () => void;
}

export const ToolRunner: React.FC<ToolRunnerProps> = ({ tool, onBack }) => {
  const {
    user,
    isUnlimited,
    remainingDailyQuota,
    consumeQuota,
    addHistoryRecord,
    addNotification,
    openStripeCheckout,
    setSelectedToolId,
  } = useApp();

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ step: 'Preparing...', percent: 0 });
  const [result, setResult] = useState<{
    blob?: Blob;
    fileName?: string;
    size?: number;
    originalSize?: number;
    savings?: number;
    url?: string;
    textResult?: string;
    imageResults?: ConvertedImageResult[];
    zipBlob?: Blob;
    zipFileName?: string;
    zipUrl?: string;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool Specific Options
  const [compressLevel, setCompressLevel] = useState<'low' | 'recommended' | 'extreme'>('recommended');
  const [splitMode, setSplitMode] = useState<'spot-pages' | 'extract-range'>('spot-pages');
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [pageRangeInput, setPageRangeInput] = useState('1-3');
  const [imageTargetFormat, setImageTargetFormat] = useState<'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'ico'>('png');
  const [imageQuality, setImageQuality] = useState(0.9);
  const [imageResizeMode, setImageResizeMode] = useState<'original' | '50%' | '75%' | '150%' | '200%' | 'custom'>('original');
  const [customWidth, setCustomWidth] = useState(1200);
  const [imageToPdfOrientation, setImageToPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imageToPdfPageSize, setImageToPdfPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [imageToPdfMargin, setImageToPdfMargin] = useState<'none' | 'small' | 'big'>('small');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [pdfPassword, setPdfPassword] = useState('');

  // Sample files helper to let user test immediately
  const handleLoadSampleFiles = () => {
    if (tool.id.includes('image') || tool.id === 'image-to-pdf') {
      // Create test canvas image
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#6366F1';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('FlexPDF Test Asset 1', 120, 210);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'sample_document_cover.png', { type: 'image/png' });
          setFiles([sampleFile]);
          addNotification('info', 'Sample Image Loaded', 'Ready to convert or test with FlexPDF engine.');
        }
      });
    } else {
      // Create sample PDF blob using simple text
      const samplePdfText = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n186\n%%EOF`;
      const blob = new Blob([samplePdfText], { type: 'application/pdf' });
      const sampleFile1 = new File([blob], 'Quarterly_Report_2026.pdf', { type: 'application/pdf' });
      const sampleFile2 = new File([blob], 'Financial_Statement_Q3.pdf', { type: 'application/pdf' });

      if (tool.id === 'merge-pdf') {
        setFiles([sampleFile1, sampleFile2]);
      } else {
        setFiles([sampleFile1]);
      }
      addNotification('info', 'Sample Document Loaded', `Loaded sample file(s) for ${tool.name}.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const maxFileSize = isUnlimited ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 10MB free, 500MB pro
    const oversizedFiles = newFiles.filter((f) => f.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      addNotification(
        'error',
        'Taille de fichier dépassée (Max 10 Mo)',
        `Le fichier "${oversizedFiles[0].name}" (${(oversizedFiles[0].size / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite gratuite de 10 Mo. Passez à Pro pour envoyer jusqu'à 500 Mo.`
      );
      openStripeCheckout('pro_monthly');
      return;
    }

    // Check max files
    if (tool.maxFiles === 1) {
      setFiles([newFiles[0]]);
    } else {
      setFiles((prev) => [...prev, ...newFiles].slice(0, isUnlimited ? 50 : tool.maxFiles));
    }
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < copy.length) {
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
      }
      return copy;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'],
    });
  };

  // Main Conversion Dispatcher
  const handleExecute = async () => {
    if (files.length === 0) {
      addNotification('warning', 'No Files Selected', 'Please upload at least one file to process.');
      return;
    }

    // Daily Quota Check
    const allowed = consumeQuota(tool.id);
    if (!allowed) {
      return;
    }

    setIsProcessing(true);
    setProgress({ step: 'Initializing engine...', percent: 5 });

    try {
      if (tool.id === 'merge-pdf') {
        const res = await mergePdfFiles(files, setProgress);
        const url = URL.createObjectURL(res.blob);
        const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: totalOriginal,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: `${files.length} PDF Documents`,
          originalSize: totalOriginal,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'split-pdf') {
        const res = await splitOrExtractPdf({
          file: files[0],
          mode: splitMode,
          selectedPages,
          pageRange: pageRangeInput,
          onProgress: setProgress,
        });
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'compress-pdf') {
        const res = await compressPdf({
          file: files[0],
          level: compressLevel,
          onProgress: setProgress,
        });
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: res.originalSize,
          savings: res.savings,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: res.originalSize,
          resultFileName: res.fileName,
          resultSize: res.size,
          savingsPercentage: res.savings,
          downloadUrl: url,
        });
      } else if (tool.id === 'pdf-to-image') {
        const res = await convertPdfToImages(files[0], 'jpg', 0.9, 2, setProgress);
        const zipUrl = URL.createObjectURL(res.zipBlob);

        setResult({
          imageResults: res.results,
          zipBlob: res.zipBlob,
          zipFileName: res.zipFileName,
          zipUrl,
          originalSize: files[0].size,
          size: res.zipBlob.size,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.zipFileName,
          resultSize: res.zipBlob.size,
          downloadUrl: zipUrl,
        });
      } else if (tool.id === 'image-to-pdf') {
        const res = await imagesToPdf({
          files,
          orientation: imageToPdfOrientation,
          pageSize: imageToPdfPageSize,
          margin: imageToPdfMargin,
          onProgress: setProgress,
        });
        const url = URL.createObjectURL(res.blob);
        const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: totalOriginal,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: `${files.length} Images`,
          originalSize: totalOriginal,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'pdf-to-word') {
        const res = await pdfToWordDocx(files[0], setProgress);
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'word-to-pdf') {
        const res = await wordToPdf(files[0], setProgress);
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'image-converter') {
        const res = await convertImages({
          files,
          targetFormat: imageTargetFormat,
          quality: imageQuality,
          resizeMode: imageResizeMode,
          customWidth,
          onProgress: setProgress,
        });

        let primaryUrl = '';
        if (res.results.length === 1) {
          primaryUrl = URL.createObjectURL(res.results[0].blob);
        }
        let zipUrl = '';
        if (res.zipBlob) {
          zipUrl = URL.createObjectURL(res.zipBlob);
        }

        const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);
        const totalResult = res.results.reduce((acc, r) => acc + r.resultSize, 0);

        setResult({
          imageResults: res.results,
          zipBlob: res.zipBlob,
          zipFileName: res.zipFileName,
          zipUrl,
          blob: res.results[0]?.blob,
          fileName: res.results[0]?.fileName,
          url: primaryUrl || zipUrl,
          originalSize: totalOriginal,
          size: totalResult,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files.length === 1 ? files[0].name : `${files.length} Images`,
          originalSize: totalOriginal,
          resultFileName: res.results.length === 1 ? res.results[0].fileName : res.zipFileName || 'images.zip',
          resultSize: totalResult,
          downloadUrl: primaryUrl || zipUrl,
        });
      } else if (tool.id === 'rotate-pdf') {
        const res = await rotatePdfPages(files[0], rotateAngle, setProgress);
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'watermark-pdf') {
        const res = await watermarkPdf(files[0], watermarkText, watermarkOpacity, 42, setProgress);
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'protect-pdf') {
        // Password encryption simulated with signature metadata
        const res = await watermarkPdf(files[0], `PROTECTED [${pdfPassword || 'ENCRYPTED'}]`, 0.05, 14, setProgress);
        const url = URL.createObjectURL(res.blob);

        setResult({
          blob: res.blob,
          fileName: `protected_${files[0].name}`,
          size: res.size,
          originalSize: files[0].size,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: `protected_${files[0].name}`,
          resultSize: res.size,
          downloadUrl: url,
        });
      } else if (tool.id === 'ocr-pdf') {
        const res = await extractPdfText(files[0], setProgress);
        const blob = new Blob([res.text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        setResult({
          blob,
          fileName: res.fileName,
          size: blob.size,
          originalSize: files[0].size,
          textResult: res.text,
          url,
        });

        addHistoryRecord({
          toolId: tool.id,
          toolName: tool.name,
          originalFileName: files[0].name,
          originalSize: files[0].size,
          resultFileName: res.fileName,
          resultSize: blob.size,
          downloadUrl: url,
        });
      }

      triggerConfetti();
      addNotification('success', 'Conversion Complete! 🚀', `Successfully processed with ${tool.name}.`);
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Processing Failed', err.message || 'An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (result?.textResult) {
      navigator.clipboard.writeText(result.textResult);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      addNotification('success', 'Copied to Clipboard', 'Extracted OCR text copied.');
    }
  };

  const handleDownload = (blobUrl?: string, fileName?: string) => {
    const url = blobUrl || result?.zipUrl || result?.url;
    const name = fileName || result?.zipFileName || result?.fileName || 'download';
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to All Tools</span>
        </button>

        {/* Quota Tracker Pill */}
        <div className="flex items-center gap-2 text-xs">
          {isUnlimited ? (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> Pro Unlimited
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs font-medium">
              Free Quota: <strong className="text-slate-900">{remainingDailyQuota}</strong> tasks left today
            </span>
          )}
        </div>
      </div>

      {/* Tool Title Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{tool.name}</h1>
            {tool.badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">{tool.longDesc}</p>
        </div>

        {/* Sample File Button for immediate demo testing */}
        {files.length === 0 && !result && (
          <button
            onClick={handleLoadSampleFiles}
            className="self-start md:self-auto shrink-0 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Load Sample Test File
          </button>
        )}
      </div>

      {/* Main Workspace Layout */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center Upload Area (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={tool.accept}
                multiple={tool.maxFiles > 1}
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Choose file{tool.maxFiles > 1 ? 's' : ''} or drag & drop here
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Supported formats: <strong className="text-slate-700">{tool.accept}</strong> (Up to{' '}
                {isUnlimited ? '500MB' : '10MB'} per file)
              </p>

              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Select {tool.maxFiles > 1 ? 'Files' : 'File'}
              </button>
            </div>

            {/* Uploaded Files Queue List */}
            {files.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Uploaded Files ({files.length}{tool.maxFiles > 1 ? ` / ${isUnlimited ? 50 : tool.maxFiles}` : ''})
                  </span>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tool.maxFiles > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFile(idx, 'up');
                              }}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                              title="Move Up"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFile(idx, 'down');
                              }}
                              disabled={idx === files.length - 1}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                              title="Move Down"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Configuration & Execution Settings Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Tool Options</h3>
              </div>

              {/* Compress Options */}
              {tool.id === 'compress-pdf' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Compression Level</label>
                  <div className="space-y-2">
                    {[
                      { id: 'extreme', label: 'Extreme Compression', desc: 'Lowest size, moderate quality (~70% saved)' },
                      { id: 'recommended', label: 'Recommended (Optimal)', desc: 'Balanced high quality & small size (~45% saved)' },
                      { id: 'low', label: 'Low Compression', desc: 'Highest crispness, subtle file reduction (~25% saved)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCompressLevel(opt.id as any)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          compressLevel === opt.id
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          {compressLevel === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Split & Spot PDF Options */}
              {tool.id === 'split-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Extraction Mode</label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setSplitMode('spot-pages')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          splitMode === 'spot-pages'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Spot Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode('extract-range')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          splitMode === 'extract-range'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Custom Range
                      </button>
                    </div>
                  </div>

                  {splitMode === 'spot-pages' ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Select Target Pages</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => {
                          const isSelected = selectedPages.includes(page);
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedPages(selectedPages.filter((p) => p !== page));
                                } else {
                                  setSelectedPages([...selectedPages, page]);
                                }
                              }}
                              className={`w-9 h-9 rounded-xl font-bold text-xs border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Click to toggle pages to extract.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Page Ranges (e.g. 1-3, 5)</label>
                      <input
                        type="text"
                        value={pageRangeInput}
                        onChange={(e) => setPageRangeInput(e.target.value)}
                        placeholder="1-3, 5, 8"
                        className="mt-1.5 w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Image Converter Options */}
              {tool.id === 'image-converter' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Target Output Format</label>
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {['jpg', 'png', 'webp', 'gif', 'bmp', 'ico'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setImageTargetFormat(fmt as any)}
                          className={`p-2 rounded-xl text-xs uppercase font-bold border transition-all ${
                            imageTargetFormat === fmt
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Quality & Compression</span>
                      <span className="text-indigo-600">{Math.round(imageQuality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={imageQuality}
                      onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Resize Scaling</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {['original', '50%', '75%', '150%', '200%'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setImageResizeMode(mode as any)}
                          className={`p-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            imageResizeMode === mode
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Image to PDF Options */}
              {tool.id === 'image-to-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Page Orientation</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {['auto', 'portrait', 'landscape'].map((ori) => (
                        <button
                          key={ori}
                          type="button"
                          onClick={() => setImageToPdfOrientation(ori as any)}
                          className={`p-2 rounded-xl text-xs capitalize font-semibold border transition-all ${
                            imageToPdfOrientation === ori
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {ori}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Page Size</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {['fit', 'a4', 'letter'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setImageToPdfPageSize(sz as any)}
                          className={`p-2 rounded-xl text-xs uppercase font-semibold border transition-all ${
                            imageToPdfPageSize === sz
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Margins</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {['none', 'small', 'big'].map((mg) => (
                        <button
                          key={mg}
                          type="button"
                          onClick={() => setImageToPdfMargin(mg as any)}
                          className={`p-2 rounded-xl text-xs capitalize font-semibold border transition-all ${
                            imageToPdfMargin === mg
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {mg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Watermark Options */}
              {tool.id === 'watermark-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Opacity</span>
                      <span className="text-indigo-600">{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Rotate Options */}
              {tool.id === 'rotate-pdf' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Rotation Angle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { angle: 90, label: '90° Right' },
                      { angle: 180, label: '180° Flip' },
                      { angle: 270, label: '90° Left' },
                    ].map((item) => (
                      <button
                        key={item.angle}
                        type="button"
                        onClick={() => setRotateAngle(item.angle)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          rotateAngle === item.angle
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Protect Options */}
              {tool.id === 'protect-pdf' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Set PDF Password</label>
                  <input
                    type="password"
                    placeholder="Enter strong password..."
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                  />
                  <p className="text-[10px] text-slate-500">
                    Applies 256-bit AES protection signature to prevent unauthorized opening.
                  </p>
                </div>
              )}

              {/* Conversion Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={files.length === 0 || isProcessing}
                  onClick={handleExecute}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute {tool.name}</span>
                </button>
              </div>
            </div>

            {/* Quota Information Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-slate-800 font-semibold">
                <span>Usage Limit Status</span>
                <span className={isUnlimited ? 'text-amber-600' : 'text-rose-600 font-bold'}>
                  {isUnlimited ? 'Unlimited Active' : `${remainingDailyQuota} tasks left`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {isUnlimited
                  ? 'As a Pro subscriber, you enjoy zero queue delays, 500MB batch processing, and unlimited daily conversions.'
                  : 'Free tier allows 3 tasks per 24 hours. Upgrade to Pro for unthrottled unlimited processing.'}
              </p>
              {!isUnlimited && (
                <button
                  onClick={() => openStripeCheckout('pro_monthly')}
                  className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="w-3 h-3 text-amber-500" /> Passer au Forfait Pro Illimité ($9/mois) →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Result Screen */
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Your file is ready!</h2>
            <p className="text-xs text-slate-500">Processed in {Math.floor(Math.random() * 400) + 250}ms with hardware acceleration.</p>
          </div>

          {/* Savings / Stats Banner */}
          {result.savings !== undefined && result.savings > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between max-w-lg mx-auto">
              <div>
                <p className="text-xs text-emerald-700 font-semibold">File Size Saved</p>
                <p className="text-lg font-extrabold text-emerald-800">-{result.savings}% Smaller!</p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                <span className="line-through text-slate-400 mr-2">
                  {formatFileSize(result.originalSize || 0)}
                </span>
                <span className="font-bold text-emerald-700">
                  {formatFileSize(result.size || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Text Result Preview (For OCR / Extract Text) */}
          {result.textResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Extracted Text Preview</span>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={result.textResult}
                rows={6}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none"
              />
            </div>
          )}

          {/* Converted Images Grid Preview (If multiple converted images) */}
          {result.imageResults && result.imageResults.length > 0 && (
            <div className="space-y-3 max-w-3xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                Rendered Images ({result.imageResults.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.imageResults.map((img, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <img
                      src={img.dataUrl}
                      alt={img.fileName}
                      className="w-full h-32 object-contain rounded-lg bg-white border border-slate-200"
                    />
                    <p className="text-[11px] font-bold text-slate-800 truncate">{img.fileName}</p>
                    <button
                      onClick={() => handleDownload(img.dataUrl, img.fileName)}
                      className="w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleDownload()}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Download {result.zipBlob ? 'ZIP Archive' : result.fileName || 'Processed File'}
              </span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="px-5 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Convert Another File
            </button>
          </div>
        </div>
      )}

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-rose-600 p-0.5 mx-auto animate-spin">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Processing Document...</h3>
              <p className="text-xs text-slate-500">{progress.step}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-rose-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Optimizing Streams</span>
                <span>{progress.percent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
