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
// ─── Update a document's extracted fields via PUT ──────────────────────────
/**
 * Sends edited invoice header fields and line items to the backend.
 * Only explicitly included fields are updated (partial update via model_fields_set).
 *
 * @param {string} documentId  Backend document UUID
 * @param {object} fields      Object with keys: supplier, voen, invoice_number, date,
 *                             subtotal, vat, total, items (optional)
 * @returns {Promise<object>}  Raw InvoiceUploadResponse from the backend
 */
export async function updateDocument(documentId, fields) {
  const { data } = await api.put(`/documents/${documentId}`, fields);
  return data;
}

// ─── Update a document's status only (approve / reject) ────────────────────
/**
 * @param {string} documentId
 * @param {'approved'|'rejected'} status  Lowercase status string
 * @param {string} [note]                 Optional audit note
 * @returns {Promise<object>}  Raw InvoiceUploadResponse from the backend
 */
export async function patchDocumentStatus(documentId, status, note = '') {
  const { data } = await api.patch(`/documents/${documentId}/status`, { status, note });
  return data;
}

// ─── Merge a server update response back into an existing frontend doc ──────
/**
 * Applies the server's InvoiceUploadResponse on top of an existing frontend doc object.
 * Fields the server doesn't know about (fileName, type, confidenceScores, etc.)
 * are preserved from the existing doc.
 *
 * @param {object} existing  Existing frontend document object
 * @param {object} apiData   Raw server response from updateDocument() or patchDocumentStatus()
 * @returns {object}  Updated frontend document object
 */
export function mergeApiUpdate(existing, apiData) {
  const statusMap = {
    received: 'Pending Review',
    review_required: 'Pending Review',
    processing: 'Processing',
    approved: 'Approved',
    rejected: 'Rejected',
    exported: 'Approved',
  };

  const lineItems = (apiData.items ?? []).map((item, idx) => ({
    // Try to preserve the existing id so React keys are stable
    id: existing.lineItems?.[idx]?.id ?? `api-item-${idx}`,
    description: item.name ?? 'Line Item',
    sku: null,
    matchedSku: item.matched_product_code ?? null,
    matchedProductName: item.matched_product_name ?? null,
    matchConfidence: item.match_confidence ?? null,
    qty: item.quantity ?? 1,
    unitPrice: item.unit_price ?? 0,
    amount: item.total ?? 0,
    confidence: existing.overallConfidence ?? 100,
  }));

  // Rebuild per-field confidence at 100 for edited fields
  const confidenceScores = {
    ...existing.confidenceScores,
    documentNumber: 100,
    issueDate: 100,
    vendor: 100,
    vendorTaxId: 100,
    subtotal: 100,
    taxAmount: 100,
    totalAmount: 100,
  };

  const validationWarnings = (apiData.flags ?? []).map((flagMsg, idx) => {
    let severity = 'warning';
    if (typeof flagMsg === 'string') {
      if (flagMsg.toLowerCase().includes('missing') && flagMsg.toLowerCase().includes('supplier')) severity = 'error';
      else if (flagMsg.toLowerCase().includes('mismatch') || flagMsg.toLowerCase().includes('invalid')) severity = 'error';
      return {
        id: `api-flag-${idx}`,
        severity,
        category: 'Validation Flag',
        title: flagMsg.split(':')[0]?.trim() ?? 'Validation Issue',
        message: flagMsg,
      };
    }
    // flags may be dicts from backend
    return {
      id: `api-flag-${idx}`,
      severity: flagMsg.severity ?? 'warning',
      category: flagMsg.category ?? 'Validation Flag',
      title: flagMsg.title ?? 'Issue',
      message: flagMsg.message ?? JSON.stringify(flagMsg),
    };
  });

  return {
    ...existing,
    status: statusMap[apiData.status] ?? existing.status,
    vendor: apiData.supplier ?? existing.vendor,
    vendorTaxId: apiData.voen ?? existing.vendorTaxId,
    voen: apiData.voen ?? existing.voen,
    documentNumber: apiData.invoice_number ?? existing.documentNumber,
    issueDate: apiData.date ?? existing.issueDate,
    subtotal: apiData.subtotal ?? existing.subtotal,
    taxAmount: apiData.vat ?? existing.taxAmount,
    totalAmount: apiData.total ?? existing.totalAmount,
    lineItems: lineItems.length > 0 ? lineItems : existing.lineItems,
    confidenceScores,
    validationWarnings,
    overallConfidence: Math.round((apiData.confidence ?? existing.overallConfidence / 100) * 1000) / 10,
  };
}
