import React from 'react';
import { Wrench, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MaintenancePage: React.FC = () => {
  const { siteSettings } = useApp();

  return (
    <div className="max-w-xl mx-auto text-center py-16 px-4 space-y-6 animate-in fade-in duration-200">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
        <Wrench className="w-10 h-10 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" /> Maintenance Programmée
        </span>
        <h1 className="text-3xl font-black text-slate-900">Mise à Niveau en Cours</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {siteSettings.maintenanceMessage ||
            'Nos serveurs subissent une opération d\'optimisation programmée pour vous offrir des performances de conversion décuplées.'}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 max-w-md mx-auto flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Vos fichiers et données sont parfaitement sécurisés.</span>
      </div>

      <div className="pt-2">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Vérifier la disponibilité</span>
        </button>
      </div>
    </div>
  );
};
