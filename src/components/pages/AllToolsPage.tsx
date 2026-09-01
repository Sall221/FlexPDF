import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  FileText,
  Minimize2,
  FileType,
  Image as ImageIcon,
  RotateCw,
  Scissors,
  Layers,
  Lock,
  Eye,
  Camera,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TOOLS_DATA } from '../../data/toolsData';
import { ToolCategory } from '../../types';

interface AllToolsPageProps {
  onSelectTool: (toolId: string) => void;
}

const CATEGORY_TABS: { id: ToolCategory; label: string; count?: number }[] = [
  { id: 'all', label: 'Tous les Outils' },
  { id: 'pdf-core', label: 'Essentiels PDF' },
  { id: 'convert-from-pdf', label: 'Convertir depuis PDF' },
  { id: 'convert-to-pdf', label: 'Convertir vers PDF' },
  { id: 'image-tools', label: 'Outils Images' },
  { id: 'security-edit', label: 'Sécurité & Édition' },
];

export const AllToolsPage: React.FC<AllToolsPageProps> = ({ onSelectTool }) => {
  const { siteSettings, isUnlimited, remainingDailyQuota } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.longDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      case 'Minimize2':
        return <Minimize2 className="w-6 h-6" />;
      case 'FileType':
        return <FileType className="w-6 h-6" />;
      case 'Image':
        return <ImageIcon className="w-6 h-6" />;
      case 'RotateCw':
        return <RotateCw className="w-6 h-6" />;
      case 'Scissors':
        return <Scissors className="w-6 h-6" />;
      case 'Layers':
        return <Layers className="w-6 h-6" />;
      case 'Lock':
        return <Lock className="w-6 h-6" />;
      case 'Eye':
        return <Eye className="w-6 h-6" />;
      case 'Camera':
        return <Camera className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Suite Complète de 12 Outils Haute Précision
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Catalogue exhaustif de vos outils documentaires
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Fusionnez, compressez, convertissez et protégez tous vos fichiers PDF et images en quelques secondes, avec traitement sécurisé en mémoire locale.
        </p>

        {/* Quota indicator reminder for visitors */}
        {!isUnlimited && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            <span>
              Quota visiteur : <strong>{remainingDailyQuota}/3</strong> conversions gratuites restantes aujourd'hui
            </span>
          </div>
        )}
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un outil (ex: Fusionner, Compresser, PDF vers Word, JPG, Filigrane...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? TOOLS_DATA.length
                : TOOLS_DATA.filter((t) => t.category === tab.id).length;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTools.map((tool) => {
          const isDisabled = siteSettings.disabledTools.includes(tool.id);
          return (
            <div
              key={tool.id}
              onClick={() => !isDisabled && onSelectTool(tool.id)}
              className={`group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${tool.color}15`,
                      color: tool.color,
                    }}
                  >
                    {getToolIcon(tool.icon)}
                  </div>
                  {tool.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-600 border border-rose-200">
                      {tool.badge}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                      En Maintenance
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {tool.shortDesc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {tool.maxFiles > 1 ? `Jusqu'à ${tool.maxFiles} fichiers` : 'Fichier unique'}
                </span>
                <span className="flex items-center gap-1">
                  Ouvrir <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto p-8 space-y-4">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">Aucun outil ne correspond à votre recherche</h3>
          <p className="text-xs text-slate-500">
            Essayez avec des termes différents comme "PDF", "Image", "Compresser" ou réinitialisez les filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};
