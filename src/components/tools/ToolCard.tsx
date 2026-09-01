import React from 'react';
import {
  Layers,
  Scissors,
  FileDown,
  Image,
  FileImage,
  FileType2,
  FileText,
  RefreshCw,
  RotateCw,
  Stamp,
  Lock,
  FileSearch,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ToolDefinition } from '../../types';

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const getIcon = (iconName: string) => {
    const iconClass = "w-6 h-6";
    switch (iconName) {
      case 'Layers': return <Layers className={`${iconClass} text-rose-600`} />;
      case 'Scissors': return <Scissors className={`${iconClass} text-indigo-600`} />;
      case 'FileDown': return <FileDown className={`${iconClass} text-emerald-600`} />;
      case 'Image': return <Image className={`${iconClass} text-amber-600`} />;
      case 'FileImage': return <FileImage className={`${iconClass} text-sky-600`} />;
      case 'FileType2': return <FileType2 className={`${iconClass} text-blue-600`} />;
      case 'FileText': return <FileText className={`${iconClass} text-cyan-600`} />;
      case 'RefreshCw': return <RefreshCw className={`${iconClass} text-violet-600`} />;
      case 'RotateCw': return <RotateCw className={`${iconClass} text-teal-600`} />;
      case 'Stamp': return <Stamp className={`${iconClass} text-fuchsia-600`} />;
      case 'Lock': return <Lock className={`${iconClass} text-rose-600`} />;
      case 'FileSearch': return <FileSearch className={`${iconClass} text-purple-600`} />;
      default: return <FileText className={`${iconClass} text-indigo-600`} />;
    }
  };

  const getColorGradients = (color: string) => {
    switch (color) {
      case 'rose': return 'hover:border-rose-300 hover:shadow-md bg-white hover:bg-rose-50/20';
      case 'indigo': return 'hover:border-indigo-300 hover:shadow-md bg-white hover:bg-indigo-50/20';
      case 'emerald': return 'hover:border-emerald-300 hover:shadow-md bg-white hover:bg-emerald-50/20';
      case 'amber': return 'hover:border-amber-300 hover:shadow-md bg-white hover:bg-amber-50/20';
      case 'sky': return 'hover:border-sky-300 hover:shadow-md bg-white hover:bg-sky-50/20';
      case 'blue': return 'hover:border-blue-300 hover:shadow-md bg-white hover:bg-blue-50/20';
      case 'cyan': return 'hover:border-cyan-300 hover:shadow-md bg-white hover:bg-cyan-50/20';
      case 'violet': return 'hover:border-violet-300 hover:shadow-md bg-white hover:bg-violet-50/20';
      case 'teal': return 'hover:border-teal-300 hover:shadow-md bg-white hover:bg-teal-50/20';
      case 'fuchsia': return 'hover:border-fuchsia-300 hover:shadow-md bg-white hover:bg-fuchsia-50/20';
      case 'red': return 'hover:border-rose-300 hover:shadow-md bg-white hover:bg-rose-50/20';
      case 'purple': return 'hover:border-purple-300 hover:shadow-md bg-white hover:bg-purple-50/20';
      default: return 'hover:border-indigo-300 hover:shadow-md bg-white';
    }
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-50 border-rose-200/80 group-hover:bg-rose-100/70';
      case 'indigo': return 'bg-indigo-50 border-indigo-200/80 group-hover:bg-indigo-100/70';
      case 'emerald': return 'bg-emerald-50 border-emerald-200/80 group-hover:bg-emerald-100/70';
      case 'amber': return 'bg-amber-50 border-amber-200/80 group-hover:bg-amber-100/70';
      case 'sky': return 'bg-sky-50 border-sky-200/80 group-hover:bg-sky-100/70';
      case 'blue': return 'bg-blue-50 border-blue-200/80 group-hover:bg-blue-100/70';
      case 'cyan': return 'bg-cyan-50 border-cyan-200/80 group-hover:bg-cyan-100/70';
      case 'violet': return 'bg-violet-50 border-violet-200/80 group-hover:bg-violet-100/70';
      case 'teal': return 'bg-teal-50 border-teal-200/80 group-hover:bg-teal-100/70';
      case 'fuchsia': return 'bg-fuchsia-50 border-fuchsia-200/80 group-hover:bg-fuchsia-100/70';
      case 'red': return 'bg-rose-50 border-rose-200/80 group-hover:bg-rose-100/70';
      case 'purple': return 'bg-purple-50 border-purple-200/80 group-hover:bg-purple-100/70';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <button
      onClick={() => onSelect(tool.id)}
      className={`group relative p-5 rounded-2xl border border-slate-200/90 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer ${getColorGradients(
        tool.color
      )}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl border transition-all duration-200 group-hover:scale-105 ${getIconBg(
            tool.color
          )}`}
        >
          {getIcon(tool.icon)}
        </div>

        {tool.badge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:border-slate-300">
            {tool.badge === 'Save 80%' && <Sparkles className="w-3 h-3 text-emerald-600" />}
            {tool.badge}
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1.5 flex items-center justify-between">
        <span>{tool.name}</span>
        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </h3>

      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {tool.shortDesc}
      </p>
    </button>
  );
};
