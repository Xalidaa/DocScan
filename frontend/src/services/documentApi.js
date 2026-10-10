/**
 * documentApi.js
 * Clean API service layer for the DocScan Agent backend.
 * All methods throw on failure — callers handle errors explicitly.
 */

import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
let baseURL = '/api';
if (rawBase) {
  const trimmed = rawBase.replace(/\/$/, '');
  baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL,
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

// ─── Helper: Format validation flags (handles string or object flags) ──────
function formatValidationFlags(flags) {
  if (!Array.isArray(flags)) return [];
  return flags.map((flag, idx) => {
    if (typeof flag === 'string') {
      let severity = 'warning';
      const lower = flag.toLowerCase();
      if (lower.includes('missing') || lower.includes('mismatch') || lower.includes('invalid')) {
        severity = 'error';
      }
      return {
        id: `api-flag-${idx}`,
        severity,
        category: 'Validation Flag',
        title: flag.split(':')[0]?.trim() || 'Validation Issue',
        message: flag,
      };
    }
    if (typeof flag === 'object' && flag !== null) {
      let severity = 'warning';
      if (flag.severity === 'blocking' || flag.severity === 'error') {
        severity = 'error';
      } else if (flag.severity) {
        severity = flag.severity;
      }
      const title = flag.title || flag.field || flag.type || 'Validation Issue';
      const message = flag.message || flag.text || JSON.stringify(flag);
      const category = flag.type || flag.category || 'Validation Flag';
      return {
        id: `api-flag-${idx}`,
        severity,
        category,
        title: String(title),
        message: String(message),
      };
    }
    return {
      id: `api-flag-${idx}`,
      severity: 'warning',
      category: 'Validation Flag',
      title: 'Validation Issue',
      message: String(flag),
    };
  });
}

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

// ─── Map backend DocumentResponse item to frontend document shape ──────────
export function mapListItemToDocument(doc) {
  return mapApiResponseToDocument(doc, null, doc.document_type || 'Invoice');
}

// ─── Fetch a single document by ID ─────────────────────────────────────────
export async function getDocument(documentId) {
  const { data } = await api.get(`/documents/${documentId}`);
  return data;
}

// ─── Map raw API response to the frontend document shape ───────────────────
/**
 * Converts an InvoiceUploadResponse or DocumentResponse from the backend into the
 * document object shape expected by DocumentContext and all UI components.
 *
 * @param {object} apiData   Raw response from uploadDocument(), getDocument(), or listDocuments()
 * @param {File}   [file]    The original File object uploaded by the user
 * @param {string} [docType] User-selected doc type ('Invoice' | 'Delivery Note' | 'Receipt')
 * @returns {object}  Frontend document object
 */
export function mapApiResponseToDocument(apiData, file, docType = 'Invoice') {
  const docId = apiData.id || apiData.document_id;
  const confidencePct = Math.round((apiData.confidence ?? 0.9) * 1000) / 10;
  const shortId = typeof docId === 'string' && docId.length >= 6 ? docId.substring(0, 6) : docId;

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

  // Map validation flags (objects or strings) → warning objects the UI can render
  const validationWarnings = formatValidationFlags(apiData.flags);

  // Map API line items → UI line item shape
  const lineItems = (apiData.items ?? []).map((item, idx) => ({
    id: `api-item-${idx}`,
    description: item.name ?? 'Line Item',
    sku: item.matched_product_code ?? null,
    matchedSku: item.matched_product_code ?? null,
    matchedProductName: item.matched_product_name ?? null,
    matchConfidence: item.match_confidence ?? null,
    qty: item.quantity ?? null,
    unitPrice: item.unit_price ?? null,
    amount: item.total ?? null,
    confidence: confidencePct,
  }));

  // Spread overall confidence to per-field scores
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

  let uploadDate = '';
  let issueDate = apiData.date || '';
  if (apiData.created_at) {
    try {
      const d = new Date(apiData.created_at);
      uploadDate = d.toISOString().replace('T', ' ').substring(0, 16);
      if (!issueDate) issueDate = d.toISOString().substring(0, 10);
    } catch {
      uploadDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
      if (!issueDate) issueDate = new Date().toISOString().substring(0, 10);
    }
  } else {
    uploadDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (!issueDate) issueDate = new Date().toISOString().substring(0, 10);
  }

  return {
    // Identity
    id: docId,
    fileName: file?.name ?? apiData.filename ?? 'Uploaded_Document.pdf',
    type: apiData.document_type || docType,
    status,
    overallConfidence: confidencePct,
    uploadDate,
    processedTime: 'via API',

    // Vendor / supplier
    vendor: apiData.supplier ?? 'N/A',
    vendorAddress: '',
    vendorTaxId: apiData.voen ?? 'N/A',
    voen: apiData.voen ?? null,

    // Invoice header fields
    documentNumber: apiData.invoice_number || (shortId ? `DOC-${shortId}` : 'N/A'),
    issueDate: issueDate || 'N/A',
    dueDate: 'N/A',
    purchaseOrder: 'N/A',

    // Financials
    subtotal: apiData.subtotal ?? null,
    taxAmount: apiData.vat ?? null,
    totalAmount: apiData.total ?? null,
    currency: 'USD',

    // Quality & validation
    confidenceScores,
    validationWarnings,

    // Line items
    lineItems,

    // Document viewer meta
    pageCount: 1,
    boundingHighlights: {},
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
    sku: item.matched_product_code ?? existing.lineItems?.[idx]?.sku ?? null,
    matchedSku: item.matched_product_code ?? null,
    matchedProductName: item.matched_product_name ?? null,
    matchConfidence: item.match_confidence ?? null,
    qty: item.quantity ?? null,
    unitPrice: item.unit_price ?? null,
    amount: item.total ?? null,
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

  const validationWarnings = formatValidationFlags(apiData.flags);

  return {
    ...existing,
    status: statusMap[apiData.status] ?? existing.status,
    vendor: apiData.supplier !== undefined ? (apiData.supplier ?? 'N/A') : existing.vendor,
    vendorTaxId: apiData.voen !== undefined ? (apiData.voen ?? 'N/A') : existing.vendorTaxId,
    voen: apiData.voen !== undefined ? apiData.voen : existing.voen,
    documentNumber: apiData.invoice_number !== undefined ? (apiData.invoice_number || existing.documentNumber) : existing.documentNumber,
    issueDate: apiData.date !== undefined ? (apiData.date || existing.issueDate) : existing.issueDate,
    subtotal: apiData.subtotal !== undefined ? apiData.subtotal : existing.subtotal,
    taxAmount: apiData.vat !== undefined ? apiData.vat : existing.taxAmount,
    totalAmount: apiData.total !== undefined ? apiData.total : existing.totalAmount,
    lineItems: lineItems.length > 0 ? lineItems : existing.lineItems,
    confidenceScores,
    validationWarnings,
    overallConfidence: Math.round((apiData.confidence ?? existing.overallConfidence / 100) * 1000) / 10,
  };
}
