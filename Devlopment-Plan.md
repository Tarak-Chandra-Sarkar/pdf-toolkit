# PDF Toolkit

A local-first browser-based PDF utility application built with **React + TypeScript** and **FastAPI + Python**.

The application is designed to process PDF files locally through a browser-based UI while keeping the backend and document storage on the user's local machine.

---

# MVP v1.0

## Current Status

**MVP v1.0 — Phase 4 Completed**

The current MVP provides the foundational PDF workspace and the following PDF operations:

- PDF upload
- PDF inspection
- PDF page preview
- PDF page thumbnails
- PDF download
- PDF deletion
- Merge PDF
- Split PDF
- Extract page ranges
- Images → PDF
- Browser-based UI
- Swagger/OpenAPI API documentation
- Local backend storage
- Local-first processing

---

# 1. Architecture

```text
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│              React + TypeScript             │
│                                             │
│   Home │ Merge │ Split │ Extract │ Images  │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │
│                                             │
│              Python PDF Services            │
│                                             │
│  Upload │ Preview │ Merge │ Split │ Extract │
│                  Images → PDF               │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Local File Storage              │
│                                             │
│  backend/storage/                           │
│  ├── uploads/                               │
│  ├── outputs/                               │
│  └── temp/                                  │
└─────────────────────────────────────────────┘
````

The application does not require a cloud backend for the MVP.

---

# 2. Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Browser Fetch API

## Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* Pydantic Settings

## PDF Processing

* PyMuPDF
* pypdf
* Pillow

## API Documentation

* OpenAPI 3
* Swagger UI
* ReDoc

---

# 3. Project Structure

```text
pdf-toolkit/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── endpoints/
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── services/
│   │   │   └── pdf_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── storage/
│   │   ├── uploads/
│   │   ├── outputs/
│   │   └── temp/
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── PdfDropZone.tsx
│   │   │   ├── PdfPageThumbnail.tsx
│   │   │   └── PdfViewer.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── MergePage.tsx
│   │   │   └── SplitPage.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── types/
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# 4. Backend Configuration

Backend configuration is centralized in:

```text
backend/app/core/config.py
```

The application uses:

```python
BASE_DIR = Path(__file__).resolve().parents[2]
```

Therefore the backend root is used as the base directory for application storage.

## Storage configuration

```text
storage_dir = backend/storage

upload_dir = backend/storage/uploads

output_dir = backend/storage/outputs

temp_dir = backend/storage/temp
```

The directories are created automatically when the FastAPI application starts.

---

# 5. Local Storage Architecture

The MVP uses the following storage structure:

```text
backend/
└── storage/
    │
    ├── uploads/
    │   └── <file_id>/
    │       └── document.pdf
    │
    ├── outputs/
    │   └── generated files
    │
    └── temp/
        └── temporary processing files
```

## Uploads

Uploaded PDFs are associated with a generated `file_id`.

Example:

```text
storage/
└── uploads/
    └── 8f32c7a1/
        └── document.pdf
```

The `file_id` is used by the API for:

* Preview
* Download
* Delete
* PDF operations

## Outputs

Generated files can be stored under:

```text
storage/outputs/
```

Examples include generated PDF artifacts.

## Temporary files

Intermediate processing files should use:

```text
storage/temp/
```

---

# 6. Running the Backend

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8008
```

Backend:

```text
http://localhost:8008
```

Swagger:

```text
http://localhost:8008/docs
```

ReDoc:

```text
http://localhost:8008/redoc
```

---

# 7. Running the Frontend

Navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend is normally available at:

```text
http://localhost:3000
```

The frontend communicates with:

```text
http://localhost:8008
```

---

# 8. Environment Configuration

The backend uses Pydantic Settings.

Example:

```env
APP_NAME=PDF Toolkit
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

API_PREFIX=/api/v1

HOST=0.0.0.0
PORT=8008

FRONTEND_URL=http://localhost:3000

LOG_LEVEL=INFO

MAX_UPLOAD_SIZE_MB=50
PREVIEW_DPI=120
```

---

# 9. API Endpoints

Current API prefix:

```text
/api/v1
```

## Health

```http
GET /api/v1/health
```

Example response:

```json
{
  "status": "ok",
  "service": "PDF Toolkit",
  "version": "1.0.0"
}
```

---

# 10. PDF Upload

```http
POST /api/v1/pdf/upload
```

Accepts:

```text
multipart/form-data
```

Parameter:

```text
file
```

Returns PDF information including:

* File ID
* Filename
* Size
* Page count
* Metadata

Example:

```json
{
  "file_id": "8f32c7a1",
  "filename": "sample.pdf",
  "size_bytes": 125430,
  "page_count": 10,
  "metadata": {
    "title": null,
    "author": null,
    "subject": null,
    "creator": null,
    "producer": null
  }
}
```

---

# 11. PDF Preview

```http
GET /api/v1/pdf/{file_id}/pages/{page_number}/preview
```

Returns a rendered preview of the requested PDF page.

The frontend uses this endpoint for:

* Page thumbnails
* PDF page preview

---

# 12. PDF Download

```http
GET /api/v1/pdf/{file_id}/download
```

Downloads the stored PDF.

---

# 13. Delete PDF

```http
DELETE /api/v1/pdf/{file_id}
```

Removes the PDF associated with the specified `file_id`.

---

# 14. Merge PDF

```http
POST /api/v1/pdf/merge
```

Accepts multiple PDF files through multipart form data.

Example:

```text
files:
    file1.pdf
    file2.pdf
    file3.pdf
