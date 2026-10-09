import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { DocumentProvider, useDocuments } from './context/DocumentContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import UploadModal from './components/UploadModal';
import ToastContainer from './components/ToastContainer';
import DashboardPage from './pages/DashboardPage';
import DocumentListPage from './pages/DocumentListPage';
import DocumentReviewPage from './pages/DocumentReviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { activeView } = useDocuments();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {activeView === 'dashboard' && <DashboardPage />}
          {activeView === 'documents' && <DocumentListPage />}
          {activeView === 'review' && <DocumentReviewPage />}
          {activeView === 'analytics' && <AnalyticsPage />}
          {activeView === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Overlays & Notifications */}
      <UploadModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DocumentProvider>
        <AppContent />
      </DocumentProvider>
    </ThemeProvider>
  );
}
