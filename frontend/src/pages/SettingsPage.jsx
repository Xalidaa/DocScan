import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { Settings, Shield, Sliders, Database, Bell, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useDocuments();
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(90);
  const [fuzzyMatchThreshold, setFuzzyMatchThreshold] = useState(85);
  const [poLimitTolerance, setPoLimitTolerance] = useState(5);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [erpSync, setErpSync] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', 'DocScan Agent rules and confidence thresholds updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Rules Engine & Agent Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure auto-verification thresholds, ERP database hooks, and validation tolerance.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Confidence Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-500" />
            Auto-Approval & Verification Rules
          </h3>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-800 dark:text-slate-200">
                  Straight-Through Auto-Approve Threshold ({autoApproveThreshold}%)
                </span>
                <span className="text-brand-600 dark:text-brand-400">
                  Docs ≥ {autoApproveThreshold}% confidence pass without manual review
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={autoApproveThreshold}
                onChange={(e) => setAutoApproveThreshold(e.target.value)}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-800 dark:text-slate-200">
                  ERP SKU Fuzzy Product Matching ({fuzzyMatchThreshold}%)
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  Required string match ratio for SKU catalog auto-link
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={fuzzyMatchThreshold}
                onChange={(e) => setFuzzyMatchThreshold(e.target.value)}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-800 dark:text-slate-200">
                  PO Max Amount Variance Tolerance ({poLimitTolerance}%)
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  Allowed invoice amount buffer over PO budget before alert
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={poLimitTolerance}
                onChange={(e) => setPoLimitTolerance(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            ERP Integration Ledger Sync
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">SAP S/4HANA & NetSuite Webhook</h4>
                <p className="text-[11px] text-slate-400">Real-time sync approved documents to general ledger</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={erpSync}
                  onChange={(e) => setErpSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Instant Email Notifications</h4>
                <p className="text-[11px] text-slate-400">Send audit alerts when low confidence documents enter queue</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
}