```

The Swagger UI is configured to display the PDF files as binary uploads.

The merge operation combines the selected PDF files into a single PDF.

---

# 15. Split PDF

```http
POST /api/v1/pdf/split
```

The split operation creates individual PDF files for each page.

The result is returned as a ZIP archive.

Example:

```text
input.pdf
    │
    ├── page 1
    ├── page 2
    ├── page 3
    └── page 4

        ↓

split_pdf.zip

    ├── page_001.pdf
    ├── page_002.pdf
    ├── page_003.pdf
    └── page_004.pdf
```

---

# 16. Extract Page Range

```http
POST /api/v1/pdf/extract
```

Parameters:

```text
file
start_page
end_page
```

Example:

```text
Input PDF: document.pdf

Start Page: 3
End Page: 7
```

Produces:

```text
Pages 3-7
```

as a new PDF.

---

# 17. Images → PDF

## Endpoint

```http
POST /api/v1/pdf/from-images
```

Accepts multiple image files.

Supported image formats depend on Pillow support, including common formats such as:

```text
JPG
JPEG
PNG
```

Example:

```text
image1.jpg
image2.jpg
image3.png
```

becomes:

```text
images_to_pdf.pdf
```

The operation is processed by the backend and the resulting PDF is returned to the browser.

---

# 18. Frontend Pages

## Home

The Home page provides:

* PDF upload
* Drag & drop
* Backend connectivity status
* PDF metadata
* Page count
* Page thumbnails
* PDF page preview
* Remove PDF

---

# 19. Merge UI

The Merge page provides:

* Multiple PDF selection
* PDF file upload
* Merge operation
* Download of merged result
* Error handling
* Processing state

---

# 20. Split UI

The Split page provides two modes.

### Split

```text
Split every page
```

Creates:

```text
page_001.pdf
page_002.pdf
page_003.pdf
...
```

inside a ZIP file.

### Extract

```text
Extract page range
```

Example:

```text
Start Page: 3
End Page: 7
```

Creates:

```text
extracted_3-7.pdf
```

---

# 21. Frontend Navigation

The MVP currently contains:

```text
Home
Merge PDF
Split PDF
```

The application uses a lightweight page-state approach rather than introducing a routing library for the MVP.

---

# 22. Backend Connectivity

The Home page checks:

```http
GET /api/v1/health
```

The UI displays:

```text
● Online
```

or:

```text
● Offline
```

or:

```text
Checking...
```

---

# 23. CORS

The backend allows the configured frontend origin.

Default:

```text
http://localhost:3000
```

Configured through:

```text
FRONTEND_URL
```

---

# 24. PDF Processing Libraries

## PyMuPDF

Used for:

* PDF inspection
* Page rendering
* PDF preview
* PDF metadata
* PDF page operations

Use:

```python
import pymupdf
```

rather than the deprecated:

```python
import fitz
```

## pypdf

Used for:

* PDF merging
* PDF reading
* PDF writing
* Page manipulation

## Pillow

Used for:

* Image processing
* Images → PDF conversion

---

# 25. Important Design Principle

The application is **local-first**.

The intended MVP deployment model is:

```text
Browser
   │
   ▼
Local FastAPI
   │
   ▼
