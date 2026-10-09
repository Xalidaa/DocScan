import React from 'react';
import { useDocuments } from '../context/DocumentContext';
import { 
  FileText, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Sparkles, ChevronRight, Eye, ShieldAlert, FileCheck, XCircle, ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { documents, activities, setActiveView, navigateToReview, setIsUploadModalOpen, updateDocumentStatus } = useDocuments();

  const totalCount = 1240 + documents.length;
  const pendingDocs = documents.filter(d => d.status === 'Pending Review');
  const approvedDocsCount = 1180 + documents.filter(d => d.status === 'Approved').length;
  const totalWarningsCount = documents.reduce((acc, d) => acc + (d.validationWarnings ? d.validationWarnings.length : 0), 0) + 12;

  const stats = [
    {
      title: "Total Documents",
      value: totalCount.toLocaleString(),
      change: "+14.2%",
      isPositive: true,
      subtext: "System volume total",
      icon: FileText,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Pending Review",
      value: `${pendingDocs.length}`,
      change: pendingDocs.length > 0 ? `${pendingDocs.length} Action Needed` : "Queue Clear",
      isPositive: pendingDocs.length === 0,
      subtext: "Needs manual audit",
      icon: Clock,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Approved",
      value: approvedDocsCount.toLocaleString(),
      change: "95.8% Pass",
      isPositive: true,
      subtext: "Synced to ERP ledger",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Warnings",
      value: `${totalWarningsCount}`,
      change: "-3.1%",
      isPositive: true,
      subtext: "Flagged rule alerts",
      icon: AlertTriangle,
      color: "from-rose-500 to-pink-600"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Welcome & Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white p-8 border border-slate-800 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400 via-indigo-400 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Intelligent Document Agent Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              DocScan Processing Hub
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time OCR extraction, product matching, and automated accounting workflows for Invoices, Delivery Notes, and Receipts.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* 4 Explicit Requested KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {stat.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {stat.value}
                </div>
                <div className={`flex items-center text-xs font-bold ${stat.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {stat.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Documents Table & Processing Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Documents Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Recent Documents
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest uploaded invoices, delivery notes, and receipts
                </p>
              </div>
              <button
                onClick={() => setActiveView('documents')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                View Full Repository <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="pb-3">Document</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.slice(0, 5).map(doc => {
                    const isApproved = doc.status === 'Approved';
                    const isRejected = doc.status === 'Rejected';
                    const isPending = doc.status === 'Pending Review';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            <span className="truncate max-w-[130px]">{doc.fileName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{doc.id}</div>
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doc.type === 'Invoice'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : doc.type === 'Delivery Note'
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="py-3 pr-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {doc.vendor}
                        </td>
                        <td className="py-3 pr-2 text-right font-extrabold text-slate-900 dark:text-slate-100">
                          ${doc.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isRejected
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => navigateToReview(doc.id)}
                            className="px-2.5 py-1 bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Processing Activity Chart Component */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                  Processing Activity Chart
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily document processing volume by classification</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-500"></span> Invoices
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-400"></span> Delivery Notes
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Receipts
                </div>
              </div>
            </div>

            {/* Interactive Bar Activity Chart */}
            <div className="h-48 pt-6 flex items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-2">
              {[
                { day: "Mon", inv: 45, dn: 20, rec: 15 },
                { day: "Tue", inv: 62, dn: 28, rec: 22 },
                { day: "Wed", inv: 78, dn: 34, rec: 18 },
                { day: "Thu", inv: 55, dn: 25, rec: 30 },
                { day: "Fri", inv: 88, dn: 40, rec: 25 },
                { day: "Sat", inv: 24, dn: 10, rec: 12 },
                { day: "Sun", inv: 15, dn: 5, rec: 8 },
              ].map((bar, index) => {
                const total = bar.inv + bar.dn + bar.rec;
                const invPct = (bar.inv / 120) * 100;
                const dnPct = (bar.dn / 120) * 100;
                const recPct = (bar.rec / 120) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 dark:text-slate-300">
                      {total}
                    </div>
                    <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-lg flex flex-col-reverse overflow-hidden h-36">
                      <div style={{ height: `${invPct}%` }} className="bg-brand-500 group-hover:bg-brand-600 transition-all"></div>
                      <div style={{ height: `${dnPct}%` }} className="bg-indigo-400 group-hover:bg-indigo-500 transition-all"></div>
                      <div style={{ height: `${recPct}%` }} className="bg-emerald-400 group-hover:bg-emerald-500 transition-all"></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {bar.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Warnings & Activity Audit Trail */}
        <div className="space-y-6">
          
          {/* Active Warnings Alert Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Active System Warnings
            </h3>
            <div className="space-y-3">
              {documents.filter(d => d.validationWarnings && d.validationWarnings.length > 0).map(d => (
                <div key={d.id} className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex justify-between items-center">
                    <span>{d.fileName}</span>
                    <button onClick={() => navigateToReview(d.id)} className="text-[10px] underline font-extrabold text-amber-700 dark:text-amber-300">
                      Inspect
                    </button>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight">
                    {d.validationWarnings[0].title}: {d.validationWarnings[0].message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Recent Audit Log
            </h3>
            <div className="space-y-4">
              {activities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.type === 'approval' ? 'bg-emerald-500' : act.type === 'rejection' ? 'bg-rose-500' : 'bg-brand-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {act.user} • {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
