import React from 'react';
import { BarChart3, TrendingUp, Cpu, ShieldCheck, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          System Analytics & AI Metrics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Performance benchmarks for OCR extraction models, confidence distribution, and vendor matching.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall OCR Precision", val: "97.4%", sub: "Up +1.2% this month", icon: ShieldCheck, color: "text-emerald-500" },
          { label: "Straight-Through Processing", val: "84.2%", sub: "Auto-approved without manual edit", icon: Zap, color: "text-brand-500" },
          { label: "ERP Match Accuracy", val: "98.9%", sub: "SKU database correlation", icon: CheckCircle2, color: "text-indigo-500" },
          { label: "Avg Field Error Rate", val: "1.8%", sub: "Requires human review flag", icon: AlertTriangle, color: "text-amber-500" }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-50">{m.val}</div>
              <div className="text-[11px] text-slate-400 mt-1">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Field Error Rate Analysis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            Field-Level Extraction Precision
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confidence rates across core extracted schema keys
          </p>

          <div className="space-y-3 pt-2">
            {[
              { field: "Vendor Name & Tax ID", rate: 99.4, color: "bg-emerald-500" },
              { field: "Document Total & Currency", rate: 99.1, color: "bg-emerald-500" },
              { field: "Issue & Due Date", rate: 98.2, color: "bg-emerald-500" },
              { field: "Line Item Descriptions & Qty", rate: 94.5, color: "bg-brand-500" },
              { field: "Purchase Order Reference", rate: 82.4, color: "bg-amber-500" }
            ].map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{f.field}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{f.rate}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color}`} style={{ width: `${f.rate}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors by Document Volume */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Top Vendor Processing Speed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated verification efficiency by key supplier accounts
          </p>

          <div className="space-y-3 pt-2">
            {[
              { name: "Apex Technology Solutions Inc", docs: 412, speed: "0.9s", status: "Auto-Approve Active" },
              { name: "Global Logistics Freight Express", docs: 289, speed: "1.4s", status: "Requires PO Verification" },
              { name: "Nordic Office & Industrial", docs: 198, speed: "1.1s", status: "Auto-Approve Active" },
              { name: "Office Depot Stores", docs: 142, speed: "0.8s", status: "Auto-Approve Active" }
            ].map((v, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{v.name}</h4>
                  <p className="text-[11px] text-slate-400">{v.docs} documents processed • Avg {v.speed}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
