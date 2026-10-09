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
    User([Browser/Frontend]) -->|HTTPS/API| Backend[Backend API (Express + Node)]
    
    Backend -->|Auth| Auth[JWT + Bcrypt Authentication]
    Backend -->|DB CRUD| Database[PostgreSQL Database]
    
    Backend -->|Business Logic| Validation[Multi-Stage Validation Engine]
    
    Validation -->|Rule Engine| Rules[Validation Rules Module]
    Validation -->|Schema Check| Schemas[JSON Schemas]
    Validation -->|ERP Check| ERPSap[OData/SAP Integration]
    
    Backend -->|AI Extraction| Gemini[Gemini AI API]
    Backend -->|OCR Processing| Tesseract[Tesseract OCR]
    
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
- Express.js REST API
- PostgreSQL ORM (via Sequelize, although custom implementation used in code)
- JWT Authentication with bcrypt
- Gemini AI for text extraction and classification
- Tesseract OCR for image processing
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
- Node.js >= 16.0.0
- PostgreSQL >= 13.0
- Tesseract OCR (system dependency)
  ```bash
  sudo apt update
  sudo apt install tesseract-ocr
  ```
- Google Gemini API Key

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
npm install
```

#### 3. Configure Backend
Create `.env` file in `/backend` directory:

```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000

DB_NAME=docscan
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

#### 4. Initialize Database
Run migration script:
```bash
node init_db.js
```
This will:
- Create `docscan` database
- Run `schema.sql` migrations
- Seed initial data

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
npm start
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
NODE_ENV=production
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
npm run start
```

**Production Considerations:**
- Use process manager like PM2: `pm2 start server.js --name=docscan`
- Set up environment variables in production environment
- Configure proper logging and monitoring
- Secure file uploads (use S3 or similar)

---

## API Documentation

### Authentication

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "[PASSWORD]"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",