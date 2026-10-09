import React from 'react';
import { useDocuments } from '../context/DocumentContext';
import { LayoutDashboard, FileText, FileCheck, BarChart3, Settings, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const { activeView, setActiveView, documents, setIsUploadModalOpen } = useDocuments();

  const pendingCount = documents.filter(d => d.status === 'Pending Review').length;
  const approvedCount = documents.filter(d => d.status === 'Approved').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'All Documents', icon: FileText, count: documents.length },
    { id: 'review', label: 'Document Review', icon: FileCheck, badge: pendingCount > 0 ? pendingCount : null, badgeColor: 'bg-amber-500' },
    { id: 'analytics', label: 'Analytics & OCR', icon: BarChart3 },
    { id: 'settings', label: 'Rules & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors z-40">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-50 block leading-tight">
                DocScan<span className="text-brand-500 font-bold">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                Document Agent
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${item.badgeColor || 'bg-brand-500'}`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-950 dark:from-slate-800 dark:to-slate-950 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <Sparkles className="w-24 h-24 text-brand-400" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-300 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Verification Queue</span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-snug">
            {pendingCount} document{pendingCount !== 1 ? 's' : ''} require human audit matching.
          </p>
          <button
            onClick={() => setActiveView('review')}
            className="w-full py-1.5 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            Review Queue Now
          </button>
        </div>
      </div>
    </aside>
  );
}
