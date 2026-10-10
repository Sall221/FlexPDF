import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
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
  EyeOff,
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
  FileSpreadsheet,
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
  rotateAndOrganizePdf,
  PageOrganizeConfig,
  watermarkPdf,
  protectPdfWithPassword,
  extractPdfText,
  ProcessingProgress,
} from '../../services/pdfEngine';
import {
  convertImages,
  convertPdfToImages,
  ConvertedImageResult,
  SupportedImageFormat,
} from '../../services/imageEngine';
import { getPdfPageCount } from '../../services/pdfRenderer';

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
  const [progress, setProgress] = useState<ProcessingProgress>({ step: 'Préparation...', percent: 0 });
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

  // Dynamic PDF Page metadata
  const [detectedPageCount, setDetectedPageCount] = useState<number>(1);

  // Tool Specific Options
  // 1. Compress
  const [compressLevel, setCompressLevel] = useState<'low' | 'recommended' | 'extreme'>('recommended');

  // 2. Split
  const [splitMode, setSplitMode] = useState<'spot-pages' | 'extract-range' | 'split-all'>('spot-pages');
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [pageRangeInput, setPageRangeInput] = useState('1');

  // 3. Image Converter
  const [imageTargetFormat, setImageTargetFormat] = useState<SupportedImageFormat>('png');
  const [imageQuality, setImageQuality] = useState(0.9);
  const [imageResizeMode, setImageResizeMode] = useState<'original' | '50%' | '75%' | '150%' | '200%' | 'custom'>('original');
  const [customWidth, setCustomWidth] = useState(1200);

  // 4. Image to PDF
  const [imageToPdfOrientation, setImageToPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imageToPdfPageSize, setImageToPdfPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [imageToPdfMargin, setImageToPdfMargin] = useState<'none' | 'small' | 'big'>('small');

  // 5. PDF to Image
  const [pdfToImageFormat, setPdfToImageFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [pdfToImageQuality, setPdfToImageQuality] = useState(0.92);
  const [pdfToImageDpi, setPdfToImageDpi] = useState<number>(2.0);

  // 6. Rotate & Organize
  const [pageOrganizeList, setPageOrganizeList] = useState<{ id: number; pageIndex: number; rotation: number }[]>([]);

  // 7. Watermark
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [watermarkFontSize, setWatermarkFontSize] = useState(38);
  const [watermarkColor, setWatermarkColor] = useState<'red' | 'indigo' | 'slate' | 'amber' | 'emerald'>('red');
  const [watermarkPosition, setWatermarkPosition] = useState<'diagonal' | 'header' | 'footer' | 'center'>('diagonal');

  // 8. Protect
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // When files change, inspect the first file if it's a PDF to get page count and organize structure
  useEffect(() => {
    if (files.length > 0 && files[0].name.toLowerCase().endsWith('.pdf')) {
      getPdfPageCount(files[0]).then((count) => {
        setDetectedPageCount(count);
        // Setup default organize list
        setPageOrganizeList(
          Array.from({ length: count }, (_, i) => ({
            id: i,
            pageIndex: i,
            rotation: 0,
          }))
        );
        // Setup default selected pages
        if (selectedPages.length === 0 || selectedPages[0] > count) {
          setSelectedPages([1]);
        }
        setPageRangeInput(`1-${Math.min(count, 3)}`);
      });
    } else {
      setDetectedPageCount(1);
      setPageOrganizeList([]);
    }
  }, [files]);

  // Load sample test files
  const handleLoadSampleFiles = () => {
    if (tool.id.includes('image') && tool.id !== 'pdf-to-image') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('FlexPDF Test Image Asset', 160, 280);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#E0E7FF';
        ctx.fillText('High-resolution sample for format conversion', 180, 330);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'sample_graphic.png', { type: 'image/png' });
          setFiles([sampleFile]);
          addNotification('info', 'Fichier image chargé', 'Image de test prête à être traitée.');
        }
      });
    } else if (tool.id === 'word-to-pdf') {
      // Create text file pretending to be docx content
      const sampleBlob = new Blob(['Rapport d\'activité officiel 2026\n\nIntroduction:\nCe document atteste de la conversion haute fidélité.\n\nSection 1: Performance et KPI\nTous les indicateurs respectent scrupuleusement la structure originale.\n\nSection 2: Conclusion\nLe rendu PDF est parfaitement formaté.'], { type: 'text/plain' });
      const sampleFile = new File([sampleBlob], 'Rapport_Synthese.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      setFiles([sampleFile]);
      addNotification('info', 'Document Word chargé', 'Fichier Word de test prêt à être converti.');
    } else {
      // Create authentic multi-page PDF using jsPDF
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('FlexPDF Document de Test Officiel', 20, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Ce document multi-pages permet de tester directement toutes les fonctionnalités :', 20, 45);
      doc.text('- Fusion, Division ciblée, Compression réelle et Extraction OCR.', 20, 55);
      doc.text('- Conversion PDF vers Image (haute résolution) et Word (.docx).', 20, 65);
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1.5);
      doc.line(20, 75, 190, 75);

      // Page 2
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Page 2: Analyse Financière & Indicateurs Clés', 20, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Chiffre d\'affaires trimestriel : +34.5%', 20, 45);
      doc.text('Taux de satisfaction client : 99.8%', 20, 55);
      doc.text('Toutes les métadonnées et typographies sont scrupuleusement conservées.', 20, 65);

      // Page 3
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Page 3: Conclusion & Signatures', 20, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Document validé et certifié conforme pour la suite FlexPDF SaaS.', 20, 45);

      const blob = doc.output('blob');
      const sampleFile1 = new File([blob], 'Document_Audit_2026.pdf', { type: 'application/pdf' });
      const sampleFile2 = new File([blob], 'Annexe_Financiere_2026.pdf', { type: 'application/pdf' });

      if (tool.id === 'merge-pdf') {
        setFiles([sampleFile1, sampleFile2]);
      } else {
        setFiles([sampleFile1]);
      }
      addNotification('info', 'Document PDF multi-pages chargé', `Fichier test de 3 pages chargé pour ${tool.name}.`);
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
    const maxFileSize = isUnlimited ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
    const oversizedFiles = newFiles.filter((f) => f.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      addNotification(
        'error',
        'Taille de fichier dépassée (Max 10 Mo)',
        `Le fichier "${oversizedFiles[0].name}" (${(oversizedFiles[0].size / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite de 10 Mo. Passez à Pro pour envoyer jusqu'à 500 Mo.`
      );
      openStripeCheckout('pro_monthly');
      return;
    }

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

  // Reorder organize list pages
  const moveOrganizePage = (index: number, direction: 'up' | 'down') => {
    setPageOrganizeList((prev) => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target >= 0 && target < copy.length) {
        const temp = copy[index];
        copy[index] = copy[target];
        copy[target] = temp;
      }
      return copy;
    });
  };

  // Rotate single organize page
  const rotateOrganizePage = (index: number) => {
    setPageOrganizeList((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        rotation: (copy[index].rotation + 90) % 360,
      };
      return copy;
    });
  };

  // -------------------------------------------------------------------------
  // MAIN EXECUTION DISPATCHER
  // -------------------------------------------------------------------------
  const handleExecute = async () => {
    if (files.length === 0) {
      addNotification('warning', 'Aucun fichier', 'Veuillez sélectionner au moins un fichier.');
      return;
    }

    const allowed = consumeQuota(tool.id);
    if (!allowed) {
      return;
    }

    setIsProcessing(true);
    setProgress({ step: 'Initialisation du moteur de traitement...', percent: 5 });

    try {
      // 1. MERGE PDF
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
          originalFileName: `${files.length} Documents PDF`,
          originalSize: totalOriginal,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      }

      // 2. SPOT & SPLIT PDF
      else if (tool.id === 'split-pdf') {
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
          zipBlob: res.isZip ? res.blob : undefined,
          zipFileName: res.isZip ? res.fileName : undefined,
          zipUrl: res.isZip ? url : undefined,
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
      }

      // 3. COMPRESS PDF
      else if (tool.id === 'compress-pdf') {
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
      }

      // 4. PDF TO IMAGE
      else if (tool.id === 'pdf-to-image') {
        const res = await convertPdfToImages(
          files[0],
          pdfToImageFormat,
          pdfToImageQuality,
          pdfToImageDpi,
          setProgress
        );
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
      }

      // 5. IMAGE TO PDF
      else if (tool.id === 'image-to-pdf') {
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
          originalFileName: `${files.length} Image(s)`,
          originalSize: totalOriginal,
          resultFileName: res.fileName,
          resultSize: res.size,
          downloadUrl: url,
        });
      }

      // 6. PDF TO WORD (.DOCX)
      else if (tool.id === 'pdf-to-word') {
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
      }

      // 7. WORD TO PDF
      else if (tool.id === 'word-to-pdf') {
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
      }

      // 8. IMAGE FORMAT CONVERTER
      else if (tool.id === 'image-converter') {
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
      }

      // 9. ROTATE & ORGANIZE PDF
      else if (tool.id === 'rotate-pdf') {
        const configs: PageOrganizeConfig[] = pageOrganizeList.map((p) => ({
          pageIndex: p.pageIndex,
          rotation: p.rotation,
        }));

        const res = await rotateAndOrganizePdf(files[0], configs, setProgress);
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
      }

      // 10. WATERMARK PDF
      else if (tool.id === 'watermark-pdf') {
        const res = await watermarkPdf({
          file: files[0],
          text: watermarkText,
          opacity: watermarkOpacity,
          fontSize: watermarkFontSize,
          color: watermarkColor,
          position: watermarkPosition,
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
      }

      // 11. PROTECT PDF (AUTHENTIC AES-256 ENCRYPTION)
      else if (tool.id === 'protect-pdf') {
        if (!pdfPassword || pdfPassword.trim().length === 0) {
          throw new Error('Veuillez saisir un mot de passe pour chiffrer le document.');
        }

        const res = await protectPdfWithPassword(files[0], pdfPassword, setProgress);
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
      }

      // 12. EXTRACT TEXT & OCR
      else if (tool.id === 'ocr-pdf') {
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
      addNotification('success', 'Traitement réussi ! 🚀', `Opération complétée avec succès avec ${tool.name}.`);
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Erreur de traitement', err.message || 'Une erreur est survenue lors de l\'exécution.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (result?.textResult) {
      navigator.clipboard.writeText(result.textResult);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      addNotification('success', 'Texte copié !', 'Le texte extrait a été copié dans le presse-papiers.');
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
          <span>Retour aux outils</span>
        </button>

        {/* Quota Tracker Pill */}
        <div className="flex items-center gap-2 text-xs">
          {isUnlimited ? (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> Forfait Pro Illimité
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs font-medium">
              Quota gratuit : <strong className="text-slate-900">{remainingDailyQuota}</strong> tâches restantes aujourd'hui
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
            Charger un fichier de test
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
                multiple={tool.maxFiles > 1}
                accept={tool.accept}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-indigo-50/50 transition-transform group-hover:scale-105">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Glissez-déposez vos fichiers ici, ou <span className="text-indigo-600 underline">parcourez</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Supporte {tool.accept.replace(/\*/g, '')} • Jusqu'à {tool.maxFiles} fichier(s) • Max 10 Mo par fichier
              </p>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>
                    Fichiers sélectionnés ({files.length} / {tool.maxFiles})
                  </span>
                  <button
                    onClick={() => setFiles([])}
                    className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Tout effacer
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {tool.maxFiles > 1 && files.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveFile(idx, 'up')}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                              title="Déplacer vers le haut"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === files.length - 1}
                              onClick={() => moveFile(idx, 'down')}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                              title="Déplacer vers le bas"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                <h3 className="text-sm font-bold text-slate-900">Options de traitement</h3>
              </div>

              {/* 1. Compress Options */}
              {tool.id === 'compress-pdf' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Niveau de compression</label>
                  <div className="space-y-2">
                    {[
                      { id: 'extreme', label: 'Compression Maximale', desc: 'Taille minimale (~70% d\'espace gagné)' },
                      { id: 'recommended', label: 'Recommandée (Optimal)', desc: 'Excellent équilibre qualité / taille (~50% d\'espace gagné)' },
                      { id: 'low', label: 'Légère / Sans perte', desc: 'Qualité maximale préservée (~20% d\'espace gagné)' },
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

              {/* 2. Split & Spot PDF Options */}
              {tool.id === 'split-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Mode de découpe</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {[
                        { id: 'spot-pages', label: 'Pages ciblées' },
                        { id: 'extract-range', label: 'Plage' },
                        { id: 'split-all', label: 'Chaque page (ZIP)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSplitMode(m.id as any)}
                          className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                            splitMode === m.id
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {splitMode === 'spot-pages' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Sélectionner les pages ({detectedPageCount} page{detectedPageCount > 1 ? 's' : ''})
                        </label>
                        <div className="flex gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedPages(Array.from({ length: detectedPageCount }, (_, i) => i + 1))}
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Toutes
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPages([])}
                            className="text-slate-500 hover:underline font-semibold"
                          >
                            Aucune
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                        {Array.from({ length: detectedPageCount }, (_, i) => i + 1).map((page) => {
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
                              className={`w-8 h-8 rounded-lg font-bold text-xs border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Cliquez sur les numéros pour inclure ou exclure les pages du fichier résultant.
                      </p>
                    </div>
                  )}

                  {splitMode === 'extract-range' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Plage de pages (ex: 1-3, 5)</label>
                      <input
                        type="text"
                        value={pageRangeInput}
                        onChange={(e) => setPageRangeInput(e.target.value)}
                        placeholder={`1-${detectedPageCount}`}
                        className="mt-1.5 w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Total détecté dans ce document : {detectedPageCount} page(s).
                      </p>
                    </div>
                  )}

                  {splitMode === 'split-all' && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                      <p className="font-bold">Découpe individuelle intégrale</p>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Chaque page du document ({detectedPageCount} pages) sera exportée sous forme de fichier PDF distinct, empaquetée dans une archive ZIP prête à télécharger.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Image Converter Options */}
              {tool.id === 'image-converter' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Format de sortie cible</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {(['jpg', 'png', 'webp', 'gif', 'bmp', 'ico'] as SupportedImageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setImageTargetFormat(fmt)}
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
                      <span>Qualité de compression</span>
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
                    <label className="text-xs font-semibold text-slate-700">Redimensionnement</label>
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

              {/* 4. PDF to Image Options */}
              {tool.id === 'pdf-to-image' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Format d'image de sortie</label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {(['jpg', 'png', 'webp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setPdfToImageFormat(fmt)}
                          className={`p-2.5 rounded-xl text-xs uppercase font-bold border transition-all ${
                            pdfToImageFormat === fmt
                              ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Résolution / Qualité de rendu</label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setPdfToImageDpi(1.5)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                          pdfToImageDpi === 1.5
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Standard (150 DPI)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfToImageDpi(2.0)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                          pdfToImageDpi === 2.0
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Haute Résolution (300 DPI)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Image to PDF Options */}
              {tool.id === 'image-to-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Orientation des pages</label>
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
                          {ori === 'auto' ? 'Automatique' : ori === 'portrait' ? 'Portrait' : 'Paysage'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Format de papier</label>
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
                          {sz === 'fit' ? 'Ajusté' : sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Marges</label>
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
                          {mg === 'none' ? 'Aucune' : mg === 'small' ? 'Petite' : 'Grande'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Rotate & Organize PDF Options */}
              {tool.id === 'rotate-pdf' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Organiser & Faire pivoter ({pageOrganizeList.length} pages)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPageOrganizeList((prev) =>
                          prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 }))
                        )
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" /> Tourner toutes (90°)
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {pageOrganizeList.map((pageItem, idx) => (
                      <div
                        key={pageItem.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700 shadow-2xs">
                            {pageItem.pageIndex + 1}
                          </span>
                          <span className="font-semibold text-slate-800">Page {pageItem.pageIndex + 1}</span>
                          {pageItem.rotation > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                              {pageItem.rotation}°
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => rotateOrganizePage(idx)}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-indigo-600 flex items-center gap-1 cursor-pointer"
                            title="Pivoter de 90 degrés"
                          >
                            <RotateCw className="w-3 h-3" /> +90°
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveOrganizePage(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Déplacer vers le haut"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === pageOrganizeList.length - 1}
                            onClick={() => moveOrganizePage(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Déplacer vers le bas"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPageOrganizeList((prev) => [...prev].reverse())}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Inverser l'ordre
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPageOrganizeList(
                          Array.from({ length: detectedPageCount }, (_, i) => ({
                            id: i,
                            pageIndex: i,
                            rotation: 0,
                          }))
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Watermark Options */}
              {tool.id === 'watermark-pdf' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Texte du filigrane</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Position du filigrane</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      {[
                        { id: 'diagonal', label: 'Diagonale (Centre)' },
                        { id: 'center', label: 'Centre horizontal' },
                        { id: 'header', label: 'En-tête (Haut)' },
                        { id: 'footer', label: 'Pied de page (Bas)' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setWatermarkPosition(pos.id as any)}
                          className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                            watermarkPosition === pos.id
                              ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Opacité</span>
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

              {/* 8. Protect PDF (Real AES-256 Encryption) */}
              {tool.id === 'protect-pdf' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Définir le mot de passe d'accès</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Saisissez un mot de passe sécurisé..."
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-[11px] text-rose-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Chiffrement standard AES-256
                    </p>
                    <p className="text-rose-700 leading-relaxed">
                      Ce mot de passe sera obligatoirement demandé par tout lecteur PDF (Acrobat, Chrome, Mac Aperçu, smartphone) pour pouvoir ouvrir et consulter le document.
                    </p>
                  </div>
                </div>
              )}

              {/* Execution Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={files.length === 0 || isProcessing}
                  onClick={handleExecute}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Lancer {tool.name}</span>
                </button>
              </div>
            </div>

            {/* Quota Information Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-slate-800 font-semibold">
                <span>Statut du compte</span>
                <span className={isUnlimited ? 'text-amber-600 font-bold' : 'text-slate-700 font-bold'}>
                  {isUnlimited ? 'Illimité Actif' : `${remainingDailyQuota} tâches restantes`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {isUnlimited
                  ? 'En tant que membre Pro, profitez de conversions instantanées sans limitation quotidienne et jusqu\'à 500 Mo.'
                  : 'Le forfait gratuit permet 3 opérations par jour. Passez à Pro pour un accès illimité.'}
              </p>
              {!isUnlimited && (
                <button
                  onClick={() => openStripeCheckout('pro_monthly')}
                  className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="w-3 h-3 text-amber-500" /> Passer au Forfait Pro ($9/mois) →
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
            <h2 className="text-2xl font-extrabold text-slate-900">Votre document est prêt !</h2>
            <p className="text-xs text-slate-500">
              Traitement haute fidélité complété avec succès et respect de la structure du document.
            </p>
          </div>

          {/* Savings / Stats Banner (For Compress) */}
          {result.savings !== undefined && result.savings > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between max-w-lg mx-auto">
              <div>
                <p className="text-xs text-emerald-700 font-semibold">Espace économisé</p>
                <p className="text-lg font-extrabold text-emerald-800">-{result.savings}% de réduction !</p>
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
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Texte extrait du document</span>
                </span>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copié !' : 'Copier le texte'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={result.textResult}
                rows={8}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none"
              />
            </div>
          )}

          {/* Converted Images Grid Preview (If multiple converted images or PDF to Images) */}
          {result.imageResults && result.imageResults.length > 0 && (
            <div className="space-y-3 max-w-3xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                Pages rendues en haute résolution ({result.imageResults.length} page{result.imageResults.length > 1 ? 's' : ''})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.imageResults.map((img, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2 shadow-2xs">
                    <img
                      src={img.dataUrl}
                      alt={img.fileName}
                      className="w-full h-36 object-contain rounded-lg bg-white border border-slate-200 shadow-2xs"
                    />
                    <p className="text-[11px] font-bold text-slate-800 truncate">{img.fileName}</p>
                    <button
                      onClick={() => handleDownload(img.dataUrl, img.fileName)}
                      className="w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Télécharger
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
                Télécharger {result.zipBlob ? 'l\'archive ZIP complète' : result.fileName || 'le fichier traité'}
              </span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="px-5 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Traiter un autre document
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
              <h3 className="text-lg font-bold text-slate-900 mb-1">Traitement en cours...</h3>
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
                <span>Moteur FlexPDF</span>
                <span>{progress.percent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
