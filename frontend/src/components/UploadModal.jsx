import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { X, UploadCloud, FileText, CheckCircle2, Loader2, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

// Upload phase labels displayed while the API call is in-flight
const UPLOAD_STEPS = [
  'Uploading document to server...',
  'Preprocessing image & deskewing...',
  'Extracting invoice schema with Vision AI...',
  'Validating totals, VOEN & business rules...',
  'Finalising results...',
];

export default function UploadModal() {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadRealDocument,
    setUploadError,
    navigateToReview,
  } = useDocuments();

  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Invoice');

  // ── State machine: 'idle' | 'uploading' | 'success' | 'error'
  const [phase, setPhase] = useState('idle');
  const [progressStep, setProgressStep] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successDoc, setSuccessDoc] = useState(null);

  if (!isUploadModalOpen) return null;

  const isProcessing = phase === 'uploading';

  // ── File input handlers ──────────────────────────────────────────────────

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  // ── Close / reset ────────────────────────────────────────────────────────

  const handleClose = () => {
    if (isProcessing) return;
    setIsUploadModalOpen(false);
    // reset after a short delay so the animation plays out cleanly
    setTimeout(() => {
      setFile(null);
      setPhase('idle');
      setProgressStep('');
      setUploadPct(0);
      setErrorMsg('');
      setSuccessDoc(null);
      setUploadError(null);
    }, 300);
  };

  const handleViewResult = () => {
    setIsUploadModalOpen(false);
    if (successDoc?.id) navigateToReview(successDoc.id);
  };

  // ── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setPhase('uploading');
    setUploadPct(0);
    setErrorMsg('');
    setUploadError(null);

    // Animate through step labels while the request is in-flight
    let stepIdx = 0;
    setProgressStep(UPLOAD_STEPS[0]);
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, UPLOAD_STEPS.length - 2); // stop before 'Finalising'
      setProgressStep(UPLOAD_STEPS[stepIdx]);
    }, 700);

    try {
      const doc = await uploadRealDocument(file, { type: docType }, (pct) => {
        setUploadPct(pct);
      });

      clearInterval(stepInterval);
      setProgressStep(UPLOAD_STEPS[UPLOAD_STEPS.length - 1]);
      setSuccessDoc(doc);
      setPhase('success');
    } catch (err) {
      clearInterval(stepInterval);
      const msg = err?.message || 'Upload failed. Please check the backend is running and try again.';
      setErrorMsg(msg);
      setUploadError(msg);
      setPhase('error');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transition-colors">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Upload Document</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scan Invoices, Delivery Notes, or Receipts</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
          {phase === 'success' && successDoc && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">Extraction Complete</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-semibold">{successDoc.fileName}</span> processed with{' '}
                    <span className="font-bold">{successDoc.overallConfidence}%</span> confidence.
                  </p>
                </div>
              </div>

              {/* Result summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Supplier</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">{successDoc.vendor}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Invoice #</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate block">{successDoc.documentNumber}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total</span>
                  <span className="font-bold text-brand-700 dark:text-brand-300">{successDoc.totalAmount != null ? `$${Number(successDoc.totalAmount).toFixed(2)}` : 'N/A'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                  <span className={`font-bold ${
                    successDoc.status === 'Approved'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>{successDoc.status}</span>
                </div>
              </div>

              {/* Validation flags summary */}
              {successDoc.validationWarnings.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <span className="font-bold">{successDoc.validationWarnings.length} validation flag{successDoc.validationWarnings.length > 1 ? 's' : ''} detected.</span>{' '}
                  Open the document reviewer to inspect and resolve them.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleViewResult}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Reviewer
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR STATE ───────────────────────────────────────────────── */}
          {phase === 'error' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-rose-900 dark:text-rose-100">Upload Failed</p>
                  <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ── IDLE / UPLOAD FORM ────────────────────────────────────────── */}
          {(phase === 'idle' || phase === 'uploading') && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-brand-500 text-white rounded-2xl shadow-md">
                        <FileText className="w-8 h-8" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{file.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • Click or drop to change
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl mb-1">
                        <UploadCloud className="w-8 h-8 text-brand-500" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        Drag and drop your document here
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Supports PDF, PNG, JPG (Max 15 MB)
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Document Classification
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Invoice', 'Delivery Note', 'Receipt'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setDocType(t)}
                      disabled={isProcessing}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
                        docType === t
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Processing state */}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="p-4 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-2xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin shrink-0" />
                    <div className="text-xs font-semibold text-brand-900 dark:text-brand-200">
                      {progressStep}
                    </div>
                  </div>
                  {/* Upload progress bar */}
                  {uploadPct > 0 && uploadPct < 100 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-1 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !file}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing AI Extraction...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run Extraction
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
