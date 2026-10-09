import React, { createContext, useContext, useState } from 'react';
import { INITIAL_DOCUMENTS, RECENT_ACTIVITIES } from '../data/mockDocuments';
import { uploadDocument as apiUploadDocument, mapApiResponseToDocument } from '../services/documentApi';

const DocumentContext = createContext();

export function DocumentProvider({ children }) {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activities, setActivities] = useState(RECENT_ACTIVITIES);
  const [selectedDocId, setSelectedDocId] = useState('DOC-2026-891');
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'documents' | 'review' | 'analytics' | 'settings'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState(null);

  // Toast notification system
  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Change status of a document (Approved / Rejected / Pending Review)
  const updateDocumentStatus = (docId, newStatus, note = '') => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: newStatus,
            reviewNotes: note || doc.reviewNotes
          };
        }
        return doc;
      })
    );

    const doc = documents.find(d => d.id === docId);
    const docName = doc ? doc.fileName : docId;

    // Log Activity
    const newActivity = {
      id: `act-${Date.now()}`,
      user: "Current User",
      action: `Marked ${docName} as ${newStatus}`,
      time: "Just now",
      type: newStatus === 'Approved' ? 'approval' : newStatus === 'Rejected' ? 'rejection' : 'warning',
      docId: docId
    };
    setActivities(prev => [newActivity, ...prev]);

    if (newStatus === 'Approved') {
      addToast('success', 'Document Approved', `${docName} has been verified and synced with ERP ledger.`);
    } else if (newStatus === 'Rejected') {
      addToast('error', 'Document Rejected', `${docName} was marked as rejected.`);
    } else {
      addToast('info', 'Status Updated', `${docName} status changed to ${newStatus}.`);
    }
  };

  // Update specific header field value
  const updateDocumentField = (docId, fieldName, newValue) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            [fieldName]: newValue,
            confidenceScores: {
              ...doc.confidenceScores,
              [fieldName]: 100.0 // User edit sets confidence to 100%
            }
          };
        }
        return doc;
      })
    );
    addToast('info', 'Field Updated', `Field '${fieldName}' updated to "${newValue}".`);
  };

  // Update line item
  const updateLineItem = (docId, itemId, fieldName, newValue) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          const updatedLineItems = doc.lineItems.map(item => {
            if (item.id === itemId) {
              const updated = { ...item, [fieldName]: newValue, confidence: 100.0 };
              if (fieldName === 'qty' || fieldName === 'unitPrice') {
                const qty = fieldName === 'qty' ? parseFloat(newValue) || 0 : item.qty;
                const price = fieldName === 'unitPrice' ? parseFloat(newValue) || 0 : item.unitPrice;
                updated.amount = qty * price;
              }
              return updated;
            }
            return item;
          });
          // Recalculate subtotal and total
          const newSubtotal = updatedLineItems.reduce((acc, it) => acc + (it.amount || 0), 0);
          const newTotal = newSubtotal + (doc.taxAmount || 0);

          return {
            ...doc,
            lineItems: updatedLineItems,
            subtotal: newSubtotal,
            totalAmount: newTotal
          };
        }
        return doc;
      })
    );
  };

  // uploadRealDocument — calls the real API; throws on failure (no mock fallback)
  const uploadRealDocument = async (fileObj, meta = {}, onUploadProgress) => {
    setUploadError(null);

    // Call the API service layer
    const apiData = await apiUploadDocument(fileObj, onUploadProgress);

    // Map the raw API response to the frontend document shape
    const createdDoc = mapApiResponseToDocument(apiData, fileObj, meta.type || 'Invoice');

    // Add to document list
    setDocuments(prev => [createdDoc, ...prev]);

    // Add activity entry
    const newActivity = {
      id: `act-${Date.now()}`,
      user: 'Current User',
      action: `Uploaded ${createdDoc.fileName} (${createdDoc.type})`,
      time: 'Just now',
      type: 'extraction',
      docId: createdDoc.id,
    };
    setActivities(prev => [newActivity, ...prev]);

    const flagCount = createdDoc.validationWarnings.length;
    const flagNote = flagCount > 0 ? ` • ${flagCount} validation flag${flagCount > 1 ? 's' : ''}` : '';
    addToast(
      'success',
      'Document Processed',
      `${createdDoc.fileName} extracted with ${createdDoc.overallConfidence}% confidence${flagNote}.`
    );

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
        updateDocumentStatus,
        updateDocumentField,
        updateLineItem,
        uploadRealDocument,
        navigateToReview
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocuments = () => useContext(DocumentContext);
