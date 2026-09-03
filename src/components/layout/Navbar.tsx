import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  FileDown,
  Image,
  FileImage,
  FileType2,
  RefreshCw,
  RotateCw,
  Stamp,
  Lock,
  FileSearch,
  Crown,
  Sparkles,
  Zap,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Clock,
  Flame,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TOOLS_DATA } from '../../data/toolsData';

export const Navbar: React.FC = () => {
  const {
    user,
    dailyUsageCount,
    dailyLimit,
    remainingDailyQuota,
    isUnlimited,
    timeUntilReset,
    activeView,
    setActiveView,
    setSelectedToolId,
    logout,
    setIsAuthModalOpen,
    openStripeCheckout,
  } = useApp();

  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4 text-rose-500" />;
      case 'Scissors': return <Scissors className="w-4 h-4 text-indigo-500" />;
      case 'FileDown': return <FileDown className="w-4 h-4 text-emerald-500" />;
      case 'Image': return <Image className="w-4 h-4 text-amber-500" />;
      case 'FileImage': return <FileImage className="w-4 h-4 text-sky-500" />;
      case 'FileType2': return <FileType2 className="w-4 h-4 text-blue-500" />;
      case 'FileText': return <FileText className="w-4 h-4 text-cyan-500" />;
      case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-violet-500" />;
      case 'RotateCw': return <RotateCw className="w-4 h-4 text-teal-500" />;
      case 'Stamp': return <Stamp className="w-4 h-4 text-fuchsia-500" />;
      case 'Lock': return <Lock className="w-4 h-4 text-red-500" />;
      case 'FileSearch': return <FileSearch className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-rose-500" />;
    }
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveView('tool');
    setIsToolsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/90 shadow-xs">
      {/* Top Announcement & Quota Notification Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-1.5 px-3 border-b border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 animate-pulse" />
            <span className="truncate">
              {!user ? (
                <>Essai Gratuit : <strong className="text-white font-bold">{remainingDailyQuota}/{dailyLimit}</strong> tâches restantes</>
              ) : isUnlimited ? (
                <>Forfait Pro Illimité : <strong className="text-emerald-400 font-bold">Actif</strong></>
              ) : (
                <>Forfait Gratuit : <strong className="text-white font-bold">{remainingDailyQuota}/{dailyLimit}</strong> tâches restantes</>
              )}
            </span>
            <span className="hidden md:inline text-slate-400">
              (Reset dans {timeUntilReset})
            </span>
          </div>

          {!user ? (
            <button
              onClick={() => setActiveView('auth')}
              className="shrink-0 font-bold text-indigo-300 hover:text-white flex items-center gap-1 text-[11px] sm:text-xs transition-colors cursor-pointer"
            >
              <span>Créer un compte pour sauvegarder vos fichiers →</span>
            </button>
          ) : !isUnlimited ? (
            <button
              onClick={() => openStripeCheckout('pro_monthly')}
              className="shrink-0 font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 text-[11px] sm:text-xs transition-colors cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="hidden xs:inline">Passer à l'Illimité</span>
              <span className="xs:hidden">Illimité</span>
              <span>($9/m) →</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2 sm:gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                setActiveView('home');
                setSelectedToolId(null);
              }}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-600 p-0.5 shadow-xs group-hover:shadow-indigo-500/20 transition-all shrink-0">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                    FlexPDF
                  </span>
                  <span className="px-1 py-0.2 text-[9px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    SaaS
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden sm:block">PDF & Image Suite</p>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 mx-2 xl:mx-6">
            <button
              onClick={() => {
                setActiveView('home');
                setSelectedToolId(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeView === 'home'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Accueil
            </button>

            <button
              onClick={() => {
                setActiveView('all-tools');
                setSelectedToolId(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeView === 'all-tools'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tous les Outils
            </button>

            {/* Tools Fast Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>Catalogue (12)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsToolsDropdownOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[480px] p-3 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[75vh] overflow-y-auto">
                    {TOOLS_DATA.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 shrink-0">
                          {getToolIcon(tool.icon)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                            {tool.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {tool.shortDesc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setActiveView('pricing');
                setSelectedToolId(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeView === 'pricing'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tarifs
            </button>

            <button
              onClick={() => {
                setActiveView('contact');
                setSelectedToolId(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeView === 'contact'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Support & FAQ
            </button>

            <button
              onClick={() => {
                setActiveView('legal');
                setSelectedToolId(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeView === 'legal'
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              CGU & Légal
            </button>

            {/* Connected User Protected Links (ONLY VISIBLE WHEN LOGGED IN) */}
            {user && (
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setSelectedToolId(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'text-indigo-600 bg-indigo-50/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {user.role === 'pro' ? 'Mon Espace Pro' : 'Mon Espace'}
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveView('admin');
                  setSelectedToolId(null);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  activeView === 'admin'
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Section: Quota status + Auth CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Subscription & Quota Status (ONLY WHEN LOGGED IN) */}
            {user && (
              <>
                {isUnlimited ? (
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>{user.role === 'enterprise' ? 'Forfait Entreprise' : user.role === 'admin' ? 'Admin' : 'Forfait Pro'}</span>
                  </div>
                ) : (
                  <div
                    onClick={() => openStripeCheckout('pro_monthly')}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                    title="Cliquez pour passer au forfait illimité"
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: dailyLimit }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full ${
                            idx < dailyUsageCount ? 'bg-rose-500' : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-700 text-xs font-semibold">
                      {remainingDailyQuota} restante{remainingDailyQuota > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Upgrade CTA (if logged in and not pro) */}
            {user && !isUnlimited && (
              <button
                onClick={() => openStripeCheckout('pro_annual')}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Passer Pro</span>
              </button>
            )}

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer border border-slate-200/80"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-800 hidden xl:inline max-w-[80px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
                      <div className="p-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {user.role}
                          </span>
                          {!isUnlimited && (
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                openStripeCheckout('pro_annual');
                              }}
                              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                            >
                              Upgrade Pro →
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setActiveView('dashboard');
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Mon Espace & Profil</span>
                        </button>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => {
                              setActiveView('admin');
                              setIsUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-left cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Console Admin</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveView('pricing');
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Forfaits & Factures</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserDropdownOpen(false);
                            setActiveView('home');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Se Déconnecter</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveView('auth')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Se Connecter</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveView('home');
                setSelectedToolId(null);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left ${activeView === 'home' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => {
                setActiveView('all-tools');
                setSelectedToolId(null);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left ${activeView === 'all-tools' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              📦 Tous les Outils (12)
            </button>
            <button
              onClick={() => {
                setActiveView('pricing');
                setSelectedToolId(null);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left ${activeView === 'pricing' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              💎 Tarifs & Forfaits
            </button>
            <button
              onClick={() => {
                setActiveView('contact');
                setSelectedToolId(null);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left ${activeView === 'contact' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              💬 Support & FAQ
            </button>
            <button
              onClick={() => {
                setActiveView('legal');
                setSelectedToolId(null);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-left col-span-2 ${activeView === 'legal' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              ⚖️ Mentions Légales & CGU
            </button>
          </div>

          {/* User state in mobile */}
          {user ? (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Mon Espace ({user.name})</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:underline"
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                  setActiveView('home');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveView('auth');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold text-center"
              >
                Se Connecter / S'Inscrire
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
