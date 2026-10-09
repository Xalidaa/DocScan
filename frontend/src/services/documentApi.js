/**
 * documentApi.js
 * Clean API service layer for the DocScan Agent backend.
 * All methods throw on failure — callers handle errors explicitly.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s — LLM extraction can take a while
});

// ─── Response interceptor: normalise error messages ────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(detail));
  }
);

// ─── Upload a document file and receive extracted invoice data ──────────────
/**
 * @param {File} file  A File object (PDF / JPG / PNG)
 * @param {(pct: number) => void} [onProgress]  Optional upload-progress callback (0-100)
 * @returns {Promise<object>}  Raw InvoiceUploadResponse from the backend
 */
export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          onProgress(pct);
        }
      : undefined,
  });

  return data;
}

// ─── List all documents (paginated) ────────────────────────────────────────
export async function listDocuments(params = {}) {
  const { data } = await api.get('/documents', { params });
  return data;
}

// ─── Fetch a single document by ID ─────────────────────────────────────────
export async function getDocument(documentId) {
  const { data } = await api.get(`/documents/${documentId}`);
  return data;
}

// ─── Map raw API response to the frontend document shape ───────────────────
/**
 * Converts an InvoiceUploadResponse from the backend into the document object
 * shape expected by DocumentContext and all UI components.
 *
 * @param {object} apiData   Raw response from uploadDocument()
 * @param {File}   file      The original File object uploaded by the user
 * @param {string} docType   User-selected doc type ('Invoice' | 'Delivery Note' | 'Receipt')
 * @returns {object}  Frontend document object
 */
export function mapApiResponseToDocument(apiData, file, docType = 'Invoice') {
  const confidencePct = Math.round((apiData.confidence ?? 0.9) * 1000) / 10;

  // Map backend status → UI status label
  const statusMap = {
    received: 'Pending Review',
    review_required: 'Pending Review',
    processing: 'Processing',
    approved: 'Approved',
    rejected: 'Rejected',
    exported: 'Approved',
  };
  const status = statusMap[apiData.status] ?? 'Pending Review';

  // Map validation flags (plain strings) → warning objects the UI can render
  const validationWarnings = (apiData.flags ?? []).map((flagMsg, idx) => {
    // Determine severity from content keywords
    let severity = 'warning';
    if (flagMsg.toLowerCase().includes('missing') && flagMsg.toLowerCase().includes('supplier')) {
      severity = 'error';
    } else if (flagMsg.toLowerCase().includes('mismatch') || flagMsg.toLowerCase().includes('invalid')) {
      severity = 'error';
    }
    return {
      id: `api-flag-${idx}`,
      severity,
      category: 'Validation Flag',
      title: flagMsg.split(':')[0]?.trim() ?? 'Validation Issue',
      message: flagMsg,
    };
  });

  // Map API line items → UI line item shape
  const lineItems = (apiData.items ?? []).map((item, idx) => ({
    id: `api-item-${idx}`,
    description: item.name ?? 'Line Item',
    sku: null,
    matchedSku: null,
    matchConfidence: null,
    qty: item.quantity ?? 1,
    unitPrice: item.unit_price ?? 0,
    amount: item.total ?? 0,
    confidence: confidencePct,
  }));

  // Spread overall confidence to per-field scores (backend provides one scalar)
  const confidenceScores = {
    documentNumber: confidencePct,
    issueDate: confidencePct,
    vendor: confidencePct,
    vendorTaxId: confidencePct,
    purchaseOrder: confidencePct,
    subtotal: confidencePct,
    taxAmount: confidencePct,
    totalAmount: confidencePct,
  };

  return {
    // Identity
    id: apiData.document_id,
    fileName: file?.name ?? apiData.filename ?? 'Uploaded_Document.pdf',
    type: docType,
    status,
    overallConfidence: confidencePct,
    uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    processedTime: 'via API',

    // Vendor / supplier
    vendor: apiData.supplier ?? 'Unknown Vendor',
    vendorAddress: '',
    vendorTaxId: apiData.voen ?? 'N/A',
    voen: apiData.voen ?? null,

    // Invoice header fields
    documentNumber: apiData.invoice_number ?? `DOC-${apiData.document_id.substring(0, 6)}`,
    issueDate: apiData.date ?? new Date().toISOString().substring(0, 10),
    dueDate: 'N/A',
    purchaseOrder: 'N/A',

    // Financials
    subtotal: apiData.subtotal ?? 0,
    taxAmount: apiData.vat ?? 0,
    totalAmount: apiData.total ?? 0,
    currency: 'USD',

    // Quality & validation
    confidenceScores,
    validationWarnings,

    // Line items
    lineItems,

    // Document viewer meta
    pageCount: 1,
    boundingHighlights: {}, // not provided by backend; empty = no overlays shown
  };
}