Local filesystem
```

No document needs to be uploaded to a third-party cloud service.

---

# 26. Current MVP Scope

## Completed

### Phase 0 — Project Foundation

* Backend project
* FastAPI
* React frontend
* Vite
* Tailwind CSS
* Basic application shell
* Health endpoint
* CORS
* Swagger
* ReDoc
* Local development setup

### Phase 1 — PDF Upload & Inspection

* PDF upload
* PDF validation
* PDF metadata
* PDF page count
* File ID
* Local storage
* Download
* Delete

### Phase 2 — PDF Preview & Merge

* PDF page rendering
* Page thumbnails
* PDF viewer
* Merge PDF
* Multiple PDF upload
* Swagger multipart upload support
* Merge testing

### Phase 3 — Split & Extract

* Split PDF
* Individual page extraction
* ZIP result
* Page-range extraction
* React Split UI
* React Extract UI
* Functional testing

### Phase 4 — Images → PDF

* Multiple image upload
* Image validation
* Images → PDF conversion
* PDF download
* Frontend/backend integration
* Local output storage configuration

---

# 27. MVP v1.0 Feature Matrix

| Feature                | Status |
| ---------------------- | ------ |
| Home page              | ✅      |
| Backend health         | ✅      |
| PDF upload             | ✅      |
| PDF inspection         | ✅      |
| PDF metadata           | ✅      |
| PDF page count         | ✅      |
| PDF preview            | ✅      |
| Page thumbnails        | ✅      |
| PDF download           | ✅      |
| PDF delete             | ✅      |
| Merge PDF              | ✅      |
| Split PDF              | ✅      |
| Extract page range     | ✅      |
| Images → PDF           | ✅      |
| Local storage          | ✅      |
| Swagger UI             | ✅      |
| ReDoc                  | ✅      |
| React UI               | ✅      |
| Drag & drop PDF upload | ✅      |
| Docker                 | ⏳      |
| OCR                    | ⏳      |
| PDF → Word             | ⏳      |
| PDF compression        | ⏳      |
| PDF encryption         | ⏳      |
| Watermark              | ⏳      |

---

# 28. Current Storage Contract

The MVP uses:

```text
backend/storage/
│
├── uploads/
│
├── outputs/
│
└── temp/
```

Configuration is centralized in:

```text
backend/app/core/config.py
```

with:

```python
storage_dir = BASE_DIR / "storage"

upload_dir = storage_dir / "uploads"

output_dir = storage_dir / "outputs"

temp_dir = storage_dir / "temp"
```

Services should use these configuration properties instead of hard-coded paths.

---

# 29. Development Workflow

Recommended development sequence:

```text
1. Start FastAPI
       ↓
2. Verify /health
       ↓
3. Open Swagger
       ↓
4. Test API operation
       ↓
5. Start React
       ↓
6. Test UI
       ↓
7. Test browser download
       ↓
8. Verify local storage
```

---

# 30. Manual MVP Testing Checklist

## Backend

* [ ] FastAPI starts successfully
* [ ] `/docs` loads
* [ ] `/redoc` loads
* [ ] `/api/v1/health` returns 200
* [ ] Storage directories are created
* [ ] PDF upload works
* [ ] PDF inspection works
* [ ] PDF preview works
* [ ] PDF download works
* [ ] PDF delete works
* [ ] PDF merge works
* [ ] PDF split works
* [ ] Page-range extraction works
* [ ] Images → PDF works

## Frontend

* [ ] Home page loads
* [ ] Backend status shows Online
* [ ] PDF drag & drop works
* [ ] PDF upload works
* [ ] Page thumbnails load
* [ ] Page preview works
* [ ] Merge page loads
* [ ] Merge works
* [ ] Split page loads
* [ ] Split works
* [ ] Extract works
* [ ] Images → PDF works
* [ ] Generated files download correctly
* [ ] Error messages are displayed correctly

---

# 31. Known MVP Limitations

The current MVP intentionally has a limited feature set.

Not yet implemented:

* OCR
* PDF compression
* Password protection
* Password removal
* Watermarks
* PDF annotations
* PDF → Word
* Word → PDF
* Excel → PDF
* PowerPoint → PDF
* Advanced page reordering
* Batch job management
* Persistent job history
* User authentication
* Cloud deployment
* Multi-user storage isolation
* Production-grade file lifecycle management

These features will be considered after MVP v1.0.

---

# 32. Next Planned Phases

Potential next development phases:

```text
Phase 5
  PDF compression

Phase 6
  Page management
  - Delete pages
  - Reorder pages
  - Rotate pages

Phase 7
  OCR

Phase 8
  PDF → Word

Phase 9
  Security
  - Password protection
  - Encryption

Phase 10
  Watermarks

Phase 11
  Batch processing

Phase 12
  Production hardening
```

The exact scope of future phases will be decided after MVP v1.0 validation.

---

# 33. Version

```text
Application: PDF Toolkit
Version: 1.0.0
Milestone: MVP
Current Phase: Phase 4 Completed
Architecture: Local-first Browser Web Application
Backend: FastAPI
Frontend: React + TypeScript
```

---

# 34. MVP Philosophy

The goal of MVP v1.0 is not to replicate every feature of commercial PDF platforms.

The goal is to establish a clean, extensible foundation for:

```text
Upload
   ↓
Inspect
   ↓
Preview
   ↓
Transform
   ↓
Download
```

while keeping PDF processing local and maintaining a simple browser-based user experience.

```

### Phase 4 status

I would mark the project now as:

**`MVP v1.0 — Phase 4 COMPLETE`** ✅

The next phase should be planned separately rather than adding more features into Phase 4.
```
