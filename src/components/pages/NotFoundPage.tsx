import React from 'react';
import { FileQuestion, ArrowLeft, Home, Sparkles, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotFoundPage: React.FC = () => {
  const { setActiveView, setSelectedToolId } = useApp();

  return (
    <div className="max-w-xl mx-auto text-center py-16 px-4 space-y-6 animate-in fade-in duration-200">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
        <FileQuestion className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">Erreur 404</span>
        <h1 className="text-3xl font-black text-slate-900">Page Introuvable</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Le document ou l'adresse que vous cherchez n'existe pas ou a été déplacé vers un nouvel emplacement.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          onClick={() => {
            setSelectedToolId(null);
            setActiveView('home');
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        <button
          onClick={() => {
            setSelectedToolId(null);
            setActiveView('all-tools');
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Voir tous les outils</span>
        </button>
      </div>
    </div>
  );
};
