import React from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  CheckCircle2,
  Printer,
  ChevronRight,
  Server,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LegalPage: React.FC = () => {
  const { legalActiveTab, setLegalActiveTab } = useApp();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5 text-indigo-600" /> Cadre Juridique & Conformité RGPD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Mentions Légales & Conditions Générales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dernière mise à jour : 1er Janvier 2026. Document opposable régissant l'utilisation de la plateforme FlexPDF.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la documentation</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setLegalActiveTab('cgu')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            legalActiveTab === 'cgu'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Conditions Générales d'Utilisation (CGU)</span>
        </button>

        <button
          onClick={() => setLegalActiveTab('privacy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            legalActiveTab === 'privacy'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Politique de Confidentialité (RGPD)</span>
        </button>

        <button
          onClick={() => setLegalActiveTab('mentions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            legalActiveTab === 'mentions'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mentions Légales de l'Éditeur</span>
        </button>

        <button
          onClick={() => setLegalActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            legalActiveTab === 'security'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sécurité & Conservation des Fichiers</span>
        </button>
      </div>

      {/* Main Content Box */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-slate-700 text-sm space-y-8">
        {/* Tab 1: CGU */}
        {legalActiveTab === 'cgu' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Conditions Générales d'Utilisation du Service (CGU)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Règles applicables aux visiteurs et utilisateurs inscrits</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Objet & Présentation du Service</h3>
              <p>
                La plateforme <strong>FlexPDF</strong> met à disposition un ensemble d'outils logiciels en ligne destinés au traitement, à la fusion, à la compression, à la conversion et à la manipulation de fichiers au format PDF et formats graphiques associés.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Forfait Gratuit & Limites d'Utilisation</h3>
              <p>
                L'accès à titre gratuit est soumis à une stricte limite de <strong>3 (trois) opérations de conversion par période de 24 heures</strong> par utilisateur ou adresse IP, ainsi qu'à une taille maximale de <strong>10 mégaoctets (Mo)</strong> par fichier. Au-delà, l'accès au service nécessite la souscription à un abonnement Pro ou Entreprise.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Abonnements Pro & Modalités de Paiement</h3>
              <p>
                Les abonnements Pro donnent accès à des conversions illimitées et à une taille maximale portée à <strong>500 Mo</strong>. Les règlements sont exécutés de façon sécurisée via l'agrégateur certifié <strong>SasPay</strong> (Carte Bancaire et Mobile Money). L'utilisateur peut résilier son abonnement à tout moment sans préavis depuis son espace client.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Responsabilité & Propriété des Fichiers</h3>
              <p>
                L'utilisateur conserve la pleine et entière propriété intellectuelle des fichiers qu'il téléverse. L'utilisateur garantit détenir tous les droits nécessaires et s'interdit d'utiliser la plateforme pour traiter des contenus illicites ou malveillants.
              </p>
            </section>
          </div>
        )}

        {/* Tab 2: Privacy RGPD */}
        {legalActiveTab === 'privacy' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Politique de Confidentialité & Conformité RGPD</h2>
              <p className="text-xs text-slate-500 mt-0.5">Règlement Européen (UE) 2016/679</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Principe de Minimisation des Données</h3>
              <p>
                FlexPDF n'exige aucune création de compte pour l'utilisation gratuite. Nous ne collectons aucune donnée nominative lors des conversions de base. Pour les abonnés payants, seules les données strictement indispensables à la facturation (nom, adresse email) sont recueillies.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Purge Automatique des Fichiers Traités</h3>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Garantie Zéro Conservation Définitive
                </p>
                <p>
                  Les fichiers téléversés et les fichiers convertis sont automatiquement supprimés et écrasés de façon irréversible de nos conteneurs dans un délai maximum de <strong>60 minutes</strong> après exécution.
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Droits de l'Utilisateur (DPO)</h3>
              <p>
                Conformément aux articles 15 à 22 du RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment en écrivant à : <strong>dpo@flexpdf.com</strong>.
              </p>
            </section>
          </div>
        )}

        {/* Tab 3: Mentions Légales */}
        {legalActiveTab === 'mentions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Mentions Légales de l'Éditeur</h2>
              <p className="text-xs text-slate-500 mt-0.5">Informations obligatoires selon la loi pour la confiance dans l'économie numérique</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Éditeur du Site</h3>
              <p>
                <strong>Société :</strong> FlexPDF SAS au capital de 50 000 €<br />
                <strong>Siège social :</strong> 128 Rue de la Boétie, 75008 Paris, France<br />
                <strong>RCS Paris :</strong> 912 345 678<br />
                <strong>Directeur de la publication :</strong> Fadal Sall<br />
                <strong>Email :</strong> contact@flexpdf.com
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Hébergement Cloud</h3>
              <p>
                La plateforme est hébergée sur des infrastructures européennes sécurisées opérées par :<br />
                <strong>Google Cloud Platform (Europe-West Region)</strong><br />
                Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.
              </p>
            </section>
          </div>
        )}

        {/* Tab 4: Security */}
        {legalActiveTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Architecture de Sécurité & Chiffrement</h2>
              <p className="text-xs text-slate-500 mt-0.5">Normes techniques appliquées au pipeline de conversion</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-xs">Chiffrement TLS 1.3 / 256 bits</h4>
                <p className="text-xs text-slate-500">
                  Tous les transferts entre votre navigateur et nos processeurs de calcul transitent par un tunnel chiffré haute sécurité.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-xs">Isolation en Mémoire RAM</h4>
                <p className="text-xs text-slate-500">
                  Les opérations sont traitées dans des bacs à sable (sandboxes) éphémères sans persistance disque longue durée.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
