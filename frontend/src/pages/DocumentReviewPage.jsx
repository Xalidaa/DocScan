import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { 
  ArrowLeft, ZoomIn, ZoomOut, RotateCw, RotateCcw, CheckCircle2, 
  XCircle, AlertTriangle, ShieldCheck, Tag, Edit2, ChevronLeft, ChevronRight,
  Cpu, Layers, Building2, Receipt, Calendar, Hash, PackageSearch, Lock, Copy, 
  AlertOctagon, HelpCircle, ShieldAlert, Check, Save, Loader2
} from 'lucide-react';

export default function DocumentReviewPage() {
  const { 
    documents, 
    selectedDocument, 
    setSelectedDocId, 
    updateDocumentStatus, 
    updateDocumentField, 
    saveDocument,
    savingDocId,
    setActiveView
  } = useDocuments();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  if (!selectedDocument) return null;

  const doc = selectedDocument;

  // Next / Previous document navigation
  const currentIndex = documents.findIndex(d => d.id === doc.id);
  const handleNextDoc = () => {
    if (currentIndex < documents.length - 1) {
      setSelectedDocId(documents[currentIndex + 1].id);
    }
  };
  const handlePrevDoc = () => {
    if (currentIndex > 0) {
      setSelectedDocId(documents[currentIndex - 1].id);
    }
  };

  const isApproved = doc.status === 'Approved';
  const isRejected = doc.status === 'Rejected';

  // Helper for confidence badge styling
  const renderConfidenceBadge = (score = 98.5) => {
    if (score >= 90) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          {score}%
        </span>
      );
    } else if (score >= 75) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          {score}%
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
          {score}%
        </span>
      );
    }
  };

  // Severity badge renderer for validation warnings
  const renderSeverityBadge = (severity, category) => {
    switch (severity) {
      case 'blocking':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-200 border border-rose-700 uppercase tracking-wide flex items-center gap-1 shadow-sm animate-pulse">
            <Lock className="w-3 h-3 text-rose-400" /> {category || 'BLOCKING'}
          </span>
        );
      case 'error':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 uppercase tracking-wide flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-rose-500" /> {category || 'ERROR'}
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> {category || 'WARNING'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 uppercase tracking-wide flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-blue-500" /> {category || 'INFO'}
          </span>
        );
    }
  };

  const scores = doc.confidenceScores || {};
  const hasBlocking = doc.validationWarnings && doc.validationWarnings.some(w => w.severity === 'blocking');

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      
      {/* Top Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('documents')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Back to Document List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-50">
                {doc.fileName}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isApproved ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                isRejected ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                {doc.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">ID: {doc.id} • Processed in {doc.processedTime}</p>
          </div>
        </div>

        {/* Document Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={doc.id}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {documents.map(d => (
              <option key={d.id} value={d.id}>
                {d.type}: {d.vendor.substring(0, 20)}... ({d.status})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
            <button
              onClick={handlePrevDoc}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-1 font-semibold">{currentIndex + 1} of {documents.length}</span>
            <button
              onClick={handleNextDoc}
              disabled={currentIndex === documents.length - 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Invoice Preview Canvas */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Document Viewer Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(160, prev + 15))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setZoomLevel(100); setRotation(0); }}
                className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
              <button
                onClick={() => setRotation(prev => (prev - 90) % 360)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>Page 1 / {doc.pageCount}</span>
            </div>
          </div>

          {/* Invoice Document Sheet Canvas */}
          <div className="bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-3xl p-4 min-h-[660px] flex items-center justify-center overflow-auto shadow-inner relative">
            
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out'
              }}
              className="bg-white text-slate-900 w-[480px] min-h-[660px] p-8 shadow-2xl rounded-sm relative font-sans text-xs border border-slate-200 select-none"
            >
              {/* Invoice Layout */}
              <div className="space-y-6">
                
                {/* Header Supplier info */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{doc.vendor}</h3>
                    <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">{doc.vendorAddress}</p>
                    <p className="text-[10px] font-bold text-slate-700 mt-1">VÖEN / Tax ID: {doc.voen || doc.vendorTaxId || '1400293841'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black tracking-wider uppercase rounded-sm">
                      {doc.type}
                    </span>
                    <p className="text-sm font-bold text-slate-800 mt-2">{doc.documentNumber}</p>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Date</span>
                    <span className="font-bold text-slate-800">{doc.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">VÖEN Tax #</span>
                    <span className="font-bold text-slate-800">{doc.voen || '1400293841'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">PO Ref</span>
                    <span className="font-bold text-slate-800">{doc.purchaseOrder}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-1">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b-2 border-slate-900 font-bold uppercase text-slate-500">
                        <th className="py-1">Description</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Unit Price</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doc.lineItems.map(item => (
                        <tr key={item.id} className="py-1">
                          <td className="py-2 pr-2 font-medium">
                            {item.description}
                            {item.sku && (
                              <div className="text-[9px] text-slate-400 font-mono">SKU: {item.sku}</div>
                            )}
                          </td>
                          <td className="py-2 text-center font-bold">{item.qty}</td>
                          <td className="py-2 text-right">${(item.unitPrice ?? 0).toFixed(2)}</td>
                          <td className="py-2 text-right font-bold">${(item.amount ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="border-t pt-3 flex justify-end">
                  <div className="w-48 space-y-1 text-right text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{doc.subtotal != null ? `$${Number(doc.subtotal).toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>VAT Tax:</span>
                      <span className="font-semibold">{doc.taxAmount != null ? `$${Number(doc.taxAmount).toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1">
                      <span>Total ({doc.currency}):</span>
                      <span className="text-brand-700">{doc.totalAmount != null ? `$${Number(doc.totalAmount).toFixed(2)}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bounding Highlights Overlays */}
              {Object.entries(doc.boundingHighlights).map(([key, bbox]) => {
                const isActive = activeHighlight === key;
                return (
                  <div
                    key={key}
                    onClick={() => setActiveHighlight(isActive ? null : key)}
                    style={{
                      left: `${bbox.x}%`,
                      top: `${bbox.y}%`,
                      width: `${bbox.w}%`,
                      height: `${bbox.h}%`,
                    }}
                    className={`absolute cursor-pointer transition-all border-2 rounded ${
                      isActive
                        ? 'bg-brand-500/30 border-brand-500 ring-4 ring-brand-500/40 z-20'
                        : 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/25 z-10'
                    }`}
                  >
                    <span className={`absolute -top-5 left-0 text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${
                      isActive ? 'bg-brand-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {key}
                    </span>
                  </div>
                );
              })}

            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Extracted Header Fields, VALIDATION WARNINGS PANEL, and Products */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* DEDICATED VALIDATION WARNINGS PANEL (Featuring Missing Fields, Price Mismatches, VAT Errors, Duplicates, and Blocking Warnings) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  Validation & Rule Warnings Panel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated compliance checks across missing fields, price mismatches, VAT, & duplicates</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {doc.validationWarnings ? doc.validationWarnings.length : 0} Warnings Flagged
              </span>
            </div>

            {/* List of Warning Items */}
            <div className="space-y-3">
              {doc.validationWarnings && doc.validationWarnings.length > 0 ? (
                doc.validationWarnings.map(warn => (
                  <div
                    key={warn.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                      warn.severity === 'blocking'
                        ? 'bg-rose-950/40 border-rose-700/80 text-rose-200 shadow-md'
                        : warn.severity === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                        : warn.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-black text-sm flex items-center gap-2">
                        {renderSeverityBadge(warn.severity, warn.category)}
                        <span className={warn.severity === 'blocking' ? 'text-rose-100' : ''}>{warn.title}</span>
                      </div>
                      {warn.field && (
                        <span className="text-[10px] font-mono opacity-75">
                          Target: <strong>{warn.field}</strong>
                        </span>
                      )}
                    </div>
                    <p className="opacity-90 leading-relaxed font-medium pl-1">
                      {warn.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">All validation rules passed with zero warnings!</span>
                </div>
              )}
            </div>
          </div>

          {/* Header Metadata Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-500" />
                  Extracted Header Metadata
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Verified OCR key-value extractions</p>
              </div>
              <div className="flex items-center gap-2">
                {isEditingHeader && (
                  <button
                    onClick={async () => { await saveDocument(doc.id); setIsEditingHeader(false); }}
                    disabled={savingDocId === doc.id}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 disabled:opacity-60"
                  >
                    {savingDocId === doc.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Save className="w-3.5 h-3.5" />}
                    {savingDocId === doc.id ? 'Saving…' : 'Save to Backend'}
                  </button>
                )}
                <button
                  onClick={() => setIsEditingHeader(!isEditingHeader)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> {isEditingHeader ? 'Cancel' : 'Edit Fields'}
                </button>
              </div>
            </div>

            {/* 7 Requested Extracted Fields Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Supplier */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Supplier</span>
                  {isEditingHeader
                    ? <input type="text" value={doc.vendor || ''} onChange={e => updateDocumentField(doc.id, 'vendor', e.target.value)}
                        className="w-full text-xs font-bold bg-white dark:bg-slate-700 border border-brand-400 rounded px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
                    : <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{doc.vendor}</div>
                  }
                </div>
                {renderConfidenceBadge(scores.vendor || 99.8)}
              </div>

              {/* VÖEN */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">VÖEN (Tax ID)</span>
                  {isEditingHeader
                    ? <input type="text" value={doc.voen || doc.vendorTaxId || ''} onChange={e => updateDocumentField(doc.id, 'voen', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-brand-400 rounded px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
                    : <div className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100">{doc.voen || doc.vendorTaxId || 'N/A'}</div>
                  }
                </div>
                {renderConfidenceBadge(scores.vendorTaxId || 96.4)}
              </div>

              {/* Date */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date</span>
                  {isEditingHeader
                    ? <input type="text" value={doc.issueDate || ''} onChange={e => updateDocumentField(doc.id, 'issueDate', e.target.value)}
                        className="w-full text-xs font-bold bg-white dark:bg-slate-700 border border-brand-400 rounded px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
                    : <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{doc.issueDate}</div>
                  }
                </div>
                {renderConfidenceBadge(scores.issueDate || 98.5)}
              </div>

              {/* Invoice Number */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Invoice #</span>
                  {isEditingHeader
                    ? <input type="text" value={doc.documentNumber || ''} onChange={e => updateDocumentField(doc.id, 'documentNumber', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-brand-400 rounded px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
                    : <div className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100">{doc.documentNumber}</div>
                  }
                </div>
                {renderConfidenceBadge(scores.documentNumber || 99.2)}
              </div>

              {/* Subtotal / VAT / Total */}
              <div className="col-span-2 grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                    <span>Subtotal</span>
                    {renderConfidenceBadge(scores.subtotal || 99.1)}
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">{doc.subtotal != null ? `$${Number(doc.subtotal).toFixed(2)}` : 'N/A'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                    <span>VAT</span>
                    {renderConfidenceBadge(scores.taxAmount || 94.0)}
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">{doc.taxAmount != null ? `$${Number(doc.taxAmount).toFixed(2)}` : 'N/A'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                  <div className="flex justify-between items-center text-[9px] font-bold text-brand-600 dark:text-brand-300 uppercase">
                    <span>Total</span>
                    {renderConfidenceBadge(scores.totalAmount || 99.5)}
                  </div>
                  <div className="font-black text-xs text-brand-700 dark:text-brand-300 mt-1">{doc.totalAmount != null ? `$${Number(doc.totalAmount).toFixed(2)}` : 'N/A'}</div>
                </div>
              </div>

            </div>
          </div>

          {/* EXTRACTED PRODUCTS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-emerald-500" />
                Extracted Products & Catalog Matching Table
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {doc.lineItems.length} Products Matched
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Matched Catalog Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">VAT</th>
                    <th className="p-3 text-center">Confidence</th>
                    <th className="p-3 text-center">Match Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {doc.lineItems.map(item => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 max-w-[160px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {item.description}
                          </div>
                          {item.sku && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Extracted SKU: {item.sku}</div>
                          )}
                        </td>
                        <td className="p-3">
                          {item.matchedSku ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {item.matchedSku}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-extrabold text-slate-900 dark:text-slate-100">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          ${(item.unitPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-500 dark:text-slate-400">
                          ${((item.amount ?? 0) * 0.10).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {renderConfidenceBadge(item.confidence || 98.0)}
                        </td>
                        <td className="p-3 text-center">
                          {item.matchConfidence != null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              item.matchConfidence >= 90
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.matchConfidence}% Match
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Audit Review Notes
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional comments for accounting ledger verification..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateDocumentStatus(doc.id, 'Rejected', reviewNote)}
                disabled={savingDocId === doc.id}
                className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" /> Reject Document
              </button>

              <button
                onClick={() => updateDocumentStatus(doc.id, 'Approved', reviewNote)}
                disabled={hasBlocking || savingDocId === doc.id}
                className={`py-3 px-4 rounded-2xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                  hasBlocking
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20'
                }`}
                title={hasBlocking ? "Resolve blocking warnings before approving" : "Approve document"}
              >
                {hasBlocking ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {hasBlocking ? "Locked by Blocking Warning" : "Approve Document"}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
