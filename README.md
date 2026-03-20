# Clean Slate Learning Engine

A minimalist, local-first AI knowledge ritual tool designed for deep work and intentional learning. No accounts, no streaks, no gamification — just you and your documents.

## Overview

Clean Slate replaces gamification with a calm, focused learning experience. Upload your PDFs or Markdown files, and a local AI reads them, generates study questions, and schedules your reviews using spaced repetition (SM-2). Everything runs on your machine — your documents never leave your device.

## Features

- **Knowledge Library** — Documents displayed as "Knowledge Stones" with ripeness rings showing how much material is due for review
- **Local AI Question Generation** — Two modes: Ollama (local server) or Browser AI (WebGPU/WebLLM — no install required)
- **SM-2 Spaced Repetition** — Confidence-based scheduling with three states: Hazy / Steady / Clear
- **Ritual Focus Mode** — Distraction-free, fullscreen question flow with a breathing gradient, contextual reveal, and ambient soundscapes
- **Contextual Reveal** — Hints show the actual source passage from your document
- **Session Summary** — After each session: questions reviewed, average confidence, time in focus
- **Multi-document Sessions** — Start a focused session from any single Knowledge Stone, or review across your whole library
- **Ambient Soundscapes** — Brown, white, or pink noise generated in-browser via Web Audio API (no files, fully local)
- **Settings** — Switch AI modes, change models, reset progress without re-running setup
- **Desktop App (Tauri)** — Optional: bundle everything into a single `.exe` / `.dmg` with the backend running silently as a sidecar

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 7 + React Router |
| Styling | CSS custom properties, Glassmorphism, Lora serif |
| Backend | Python FastAPI + SQLAlchemy + SQLite |
| LLM (Ollama mode) | Ollama + llama3.2 (local server) |
| LLM (Browser mode) | WebLLM (`@mlc-ai/web-llm`) via WebGPU |
| Document parsing | PyMuPDF (PDF) + regex chunking (Markdown) |
| Desktop | Tauri v2 + PyInstaller sidecar |

## Project Structure

```
clean-slate/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── BrowserProcessor.jsx   # In-browser LLM processing modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Knowledge Library
│   │   │   ├── FocusMode.jsx          # Ritual session
│   │   │   ├── Upload.jsx             # Document upload
│   │   │   ├── Setup.jsx              # First-run onboarding
│   │   │   └── Settings.jsx           # AI mode, model, data reset
│   │   └── services/
│   │       ├── api.js                 # Axios API layer
│   │       ├── llm.js                 # Mode abstraction (ollama | browser)
│   │       ├── webllm.js              # WebLLM engine wrapper
│   │       └── sounds.js              # Web Audio noise generator
│   ├── index.html
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── documents.py           # Upload, list, delete, chunks
│   │   │   ├── questions.py           # Next question, rate, SM-2
│   │   │   ├── reviews.py             # Session stats
│   │   │   ├── ollama.py              # Ollama status + pull
│   │   │   └── data.py                # Reset endpoints
│   │   ├── services/
│   │   │   ├── parser.py              # PDF + Markdown text extraction
│   │   │   └── generator.py           # Ollama question generation
│   │   ├── models.py                  # SQLAlchemy models
│   │   ├── database.py                # Engine + session
│   │   └── main.py                    # App entry + auto-migration
│   ├── build_sidecar.py               # PyInstaller build script (Tauri)
│   ├── run.py                         # Sidecar entry point
│   ├── data/                          # SQLite database
│   ├── uploads/                       # Uploaded documents
│   └── requirements.txt
├── src-tauri/                         # Tauri desktop app
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── TODO.txt
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- **Ollama mode only:** [Ollama](https://ollama.com) installed and running
- **Browser AI mode only:** Chrome 113+ or Edge 113+ (WebGPU support)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env       # Windows
cp .env.example .env         # macOS/Linux

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000` — API docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies (use --legacy-peer-deps to resolve peer conflicts)
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Frontend: `http://localhost:3000`

On first load, the **Setup screen** guides you through choosing your AI mode:

- **Browser AI** — picks a WebLLM model (~700 MB – 2 GB), downloads once, cached forever in your browser. No Ollama needed.
- **Ollama** — checks that Ollama is running and pulls the model if needed.

### 3. Desktop App (Optional — Tauri)

```bash
# Install Rust: https://rustup.rs

# Build the Python backend into a sidecar binary
cd backend
pip install pyinstaller
python build_sidecar.py
# → produces src-tauri/binaries/backend-<platform>.exe

# Run in desktop window (dev)
cd frontend
npm run tauri dev

# Build release installer
npm run tauri build
# → src-tauri/target/release/bundle/
```

## AI Modes

### Ollama (default)
The backend parses your document, calls Ollama (running locally at `http://localhost:11434`), generates questions as a background task, and stores them in SQLite. Processing status is shown on each Knowledge Stone.

Configure in `.env`:
```
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

### Browser AI (WebGPU)
No backend LLM calls. After upload, a modal opens in the browser, loads your chosen WebLLM model via WebGPU, reads the document chunks, and generates questions — all inside the tab. The model is cached in IndexedDB after the first download.

Requires Chrome 113+ or Edge 113+ on a device with a GPU.

Available models:

| Model | Size | Best for |
|---|---|---|
| Llama 3.2 1B | ~700 MB | Speed |
| Llama 3.2 3B | ~2 GB | Balance (default) |
| Phi-3.5 Mini | ~2.2 GB | Quality |

## API Reference

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF or Markdown |
| `GET` | `/api/documents/` | List documents with status + due count |
| `GET` | `/api/documents/{id}/status` | Poll processing status |
| `GET` | `/api/documents/{id}/chunks` | Get text chunks (browser AI) |
| `PATCH` | `/api/documents/{id}/status` | Update status (browser AI) |
| `DELETE` | `/api/documents/{filename}` | Delete document + file |

### Questions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions/next` | Next due question (`?document_id=` optional) |
| `POST` | `/api/questions/rate` | Submit confidence rating (1–5) |
| `GET` | `/api/questions/pending` | Due question count |
| `POST` | `/api/questions/` | Create question (browser AI pipeline) |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reviews/session` | Current session stats |
| `GET` | `/api/reviews/stats` | Historical stats (`?days=7`) |
| `POST` | `/api/reviews/session/complete` | End session |

### Ollama
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ollama/status` | Check Ollama + model availability |
| `POST` | `/api/ollama/pull` | Pull model (non-blocking) |

### Data
| Method | Endpoint | Description |
|---|---|---|
| `DELETE` | `/api/data/reset` | Erase all data |
| `DELETE` | `/api/data/questions` | Reset questions + reviews only |

## Spaced Repetition (SM-2)

Confidence ratings map to SM-2 quality scores:

| Button | Score | Effect |
|---|---|---|
| Hazy | 1 | Reset — review again tomorrow |
| Steady | 3 | Advance — interval grows slowly |
| Clear | 5 | Advance — interval grows quickly |

The ease factor (default 2.5) adjusts per question based on performance. Minimum ease is 1.3.

## Design Philosophy

1. **Calm Technology** — No notifications, streaks, or badges
2. **Ritual Over Routine** — The UI is designed to feel like entering a study sanctuary, not completing tasks
3. **Privacy First** — Both AI modes run entirely on your machine; no data ever leaves your device
4. **Intentional Learning** — Confidence-based recall promotes metacognition over rote memorisation

## License

MIT
