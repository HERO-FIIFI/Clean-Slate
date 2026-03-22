# Clean Slate Learning Engine

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Node](https://img.shields.io/badge/Node.js-18%2B-brightgreen)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> A minimalist, local-first AI knowledge ritual tool. No accounts. No streaks. No gamification. Just you and your documents.

Upload a PDF or Markdown file. A local AI reads it, generates study questions, and schedules your reviews using spaced repetition. Everything runs on your machine — your documents never leave your device.

---

## Screenshots

> _Demo GIF / screenshots coming soon. Run the app locally to see it in action._

---

## Philosophy

Most learning apps optimise for daily active users. Clean Slate optimises for understanding.

1. **Calm Technology** — No notifications, streaks, or badges
2. **Ritual Over Routine** — The UI is designed to feel like entering a study sanctuary, not completing a task list
3. **Privacy First** — Both AI modes run entirely on your machine; no data ever touches a server
4. **Intentional Learning** — Confidence-based recall promotes metacognition over rote memorisation

---

## Features

- **Knowledge Library** — Documents displayed as "Knowledge Stones" with ripeness rings showing how much material is due for review
- **Local AI Question Generation** — Two modes: Ollama (local server) or Browser AI (WebGPU/WebLLM — no install required)
- **SM-2 Spaced Repetition** — Confidence-based scheduling with three states: Hazy / Steady / Clear
- **Ritual Focus Mode** — Distraction-free, fullscreen question flow with breathing gradient, contextual reveal, and ambient soundscapes
- **Contextual Reveal** — Hints show the actual source passage from your document
- **Session Summary** — After each session: questions reviewed, average confidence, time in focus
- **Multi-document Sessions** — Start a session from any single Knowledge Stone, or review across your whole library
- **Ambient Soundscapes** — Brown, white, or pink noise generated in-browser via Web Audio API (no files, fully local)
- **Settings** — Switch AI modes, change models, and reset progress without re-running setup
- **Desktop App (Tauri)** — Optional: bundle everything into a single `.exe` / `.dmg` with the backend running silently as a sidecar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 7 + React Router 6 |
| Styling | CSS custom properties, Glassmorphism, Lora serif |
| Backend | Python FastAPI + SQLAlchemy + SQLite |
| LLM (Ollama mode) | Ollama + llama3.2 (local server) |
| LLM (Browser mode) | WebLLM (`@mlc-ai/web-llm`) via WebGPU |
| Document parsing | PyMuPDF (PDF) + regex chunking (Markdown) |
| Desktop | Tauri v2 + PyInstaller sidecar |

---

## Quick Start

For experienced developers who just want it running:

```bash
# 1. Backend
cd backend && python -m venv venv
source venv/bin/activate   # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:3000
```

On first load, the Setup screen walks you through choosing Ollama or Browser AI mode.

---

## Detailed Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- **Ollama mode only:** [Ollama](https://ollama.com) installed and running
- **Browser AI mode only:** Chrome 113+ or Edge 113+ (WebGPU support required)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env       # Windows
cp .env.example .env         # macOS / Linux

# Start the server
uvicorn app.main:app --reload --port 8000
```

- API root: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# --legacy-peer-deps is required: @mlc-ai/web-llm declares a peer dep on React 17
# while this project uses React 18. The conflict is cosmetic — the library works fine.
npm install --legacy-peer-deps

# Start dev server
npm run dev
# → http://localhost:3000
```

On first load the **Setup screen** guides you through AI mode selection:

- **Browser AI** — Picks a WebLLM model (~700 MB – 2 GB), downloads once, cached forever in your browser. No Ollama needed.
- **Ollama** — Checks that Ollama is running and pulls the model if needed.

### 3. Desktop App (Optional — Tauri)

```bash
# Step 1: Install Rust → https://rustup.rs

# Step 2: Build the Python backend into a sidecar binary
cd backend
pip install pyinstaller
python build_sidecar.py
# Produces a platform-specific binary in src-tauri/binaries/:
#   Windows → backend-x86_64-pc-windows-msvc.exe
#   macOS   → backend-x86_64-apple-darwin
#   Linux   → backend-x86_64-unknown-linux-gnu

# Step 3: Run in dev mode
cd frontend
npm install --legacy-peer-deps
npm run tauri dev

# Step 4: Build release installer
npm run tauri build
# → src-tauri/target/release/bundle/
#   Windows: .msi and .exe installers
#   macOS:   .dmg
#   Linux:   .AppImage and .deb
```

---

## AI Modes

### Ollama (default)

The backend parses your document, calls Ollama running locally at `http://localhost:11434`, generates questions as a background task, and stores them in SQLite. Processing status is shown on each Knowledge Stone.

Configure in `backend/.env` (copy from `.env.example`):

```env
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=sqlite:///./data/clean_slate.db
UPLOAD_DIR=uploads
```

### Browser AI (WebGPU)

No backend LLM calls. After upload, a modal opens in the browser, loads your chosen WebLLM model via WebGPU, reads the document chunks, and generates questions — all inside the tab. The model is cached in IndexedDB after the first download.

Requires Chrome 113+ or Edge 113+ on a device with a GPU.

| Model | Size | Best for |
|---|---|---|
| Llama 3.2 1B | ~700 MB | Speed |
| Llama 3.2 3B | ~2 GB | Balance (recommended) |
| Phi-3.5 Mini | ~2.2 GB | Quality |

---

## Project Structure

```
clean-slate/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── BrowserProcessor.jsx   # In-browser LLM processing modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Knowledge Library
│   │   │   ├── FocusMode.jsx          # Ritual focus session
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
│   ├── data/                          # SQLite database (git-ignored)
│   ├── uploads/                       # Uploaded documents (git-ignored)
│   └── requirements.txt
├── src-tauri/                         # Tauri desktop app shell
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── TODO.txt
└── README.md
```

---

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

---

## Spaced Repetition (SM-2)

Confidence ratings map to SM-2 quality scores:

| Button | Score | Effect |
|---|---|---|
| Hazy | 1 | Reset — back in queue tomorrow |
| Steady | 3 | Advance — interval grows slowly |
| Clear | 5 | Advance — interval grows quickly |

The ease factor (default 2.5) adjusts per question based on your performance history. Minimum ease is 1.3 to prevent questions from becoming impossibly infrequent.

---

## Troubleshooting

**Backend won't start**
- Make sure your virtual environment is activated before running `uvicorn`
- If `requirements.txt` fails on PyMuPDF, try: `pip install pymupdf --no-binary pymupdf`

**Ollama: "model not found" / questions never generate**
- Confirm Ollama is running: `ollama list`
- Pull the model manually if needed: `ollama pull llama3.2`
- Check `OLLAMA_BASE_URL` in `.env` matches your Ollama port (default `11434`)

**Browser AI: model won't load / blank modal**
- WebGPU is required — use Chrome 113+ or Edge 113+
- Open DevTools → Console for error details
- Firefox and Safari do not support WebGPU as of early 2025

**Browser AI: "Out of memory" during model load**
- Switch to the 1B model in Settings, or close other browser tabs to free GPU memory

**`npm install` fails**
- Always use `--legacy-peer-deps`: `npm install --legacy-peer-deps`
- Node.js 18 or higher is required

**Tauri build: sidecar binary not found**
- The binary filename must exactly match the Tauri target triple. Run `rustup show` to confirm your target, then rename the binary in `src-tauri/binaries/` accordingly.

**Large PDFs produce few/low-quality questions**
- The parser caps at 4 chunks × 800 words by default. Increase `MAX_CHUNKS` in `backend/app/services/parser.py` to process more content.

---

## Known Limitations

- **No cloud sync** — data lives in a local SQLite file; there is no backup or multi-device support by design
- **Browser AI requires a GPU** — devices without WebGPU (most phones, older laptops) must use Ollama mode
- **Question quality depends on chunk size** — very short documents or heavily formatted PDFs may produce lower-quality questions
- **Ollama mode is sequential** — questions are generated one at a time per chunk; large documents take several minutes
- **No multi-user support** — the backend has no authentication; do not expose port 8000 to a network
- **PyInstaller sidecar is platform-specific** — build the sidecar binary on the same OS you intend to ship for

---

## Roadmap

Planned improvements in rough priority order:

- [ ] **Session summary screen** — questions answered, avg confidence, next due date shown after each Focus session
- [ ] **Settings page** — switch LLM mode and model, clear database, reset progress without re-running Setup
- [ ] **Ambient soundscapes** — optional brown/white/pink noise toggle in Focus Mode (Web Audio, no files)
- [ ] **Multi-document sessions** — start a session from one specific Knowledge Stone
- [ ] **Contextual highlight** — highlight the exact passage in the PDF that generated a question
- [ ] **App icon** — place a 1024×1024 PNG at `src-tauri/icons/app-icon.png` and run `npm run tauri icon`

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes — keep PRs focused on a single concern
3. Test both Ollama and Browser AI paths if touching LLM-related code
4. Open a pull request with a clear description of what changed and why

**Code style:**
- Frontend: ESLint config is included — run `npm run lint` before committing
- Backend: PEP 8; use `black` for formatting (`pip install black && black .`)
- No new runtime dependencies without discussion in an issue first

---

## Acknowledgements

- [Ollama](https://ollama.com) — dead-simple local LLM serving
- [WebLLM / MLC AI](https://webllm.mlc.ai) — in-browser LLM inference via WebGPU
- [SM-2 algorithm](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method) — Piotr Wozniak's original spaced repetition spec
- [Tauri](https://tauri.app) — lightweight Rust-based desktop app framework
- [PyMuPDF](https://pymupdf.readthedocs.io) — fast, reliable PDF text extraction

---

## License

MIT © 2025 Clean Slate contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
