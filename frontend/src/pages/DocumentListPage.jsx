import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { 
  FileText, Search, Filter, Eye, CheckCircle2, XCircle, AlertTriangle, 
  Download, ArrowUpDown, ChevronRight, Sparkles, CheckSquare, Square 
} from 'lucide-react';

export default function DocumentListPage() {
  const { 
    documents, 
    searchQuery, 
    setSearchQuery, 
    navigateToReview, 
    updateDocumentStatus,
    setIsUploadModalOpen,
    addToast
  } = useDocuments();

  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending Review' | 'Approved' | 'Rejected'
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Invoice' | 'Delivery Note' | 'Receipt'
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtering logic
  const filteredDocs = documents.filter(doc => {
    // Status filter
    if (statusFilter !== 'All' && doc.status !== statusFilter) return false;
    // Type filter
    if (typeFilter !== 'All' && doc.type !== typeFilter) return false;
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchVendor = (doc.vendor || '').toLowerCase().includes(q);
      const matchDocNum = (doc.documentNumber || '').toLowerCase().includes(q);
      const matchFile = (doc.fileName || '').toLowerCase().includes(q);
      const matchPO = (doc.purchaseOrder || '').toLowerCase().includes(q);
      const matchId = doc.id.toLowerCase().includes(q);
      return matchVendor || matchDocNum || matchFile || matchPO || matchId;
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map(d => d.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    selectedIds.forEach(id => {
      updateDocumentStatus(id, 'Approved', 'Batch approved from document list');
    });
    setSelectedIds([]);
  };

  const handleBatchExport = () => {
    const exportedData = documents.filter(d => selectedIds.includes(d.id));
    const jsonBlob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocScan_Export_${Date.now()}.json`;
    a.click();
    addToast('success', 'Batch Exported', `${selectedIds.length} document structures exported as JSON.`);
  };

  const statusCounts = {
    All: documents.length,
    'Pending Review': documents.filter(d => d.status === 'Pending Review').length,
    Approved: documents.filter(d => d.status === 'Approved').length,
    Rejected: documents.filter(d => d.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Document Repository
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and audit extracted document data structures
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <button
                onClick={handleBatchApprove}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve ({selectedIds.length})
              </button>
              <button
                onClick={handleBatchExport}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
          )}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        {/* Status Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['All', 'Pending Review', 'Approved', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  statusFilter === tab
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {statusCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Type:
            </span>
            {['All', 'Invoice', 'Delivery Note', 'Receipt'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-bold'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar inside Filters */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter table by filename, vendor, doc #, PO #..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="p-4 w-10 text-center">
                  <button onClick={handleSelectAll} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {selectedIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Document</th>
                <th className="p-4">Type</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Date / PO</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Confidence</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">No matching documents found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or upload a new file.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  const isApproved = doc.status === 'Approved';
                  const isRejected = doc.status === 'Rejected';
                  const isPending = doc.status === 'Pending Review';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button onClick={() => handleToggleSelect(doc.id)} className="p-1 text-slate-400 hover:text-brand-500">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span>{doc.fileName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          doc.type === 'Invoice'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : doc.type === 'Delivery Note'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        {doc.vendor}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        <div>{doc.issueDate}</div>
                        <div className="text-[11px] font-mono text-slate-400">{doc.purchaseOrder}</div>
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                        {doc.totalAmount != null ? `$${Number(doc.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          doc.overallConfidence >= 90
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : doc.overallConfidence >= 75
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        }`}>
                          {doc.overallConfidence}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isRejected
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {isPending && <AlertTriangle className="w-3 h-3" />}
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => navigateToReview(doc.id)}
                          className="p-1.5 bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors"
                          title="Open Document Reviewer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isPending && (
                          <>
                            <button
                              onClick={() => updateDocumentStatus(doc.id, 'Approved', 'Quick approved from table')}
                              className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Quick Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateDocumentStatus(doc.id, 'Rejected', 'Quick rejected from table')}
                              className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Quick Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
