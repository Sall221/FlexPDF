import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Shield, Cpu, Zap, ArrowRight, Crown, CheckCircle2, User, Play } from 'lucide-react';
import { TOOLS_DATA } from '../../data/toolsData';
import { ToolCategory } from '../../types';
import { ToolCard } from './ToolCard';
import { useApp } from '../../context/AppContext';

interface ToolGridProps {
  onSelectTool: (toolId: string) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelectTool }) => {
  const { user, isUnlimited, remainingDailyQuota, setIsUpgradeModalOpen, setIsAuthModalOpen, setActiveView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

  const categories: { id: ToolCategory; label: string }[] = [
    { id: 'all', label: 'Tous les 12 Outils' },
    { id: 'pdf-core', label: 'Fusion & Compression PDF' },
    { id: 'convert-from-pdf', label: 'PDF vers Word & Image' },
    { id: 'convert-to-pdf', label: 'Word & Image vers PDF' },
    { id: 'image-tools', label: 'Convertisseur Image' },
    { id: 'security-edit', label: 'Sécurité & Rotation' },
  ];

  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleTryFree = () => {
    // Select merge-pdf or first tool directly
    onSelectTool('merge-pdf');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="relative pt-4 pb-4 text-center max-w-4xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Plateforme SaaS Tout-en-Un pour Documents & Images</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Tous les outils pour traiter vos <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
            PDFs et Images en ligne
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Fusionnez, compressez, convertissez PDF vers Word éditable, transformez vos formats d'images, pivotez et protégez vos documents avec un traitement instantané et 100% sécurisé.
        </p>

        {/* Primary Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleTryFree}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Essayer gratuitement (Sans inscription)</span>
          </button>

          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Se connecter / S'inscrire</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mon Tableau de Bord</span>
            </button>
          )}
        </div>

        {/* Free Quota Notice for Visitors */}
        {!isUnlimited && (
          <p className="text-xs text-slate-500 font-medium">
            ✨ <strong className="text-slate-800">{remainingDailyQuota}/3</strong> utilisations gratuites restantes aujourd'hui pour votre session
          </p>
        )}

        {/* Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un outil (ex: Fusionner, Compresser, PDF vers Word, Images)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 font-medium"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Value Badges Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Vitesse Instantanée</p>
            <p className="text-[11px] text-slate-500">Moteur direct en mémoire</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">100% Confidentiel</p>
            <p className="text-[11px] text-slate-500">Fichiers non conservés (RGPD)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">3 Tâches / Jour Offertes</p>
            <p className="text-[11px] text-slate-500">Sans carte bancaire</p>
          </div>
        </div>

        <div
          onClick={() => !isUnlimited && setIsUpgradeModalOpen(true)}
          className={`p-3.5 rounded-2xl border shadow-2xs flex items-center gap-3 cursor-pointer transition-all ${
            isUnlimited
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-gradient-to-r from-amber-50/60 to-rose-50/60 border-amber-200 hover:border-amber-400 hover:shadow-xs'
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-900">
                {isUnlimited ? 'Pro Illimité Actif' : 'Passer à l\'Illimité'}
              </p>
              {!isUnlimited && <ArrowRight className="w-3 h-3 text-amber-700" />}
            </div>
            <p className="text-[11px] text-slate-500">
              {isUnlimited ? 'Conversions illimitées' : 'Taille 500 Mo & OCR Pro'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 px-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      <div>
        {filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3 shadow-sm">
            <Search className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Aucun outil trouvé pour "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Réinitialiser les filtres et voir tous les outils
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
