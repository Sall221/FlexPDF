import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  HelpCircle,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  FileQuestion,
  Headphones,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne la limite gratuite de 3 tâches par jour ?',
    a: 'Chaque visiteur ou utilisateur gratuit dispose de 3 opérations documentaires offertes par tranche de 24h. Le compteur se réinitialise automatiquement à minuit. Aucune carte bancaire n\'est requise.',
  },
  {
    q: 'Mes fichiers sont-ils stockés sur vos serveurs ?',
    a: 'Absolument pas. FlexPDF privilégie le traitement en mémoire côté client ou des conteneurs sécurisés éphémères. Tous les fichiers temporaires sont purgés de façon irréversible immédiatement après votre téléchargement ou après 60 minutes au maximum.',
  },
  {
    q: 'Quelle est la taille maximale de fichier autorisée ?',
    a: 'Les utilisateurs du forfait Gratuit peuvent téléverser des fichiers jusqu\'à 10 Mo. Les abonnés Pro bénéficient d\'une limite portée à 500 Mo par fichier et de traitements par lot jusqu\'à 50 documents en simultané.',
  },
  {
    q: 'Comment obtenir ma facture avec TVA après un abonnement Pro ?',
    a: 'Dès votre paiement validé via SasPay (Carte ou Mobile Money), votre facture officielle avec mention de la TVA est générée et téléchargeable au format PDF dans votre Tableau de Bord > Onglet Facturation.',
  },
  {
    q: 'Puis-je résilier mon abonnement Pro à tout moment ?',
    a: 'Oui, la résiliation s\'effectue en 1 clic sans condition depuis vos paramètres d\'abonnement. Vous conservez vos accès illimités jusqu\'à la fin de la période facturée en cours.',
  },
  {
    q: 'Proposez-vous des API pour l\'intégration dans nos applications d\'entreprise ?',
    a: 'Oui, une clé API dédiée est fournie dans l\'espace membre pour automatiser vos flux de conversion PDF et OCR à grande échelle.',
  },
];

export const ContactPage: React.FC = () => {
  const { user, createSupportTicket, supportTickets, addNotification } = useApp();

  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<'technical' | 'billing' | 'feature' | 'other'>('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ Search & Accordion
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaq = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !subject.trim() || !message.trim()) {
      addNotification('warning', 'Champs Incomplets', 'Veuillez remplir tous les champs du formulaire.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      createSupportTicket({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        subject: subject.trim(),
        message: message.trim(),
        category,
      });

      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 600);
  };

  // User's past tickets if any
  const myTickets = supportTickets.filter(
    (t) => user && t.userEmail.toLowerCase() === user.email.toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Headphones className="w-3.5 h-3.5" /> Support Client Réactif & Assistance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="text-sm text-slate-600">
          Notre équipe technique et notre service client sont à votre écoute. Temps de réponse moyen garanti sous 2 heures pour les membres Pro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Envoyer un message à l'assistance</h2>
              <p className="text-xs text-slate-500">Formulaire direct connecté au bureau de support</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Votre Nom / Société</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ex: Jean Dupont"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ex: contact@societe.fr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Catégorie de la demande</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="technical">Problème Technique / Bug</option>
                  <option value="billing">Facturation & Abonnements</option>
                  <option value="feature">Demande de Fonctionnalité</option>
                  <option value="other">Autre / Partenariat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Objet de votre message</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="ex: Question sur la compression OCR"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Détails de votre demande</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez précisément votre question ou le fichier rencontré..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer mon message au support</span>
                </>
              )}
            </button>
          </form>

          {/* User's recent tickets */}
          {myTickets.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Vos demandes de support récentes ({myTickets.length})
              </h3>
              <div className="space-y-2.5">
                {myTickets.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{t.subject}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status === 'resolved' ? 'Résolu' : 'En attente'}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{t.message}</p>
                    {t.adminReply && (
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 space-y-1">
                        <p className="font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Réponse de l'équipe FlexPDF :
                        </p>
                        <p className="text-slate-700 leading-relaxed">{t.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Direct Info & Quick FAQ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick info cards */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Coordonnées directes
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-400">Email du Support</p>
                  <p className="font-semibold text-white">support@documorph.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-400">Disponibilité</p>
                  <p className="font-semibold text-white">24h/24 & 7j/7 pour les membres Pro</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-400">Sécurité & Confidentialité</p>
                  <p className="font-semibold text-white">Conformité RGPD et ISO 27001</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive FAQ Search */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Foire Aux Questions (FAQ)
              </h3>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans la FAQ..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              {filteredFaq.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3 text-left text-xs font-bold text-slate-800 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 pt-2 bg-white">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaq.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Aucune question trouvée. Utilisez le formulaire ci-dessus pour nous contacter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
