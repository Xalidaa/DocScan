import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_DOCUMENTS, RECENT_ACTIVITIES } from '../data/mockDocuments';
import {
  listDocuments,
  mapListItemToDocument,
  uploadDocument as apiUploadDocument,
  mapApiResponseToDocument,
  updateDocument as apiUpdateDocument,
  patchDocumentStatus as apiPatchStatus,
  mergeApiUpdate,
} from '../services/documentApi';

const DocumentContext = createContext();

export function DocumentProvider({ children }) {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activities, setActivities] = useState(RECENT_ACTIVITIES);
  const [selectedDocId, setSelectedDocId] = useState('DOC-2026-891');
  const [activeView, setActiveView] = useState('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [savingDocId, setSavingDocId] = useState(null);

  // ── Fetch existing documents from live FastAPI backend on mount ───────────
  useEffect(() => {
    let isMounted = true;
    async function fetchRemoteDocuments() {
      try {
        const remoteDocs = await listDocuments();
        if (!isMounted || !Array.isArray(remoteDocs) || remoteDocs.length === 0) return;
        const mappedRemote = remoteDocs.map(mapListItemToDocument);
        setDocuments(prevDocs => {
          const existingIds = new Set(prevDocs.map(d => d.id));
          const newDocs = mappedRemote.filter(d => !existingIds.has(d.id));
          if (newDocs.length === 0) return prevDocs;
          return [...newDocs, ...prevDocs];
        });
      } catch (err) {
        console.warn('Could not fetch backend documents on mount:', err?.message || err);
      }
    }
    fetchRemoteDocuments();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Toast notification system ─────────────────────────────────────────────
  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ── Update a specific header field (local state only; call saveDocument to persist) ──
  const updateDocumentField = (docId, fieldName, newValue) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          [fieldName]: newValue,
          confidenceScores: {
            ...doc.confidenceScores,
            [fieldName]: 100.0,
          },
        };
      })
    );
  };

  // ── Update a line item (local state only; call saveDocument to persist) ───
  const updateLineItem = (docId, itemId, fieldName, newValue) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id !== docId) return doc;
        const updatedLineItems = doc.lineItems.map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [fieldName]: newValue, confidence: 100.0 };
          if (fieldName === 'qty' || fieldName === 'unitPrice') {
            const qty = fieldName === 'qty' ? parseFloat(newValue) || 0 : item.qty;
            const price = fieldName === 'unitPrice' ? parseFloat(newValue) || 0 : item.unitPrice;
            updated.amount = qty * price;
          }
          return updated;
        });
        const newSubtotal = updatedLineItems.reduce((acc, it) => acc + (it.amount || 0), 0);
        const newTotal = newSubtotal + (doc.taxAmount || 0);
        return { ...doc, lineItems: updatedLineItems, subtotal: newSubtotal, totalAmount: newTotal };
      })
    );
  };

  // ── Persist all edits for a document via PUT /api/documents/{id} ──────────
  const saveDocument = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    // Demo documents (mock IDs) cannot be persisted to backend
    if (!docId || docId.startsWith('DOC-')) {
      addToast('warning', 'Demo Document', 'This is a demo document and cannot be saved to the backend.');
      return;
    }

    setSavingDocId(docId);
    try {
      // Map frontend field names → backend InvoiceExtractionSchema field names
      const payload = {
        supplier: doc.vendor ?? null,
        voen: doc.voen ?? doc.vendorTaxId ?? null,
        invoice_number: doc.documentNumber ?? null,
        date: doc.issueDate ?? null,
        subtotal: doc.subtotal ?? null,
        vat: doc.taxAmount ?? null,
        total: doc.totalAmount ?? null,
        items: (doc.lineItems ?? []).map(item => ({
          name: item.description ?? '',
          quantity: item.qty ?? 1,
          unit_price: item.unitPrice ?? 0,
          total: item.amount ?? 0,
        })),
      };

      const apiData = await apiUpdateDocument(docId, payload);

      // Sync React state with the server's authoritative response
      setDocuments(prev =>
        prev.map(d => d.id === docId ? mergeApiUpdate(d, apiData) : d)
      );

      setActivities(prev => [{
        id: `act-${Date.now()}`,
        user: 'Current User',
        action: `Saved edits to ${doc.fileName}`,
        time: 'Just now',
        type: 'extraction',
        docId,
      }, ...prev]);

      addToast('success', 'Changes Saved', `${doc.fileName} has been updated and verified.`);
    } catch (err) {
      // Don't revert local state — user can fix errors and retry
      addToast('error', 'Save Failed', err.message ?? 'Could not save changes. Please try again.');
    } finally {
      setSavingDocId(null);
    }
  };

  // ── Change document status via PATCH /api/documents/{id}/status ───────────
  const updateDocumentStatus = async (docId, newStatus, note = '') => {
    const doc = documents.find(d => d.id === docId);
    const docName = doc ? doc.fileName : docId;

    // Demo documents: apply locally, no API call
    if (!docId || docId.startsWith('DOC-')) {
      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, status: newStatus, reviewNotes: note || d.reviewNotes } : d)
      );
      setActivities(prev => [{
        id: `act-${Date.now()}`,
        user: 'Current User',
        action: `Marked ${docName} as ${newStatus}`,
        time: 'Just now',
        type: newStatus === 'Approved' ? 'approval' : newStatus === 'Rejected' ? 'rejection' : 'warning',
        docId,
      }, ...prev]);
      if (newStatus === 'Approved') addToast('success', 'Document Approved', `${docName} has been verified.`);
      else if (newStatus === 'Rejected') addToast('error', 'Document Rejected', `${docName} was marked as rejected.`);
      else addToast('info', 'Status Updated', `${docName} status changed to ${newStatus}.`);
      return;
    }

    // Optimistic update
    const prevStatus = doc?.status;
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, status: newStatus, reviewNotes: note || d?.reviewNotes } : d)
    );

    try {
      // Map UI labels → backend lowercase status strings
      const statusApiMap = { 'Approved': 'approved', 'Rejected': 'rejected' };
      const apiStatus = statusApiMap[newStatus] ?? newStatus.toLowerCase();
      const apiData = await apiPatchStatus(docId, apiStatus, note);

      // Sync with server-authoritative response
      setDocuments(prev =>
        prev.map(d => d.id === docId ? mergeApiUpdate(d, apiData) : d)
      );

      setActivities(prev => [{
        id: `act-${Date.now()}`,
        user: 'Current User',
        action: `Marked ${docName} as ${newStatus}`,
        time: 'Just now',
        type: newStatus === 'Approved' ? 'approval' : newStatus === 'Rejected' ? 'rejection' : 'warning',
        docId,
      }, ...prev]);

      if (newStatus === 'Approved') addToast('success', 'Document Approved', `${docName} has been verified and synced with ERP ledger.`);
      else if (newStatus === 'Rejected') addToast('error', 'Document Rejected', `${docName} was marked as rejected.`);
      else addToast('info', 'Status Updated', `${docName} status changed to ${newStatus}.`);
    } catch (err) {
      // Rollback optimistic update on failure
      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, status: prevStatus } : d)
      );
      addToast('error', 'Status Update Failed', err.message ?? 'Could not update document status. Please try again.');
    }
  };

  // ── Upload a real document via POST /api/documents/upload ─────────────────
  const uploadRealDocument = async (fileObj, meta = {}, onUploadProgress) => {
    setUploadError(null);
    const apiData = await apiUploadDocument(fileObj, onUploadProgress);
    const createdDoc = mapApiResponseToDocument(apiData, fileObj, meta.type || 'Invoice');

    setDocuments(prev => [createdDoc, ...prev]);
    setActivities(prev => [{
      id: `act-${Date.now()}`,
      user: 'Current User',
      action: `Uploaded ${createdDoc.fileName} (${createdDoc.type})`,
      time: 'Just now',
      type: 'extraction',
      docId: createdDoc.id,
    }, ...prev]);

    const flagCount = createdDoc.validationWarnings.length;
    const flagNote = flagCount > 0 ? ` • ${flagCount} validation flag${flagCount > 1 ? 's' : ''}` : '';
    addToast('success', 'Document Processed',
      `${createdDoc.fileName} extracted with ${createdDoc.overallConfidence}% confidence${flagNote}.`);

    return createdDoc;
  };

  const navigateToReview = (docId) => {
    if (docId) setSelectedDocId(docId);
    setActiveView('review');
  };

  const selectedDocument = documents.find(d => d.id === selectedDocId) || documents[0];

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activities,
        selectedDocId,
        setSelectedDocId,
        selectedDocument,
        activeView,
        setActiveView,
        isUploadModalOpen,
        setIsUploadModalOpen,
        uploadError,
        setUploadError,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        savingDocId,
        updateDocumentStatus,
        updateDocumentField,
        updateLineItem,
        saveDocument,
        uploadRealDocument,
        navigateToReview,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocuments = () => useContext(DocumentContext);
