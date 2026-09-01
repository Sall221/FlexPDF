import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToolGrid } from './components/tools/ToolGrid';
import { ToolRunner } from './components/tools/ToolRunner';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminAccessGuard } from './components/admin/AdminAccessGuard';
import { PricingSection } from './components/pricing/PricingSection';
import { AllToolsPage } from './components/pages/AllToolsPage';
import { ContactPage } from './components/pages/ContactPage';
import { LegalPage } from './components/pages/LegalPage';
import { AuthPage } from './components/pages/AuthPage';
import { ForgotPasswordPage } from './components/pages/ForgotPasswordPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { MaintenancePage } from './components/pages/MaintenancePage';
import { AuthModal } from './components/modals/AuthModal';
import { ForgotPasswordModal } from './components/modals/ForgotPasswordModal';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { ToastContainer } from './components/common/ToastContainer';
import { TOOLS_DATA } from './data/toolsData';

const MainContent: React.FC = () => {
  const { activeView, setActiveView, selectedToolId, setSelectedToolId, siteSettings, user } = useApp();

  const currentTool = TOOLS_DATA.find((t) => t.id === selectedToolId) || TOOLS_DATA[0];

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setSelectedToolId(null);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Maintenance mode handling (Super Admin can bypass to manage settings)
  const isMaintenanceActive = siteSettings.maintenanceMode && user?.role !== 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isMaintenanceActive ? (
          <MaintenancePage />
        ) : (
          <>
            {activeView === 'home' && <ToolGrid onSelectTool={handleSelectTool} />}

            {activeView === 'all-tools' && <AllToolsPage onSelectTool={handleSelectTool} />}

            {activeView === 'tool' && (
              <ToolRunner tool={currentTool} onBack={handleBackToHome} />
            )}

            {activeView === 'pricing' && <PricingSection />}

            {activeView === 'auth' && <AuthPage />}

            {activeView === 'forgot-password' && <ForgotPasswordPage />}

            {activeView === 'contact' && <ContactPage />}

            {activeView === 'legal' && <LegalPage />}

            {activeView === 'dashboard' && (user ? <UserDashboard /> : <AuthPage />)}

            {activeView === 'admin' && (user?.role === 'admin' ? <AdminPanel /> : <AdminAccessGuard />)}

            {activeView === 'not-found' && <NotFoundPage />}
          </>
        )}
      </main>

      <Footer />

      <AuthModal />
      <ForgotPasswordModal />
      <UpgradeModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
