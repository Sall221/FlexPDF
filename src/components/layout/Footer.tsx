import React from 'react';
import { Flame, ShieldCheck, Lock, Zap, CheckCircle2, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TOOLS_DATA } from '../../data/toolsData';

export const Footer: React.FC = () => {
  const { setSelectedToolId, setActiveView, setLegalActiveTab } = useApp();

  const handleToolClick = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
      {/* Trust & Security Bar */}
      <div className="border-b border-slate-200/80 bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">100% Secure & Private</p>
              <p className="text-xs text-slate-500 mt-0.5">Files are processed instantly in memory and auto-deleted within 60 minutes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">256-Bit TLS Encryption</p>
              <p className="text-xs text-slate-500 mt-0.5">Bank-grade transport layer security for all file uploads and downloads.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Lightning-Fast Web Workers</p>
              <p className="text-xs text-slate-500 mt-0.5">Client-side hardware acceleration for zero queue waiting times.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-rose-600 p-0.5 shadow-sm">
                <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                  <Flame className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <span className="font-extrabold text-lg text-slate-900">FlexPDF</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The modern, cloud-speed SaaS platform for all your PDF and visual asset conversion workflows.
              Designed for power users, designers, lawyers, and engineering teams.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> System 99.99% Uptime
              </span>
            </div>
          </div>

          {/* PDF Core */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">PDF Essentials</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button onClick={() => handleToolClick('merge-pdf')} className="hover:text-indigo-600 transition-colors">
                  Merge PDF
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('split-pdf')} className="hover:text-indigo-600 transition-colors">
                  Spot & Split PDF
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('compress-pdf')} className="hover:text-indigo-600 transition-colors">
                  Compress PDF
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('rotate-pdf')} className="hover:text-indigo-600 transition-colors">
                  Rotate & Organize
                </button>
              </li>
            </ul>
          </div>

          {/* Converters */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Format Converters</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button onClick={() => handleToolClick('pdf-to-word')} className="hover:text-indigo-600 transition-colors">
                  PDF to Word DOCX
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('word-to-pdf')} className="hover:text-indigo-600 transition-colors">
                  Word to PDF
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('pdf-to-image')} className="hover:text-indigo-600 transition-colors">
                  PDF to JPG / PNG
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('image-to-pdf')} className="hover:text-indigo-600 transition-colors">
                  Image to PDF
                </button>
              </li>
              <li>
                <button onClick={() => handleToolClick('image-converter')} className="hover:text-indigo-600 transition-colors">
                  Universal Image Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Support */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Support & Société</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button onClick={() => { setActiveView('all-tools'); setSelectedToolId(null); }} className="hover:text-indigo-600 transition-colors">
                  Catalogue des Outils
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveView('pricing'); setSelectedToolId(null); }} className="hover:text-indigo-600 transition-colors">
                  Tarifs & Abonnements
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveView('contact'); setSelectedToolId(null); }} className="hover:text-indigo-600 transition-colors">
                  Support Client & FAQ
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveView('legal'); setLegalActiveTab('privacy'); setSelectedToolId(null); }} className="hover:text-indigo-600 transition-colors">
                  Protection des Données (RGPD)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 FlexPDF Inc. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveView('legal');
                setLegalActiveTab('cgu');
                setSelectedToolId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-indigo-600 cursor-pointer transition-colors"
            >
              Conditions d'Utilisation (CGU)
            </button>
            <button
              onClick={() => {
                setActiveView('legal');
                setLegalActiveTab('privacy');
                setSelectedToolId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-indigo-600 cursor-pointer transition-colors"
            >
              Politique de Confidentialité
            </button>
            <button
              onClick={() => {
                setActiveView('legal');
                setLegalActiveTab('mentions');
                setSelectedToolId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-indigo-600 cursor-pointer transition-colors"
            >
              Mentions Légales
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
