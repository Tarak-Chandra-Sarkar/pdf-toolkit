# PDF Toolkit

A local-first browser-based PDF utility application.

## MVP v1.0

### Phase 0

Foundation only:

- React
- TypeScript
- Vite
- Tailwind CSS
- FastAPI
- Python
- Docker Compose
- API versioning
- Health check
- Basic logging

PDF processing will be added in subsequent phases.

---

## Architecture

```text
Browser
   |
   v
React + TypeScript
   |
   | REST
   v
FastAPI
   |
   v
PDF Processing Services