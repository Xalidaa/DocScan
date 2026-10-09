# DocScan AI – Intelligent Document Processing System

Advanced AI agent for automated invoice/PO extraction, validation, and ERP integration.

![DocScan AI](docs/assets/images/docscan-ai-dashboard-overview.png)

---

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Demo Video](#-demo-video)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running Locally](#-running-locally)
- [Production Deployment](#-production-deployment)
- [API Documentation](#-api-documentation)
- [Error Handling](#-error-handling)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## Features

### AI-Powered Extraction
- **Smart Extraction**: Extracts header, line items, totals, and metadata from invoices/POs/receipts
- **Document Classification**: Identifies document type using AI
- **Visual Confidence Scoring**: AI assigns confidence scores for each field
- **Natural Language Understanding**: Understands vendor names, dates, currencies, PO numbers

### Multi-Stage Validation Engine
- **ERPSap Validation**: Matches against SAP via OData for PO numbers, vendors, line items
- **Business Rules**: Custom validation for thresholds, required fields, date ranges
- **Schema Conformance**: Ensures extracted data matches required JSON schemas
- **Duplicate Detection**: Prevents duplicate entries across time

### Human-in-the-Loop Workflow
- **Verification Queue**: Pending documents wait for human approval
- **Inline Editing**: Edit extracted fields before approval
- **Audit Trail**: Logs all changes with user and AI timestamps
- **Comments & Notes**: Add contextual information to documents

### Complete Auditability
- **File Metadata**: All uploads include file name, type, size, extension
- **Processing Metadata**: Extraction date, OCR confidence, AI confidence scores
- **User Actions**: Who approved/rejected, when, and with what comments
- **Field-Level History**: Tracks changes to individual data points

### Enterprise Features
- **Role-Based Access**: Admin and User roles with different permissions
- **Secure Authentication**: JWT-based auth with password hashing
- **Role Validation**: User roles validated from frontend state
- **File Upload Controls**: Size limits (20MB), allowed types (.pdf, .jpg, .png)

### Modern User Experience
- **Dark Mode Support**: Automatic theme detection
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive UI**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Built with TailwindCSS for polished transitions

---

## Architecture

```mermaid
graph TD
    User([Browser/Frontend]) -->|HTTPS/API| Backend[Backend API (FastAPI + Python)]
    
    Backend -->|DB CRUD| Database[SQLite Database]
    
    Backend -->|Business Logic| Validation[Multi-Stage Validation Engine]
    
    Validation -->|Rule Engine| Rules[Validation Rules Module]
    Validation -->|Schema Check| Schemas[JSON Schemas]
    Validation -->|ERP Check| ERPSap[OData/SAP Integration]
    
    Backend -->|AI Extraction| Claude[Claude AI API]
    Backend -->|OCR Processing| Tesseract[Tesseract OCR & PyMuPDF]
    
    Backend -->|File Handling| Storage[Local File Storage]
    
    Rules -.->|Config| Config[config.js]
    ERPSap -.->|Config| Config
```

### Key Components:

#### Frontend (`/frontend`)
- React-based UI with TailwindCSS
- Redux Toolkit for state management
- Axios for API communication
- Responsive design with mobile-first approach
- Dark mode support

#### Backend (`/backend`)
- FastAPI REST API (Python)
- SQLite with SQLAlchemy ORM
- Claude AI for text extraction and classification
- Tesseract OCR & PyMuPDF for image processing
- Multi-stage validation engine

#### Data Models
```javascript
// Document Table Schema
{
  "id": "uuid",
  "vendor": "string",
  "invoiceNumber": "string",
  "invoiceDate": "date",
  "totalAmount": "number",
  "status": "string",
  "ocrConfidence": "number",
  "aiConfidence": "number",
  "pdfUrl": "string",
  "processedAt": "timestamp",
  "validatedAt": "timestamp",
  "erpValidated": "boolean",
  "validationErrors": "jsonb",
  "actionBy": "string"
}
```

---

## Getting Started

### Prerequisites

**Frontend:**
- Node.js >= 16.0.0
- npm >= 8.0.0

**Backend:**
- Python >= 3.10
- Tesseract OCR (system dependency)
  ```bash
  sudo apt update
  sudo apt install tesseract-ocr
  ```
- Anthropic Claude API Key

---

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd DocScan-Agent
```

#### 2. Install Backend Dependencies
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Configure Backend
Create `.env` file in `/backend` directory:

```env
DATABASE_URL=sqlite:///./docscan.db
CLAUDE_API_KEY=your_claude_api_key_here
ERP_MOCK_MODE=True
ODOO_URL=http://localhost:8069
```

#### 4. Initialize Database
Database tables are automatically created on startup (via SQLAlchemy `create_all`).

#### 5. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## Running Locally

#### Start Backend Server
```bash
cd backend
uvicorn main:app --reload --port 5000
```
Backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

Open `http://localhost:3000` in your browser.

---

## Production Deployment

#### 1. Configure Production
Update `.env` in `/backend`:
```env
ERP_MOCK_MODE=False
```

#### 2. Build Production Assets
```bash
cd frontend
npm run build
```
This creates production build in `/frontend/dist`

#### 3. Start Production Server
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 5000 --workers 4
```

**Production Considerations:**
- Use a production ASGI server setup (like Gunicorn with Uvicorn workers)
- Set up environment variables in production environment
- Configure proper logging and monitoring
- Secure file uploads (use S3 or similar)

---

## API Documentation

### Documents

**Upload Document**
```http
POST /api/documents/upload
Content-Type: multipart/form-data
```

**List Documents**
```http
GET /api/documents
```

**Get Document**
```http
GET /api/documents/{document_id}
```

**Preprocess Document**
```http
POST /api/documents/{document_id}/preprocess
```

**Export Document**
```http
POST /api/documents/{document_id}/export
```