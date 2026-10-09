export const INITIAL_DOCUMENTS = [
  {
    id: "DOC-2026-891",
    fileName: "INV_ApexTech_9812.pdf",
    type: "Invoice",
    status: "Pending Review",
    overallConfidence: 89.4,
    uploadDate: "2026-09-22 14:30",
    processedTime: "1.4s",
    vendor: "Apex Technology Solutions Inc.",
    vendorAddress: "100 Innovation Way, Suite 400, San Jose, CA 95134",
    vendorTaxId: "US-883920194",
    voen: "1400293841",
    documentNumber: "INV-2026-9812",
    issueDate: "2026-09-18",
    dueDate: "2026-10-18",
    purchaseOrder: "PO-88492",
    subtotal: 12450.00,
    taxAmount: 1245.00,
    totalAmount: 13695.00,
    currency: "USD",
    confidenceScores: {
      documentNumber: 99.2,
      issueDate: 98.5,
      dueDate: 96.0,
      vendor: 99.8,
      vendorTaxId: 94.2,
      purchaseOrder: 72.4, // low confidence trigger
      subtotal: 99.1,
      taxAmount: 81.2,
      totalAmount: 99.5
    },
    validationWarnings: [
      {
        id: "warn-block-1",
        severity: "blocking",
        category: "Blocking Warning",
        title: "BLOCKING: Unverified Vendor Tax ID (VÖEN)",
        message: "Vendor VÖEN 1400293841 is pending tax registry clearance. Approval is locked until manual supervisor override.",
        field: "voen"
      },
      {
        id: "warn-dup-1",
        severity: "error",
        category: "Duplicate Alert",
        title: "Potential Duplicate Invoice Detected",
        message: "Invoice #INV-2026-9812 with exact amount $13,695.00 matches existing ledger entry from 2026-09-10.",
        field: "documentNumber"
      },
      {
        id: "warn-price-1",
        severity: "warning",
        category: "Price Mismatch",
        title: "Catalog Price Discrepancy",
        message: "Item 'Enterprise Server Rack 42U' unit price $2,450.00 exceeds ERP contract price of $2,300.00 by +$150.00.",
        field: "lineItems"
      },
      {
        id: "warn-vat-1",
        severity: "error",
        category: "VAT Error",
        title: "VAT Calculation Variance",
        message: "Document computed VAT $1,245.00 deviates from expected 10.0% tax rate ($1,245.00 vs $1,240.00) by $5.00.",
        field: "taxAmount"
      },
      {
        id: "warn-field-1",
        severity: "warning",
        category: "Missing Field",
        title: "Missing Delivery Note Cross-Reference",
        message: "No associated delivery note receipt linked for PO-88492.",
        field: "purchaseOrder"
      }
    ],
    lineItems: [
      {
        id: "item-101",
        description: "Enterprise Server Rack Cabinet 42U - High Airflow Edition",
        sku: "SRK-42U-HA",
        matchedSku: "ERP-HW-99102",
        matchConfidence: 98.5,
        qty: 2,
        unitPrice: 2450.00,
        amount: 4900.00,
        confidence: 99.2
      },
      {
        id: "item-102",
        description: "Managed 48-Port PoE+ Gigabit Ethernet Switch 750W",
        sku: "SWT-48P-POE",
        matchedSku: "ERP-NET-4801",
        matchConfidence: 96.2,
        qty: 3,
        unitPrice: 1850.00,
        amount: 5550.00,
        confidence: 98.1
      },
      {
        id: "item-103",
        description: "Cat6A Shielded Patch Cable 10ft (Pack of 10)",
        sku: "CBL-C6A-10P",
        matchedSku: "ERP-ACC-6002",
        matchConfidence: 74.0, // product match review alert
        qty: 20,
        unitPrice: 100.00,
        amount: 2000.00,
        confidence: 84.5
      }
    ],
    pageCount: 1,
    boundingHighlights: {
      vendor: { x: 8, y: 10, w: 42, h: 8 },
      documentNumber: { x: 58, y: 10, w: 34, h: 5 },
      issueDate: { x: 58, y: 16, w: 34, h: 4 },
      purchaseOrder: { x: 58, y: 21, w: 34, h: 4 },
      lineItems: { x: 8, y: 35, w: 84, h: 32 },
      totalAmount: { x: 55, y: 72, w: 37, h: 10 }
    }
  },
  {
    id: "DOC-2026-892",
    fileName: "DN_GlobalLogistics_441.pdf",
    type: "Delivery Note",
    status: "Pending Review",
    overallConfidence: 76.5,
    uploadDate: "2026-09-22 13:15",
    processedTime: "2.1s",
    vendor: "Global Logistics Freight Express",
    vendorAddress: "55 Cargo Terminal Blvd, Bldg C, Chicago, IL 60666",
    vendorTaxId: "US-339281726",
    documentNumber: "DN-90412",
    issueDate: "2026-09-21",
    dueDate: "N/A",
    purchaseOrder: "PO-77109",
    subtotal: 3800.00,
    taxAmount: 0.00,
    totalAmount: 3800.00,
    currency: "USD",
    confidenceScores: {
      documentNumber: 94.0,
      issueDate: 92.1,
      dueDate: 100.0,
      vendor: 98.0,
      vendorTaxId: 88.0,
      purchaseOrder: 62.0, // low confidence
      subtotal: 71.0,
      taxAmount: 99.0,
      totalAmount: 69.5
    },
    validationWarnings: [
      {
        id: "warn-dn1",
        severity: "error",
        title: "Missing Carrier Bill of Lading",
        message: "Delivery note lacks signed proof of delivery timestamp from carrier system."
      },
      {
        id: "warn-dn2",
        severity: "warning",
        title: "Quantity Variance",
        message: "Line item 2 delivered 15 units vs PO expected 20 units."
      }
    ],
    lineItems: [
      {
        id: "item-201",
        description: "Industrial Pallet Wrapper Film Clear 80 Gauge",
        sku: "WRAP-IND-80G",
        matchedSku: "ERP-PKG-1104",
        matchConfidence: 91.0,
        qty: 10,
        unitPrice: 180.00,
        amount: 1800.00,
        confidence: 93.0
      },
      {
        id: "item-202",
        description: "Heavy Duty Wooden Euro Pallet Standard 1200x800",
        sku: "PLT-EU-1280",
        matchedSku: "ERP-LOG-9001",
        matchConfidence: 61.5,
        qty: 15,
        unitPrice: 133.33,
        amount: 2000.00,
        confidence: 68.0
      }
    ],
    pageCount: 1,
    boundingHighlights: {
      vendor: { x: 10, y: 12, w: 40, h: 9 },
      documentNumber: { x: 60, y: 12, w: 30, h: 5 },
      issueDate: { x: 60, y: 18, w: 30, h: 4 },
      purchaseOrder: { x: 60, y: 23, w: 30, h: 4 },
      lineItems: { x: 10, y: 36, w: 80, h: 30 },
      totalAmount: { x: 55, y: 70, w: 35, h: 9 }
    }
  },
  {
    id: "DOC-2026-893",
    fileName: "REC_OfficeDepot_771.pdf",
    type: "Receipt",
    status: "Approved",
    overallConfidence: 97.2,
    uploadDate: "2026-09-22 11:05",
    processedTime: "0.9s",
    vendor: "Office Depot Store #4492",
    vendorAddress: "890 Market St, San Francisco, CA 94102",
    vendorTaxId: "US-129038475",
    documentNumber: "REC-2026-0988",
    issueDate: "2026-09-22",
    dueDate: "2026-09-22",
    purchaseOrder: "N/A",
    subtotal: 412.50,
    taxAmount: 35.06,
    totalAmount: 447.56,
    currency: "USD",
    confidenceScores: {
      documentNumber: 98.8,
      issueDate: 99.5,
      dueDate: 100.0,
      vendor: 99.9,
      vendorTaxId: 96.4,
      purchaseOrder: 100.0,
      subtotal: 97.2,
      taxAmount: 96.8,
      totalAmount: 99.1
    },
    validationWarnings: [],
    lineItems: [
      {
        id: "item-301",
        description: "HP LaserJet Ultra Toner Black Dual Pack",
        sku: "HP-CF287A-2P",
        matchedSku: "ERP-OFF-5501",
        matchConfidence: 99.0,
        qty: 2,
        unitPrice: 189.99,
        amount: 379.98,
        confidence: 98.5
      },
      {
        id: "item-302",
        description: "Recycled Multi-Purpose Copy Paper 20lb 500 Sheets",
        sku: "OD-PPR-500R",
        matchedSku: "ERP-OFF-1002",
        matchConfidence: 98.0,
        qty: 5,
        unitPrice: 6.50,
        amount: 32.52,
        confidence: 96.9
      }
    ],
    pageCount: 1,
    boundingHighlights: {
      vendor: { x: 15, y: 8, w: 70, h: 10 },
      documentNumber: { x: 20, y: 20, w: 60, h: 4 },
      issueDate: { x: 20, y: 25, w: 60, h: 4 },
      purchaseOrder: { x: 20, y: 30, w: 60, h: 4 },
      lineItems: { x: 10, y: 38, w: 80, h: 30 },
      totalAmount: { x: 20, y: 72, w: 60, h: 8 }
    }
  },
  {
    id: "DOC-2026-894",
    fileName: "INV_NordicSupplies_0041.pdf",
    type: "Invoice",
    status: "Approved",
    overallConfidence: 95.8,
    uploadDate: "2026-09-21 16:45",
    processedTime: "1.2s",
    vendor: "Nordic Office & Industrial Supplies",
    vendorAddress: "77 Fjord Avenue, Seattle, WA 98101",
    vendorTaxId: "US-991823746",
    documentNumber: "NOR-INV-4401",
    issueDate: "2026-09-20",
    dueDate: "2026-10-20",
    purchaseOrder: "PO-88301",
    subtotal: 5600.00,
    taxAmount: 448.00,
    totalAmount: 6048.00,
    currency: "USD",
    confidenceScores: {
      documentNumber: 99.0,
      issueDate: 98.2,
      dueDate: 97.5,
      vendor: 99.5,
      vendorTaxId: 98.0,
      purchaseOrder: 96.8,
      subtotal: 95.4,
      taxAmount: 94.0,
      totalAmount: 98.9
    },
    validationWarnings: [],
    lineItems: [
      {
        id: "item-401",
        description: "Ergonomic Mesh Task Chair Mesh Back Lumbar Support",
        sku: "NOR-CHR-900",
        matchedSku: "ERP-FUR-1109",
        matchConfidence: 97.8,
        qty: 10,
        unitPrice: 380.00,
        amount: 3800.00,
        confidence: 97.5
      },
      {
        id: "item-402",
        description: "Electric Height Adjustable Motorized Standing Desk 60x30",
        sku: "NOR-DSK-E60",
        matchedSku: "ERP-FUR-2204",
        matchConfidence: 96.5,
        qty: 3,
        unitPrice: 600.00,
        amount: 1800.00,
        confidence: 96.0
      }
    ],
    pageCount: 1,
    boundingHighlights: {
      vendor: { x: 8, y: 10, w: 42, h: 8 },
      documentNumber: { x: 58, y: 10, w: 34, h: 5 },
      issueDate: { x: 58, y: 16, w: 34, h: 4 },
      purchaseOrder: { x: 58, y: 21, w: 34, h: 4 },
      lineItems: { x: 8, y: 35, w: 84, h: 32 },
      totalAmount: { x: 55, y: 72, w: 37, h: 10 }
    }
  },
  {
    id: "DOC-2026-895",
    fileName: "REC_FuelGo_110.pdf",
    type: "Receipt",
    status: "Rejected",
    overallConfidence: 48.2,
    uploadDate: "2026-09-21 11:20",
    processedTime: "2.8s",
    vendor: "Fuel & Go Fleet Station",
    vendorAddress: "12 Terminal Way, Oakland, CA 94607",
    vendorTaxId: "US-554433221",
    documentNumber: "FG-REC-9921",
    issueDate: "2026-09-21",
    dueDate: "2026-09-21",
    purchaseOrder: "N/A",
    subtotal: 185.20,
    taxAmount: 18.52,
    totalAmount: 203.72,
    currency: "USD",
    confidenceScores: {
      documentNumber: 42.0,
      issueDate: 65.0,
      dueDate: 100.0,
      vendor: 58.0,
      vendorTaxId: 35.0,
      purchaseOrder: 100.0,
      subtotal: 48.0,
      taxAmount: 41.0,
      totalAmount: 45.0
    },
    validationWarnings: [
      {
        id: "warn-rej1",
        severity: "error",
        title: "Severe Image Blurring",
        message: "Receipt text image resolution is too low (< 150 DPI). Multiple fields could not be matched with high certainty."
      },
      {
        id: "warn-rej2",
        severity: "error",
        title: "Unrecognized Commercial Card Merchant",
        message: "Merchant ID not matched in corporate fleet spending policy ledger."
      }
    ],
    lineItems: [
      {
        id: "item-501",
        description: "Diesel Fuel Premium Grade #2 (Gallons 48.5)",
        sku: "FUEL-DSL-P",
        matchedSku: "ERP-UNMATCHED",
        matchConfidence: 40.0,
        qty: 48.5,
        unitPrice: 3.82,
        amount: 185.20,
        confidence: 48.0
      }
    ],
    pageCount: 1,
    boundingHighlights: {
      vendor: { x: 15, y: 8, w: 70, h: 10 },
      documentNumber: { x: 20, y: 20, w: 60, h: 4 },
      issueDate: { x: 20, y: 25, w: 60, h: 4 },
      purchaseOrder: { x: 20, y: 30, w: 60, h: 4 },
      lineItems: { x: 10, y: 38, w: 80, h: 30 },
      totalAmount: { x: 20, y: 72, w: 60, h: 8 }
    }
  }
];

export const RECENT_ACTIVITIES = [
  {
    id: "act-1",
    user: "AI DocScan Agent",
    action: "Extracted 12 structured fields from INV_ApexTech_9812.pdf",
    time: "10 minutes ago",
    type: "extraction",
    docId: "DOC-2026-891"
  },
  {
    id: "act-2",
    user: "Sarah Jenkins (Senior Accountant)",
    action: "Approved receipt DOC-2026-893 (Office Depot)",
    time: "45 minutes ago",
    type: "approval",
    docId: "DOC-2026-893"
  },
  {
    id: "act-3",
    user: "AI DocScan Agent",
    action: "Flagged low OCR confidence on DOC-2026-895 (Fuel & Go)",
    time: "2 hours ago",
    type: "warning",
    docId: "DOC-2026-895"
  },
  {
    id: "act-4",
    user: "Mark Roberts (Audit Lead)",
    action: "Rejected delivery note DOC-2026-895",
    time: "4 hours ago",
    type: "rejection",
    docId: "DOC-2026-895"
  }
];
