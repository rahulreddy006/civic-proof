# CivicProof

> **Evidence that speaks for your neighbourhood.**<br />
> Citizen-side civic complaint evidence reviewer powered by Gemma 4.

---

## 📌 Phase 1: Project Foundation & Real Gemma 4 API Connection

CivicProof is a citizen-side evidence review assistant designed to help residents compare an original issue report, an official closure notification, and a current photograph of the affected area.

This repository represents **Phase 1** of the CivicProof build:
- Establish a minimal, maintainable full-stack project foundation.
- Connect to the real **Gemma 4** (`gemma-4-26b-a4b-it`) model via the official Google Gen AI JavaScript SDK (`@google/genai`).
- Prove multimodal image processing through a development-only image smoke-test endpoint (`POST /api/gemma-smoke-test`).
- Implement health checks, validation, error handling, and secure server-side credential management.

---

## 🏗️ Architecture

```
CivicProof/
├── docs/
│   └── prd.md                 # Product Requirements Document (Source of Truth)
├── client/                     # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── App.jsx             # Minimal landing page & image smoke-test UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Proxies /api -> http://localhost:5000
├── server/                     # Node.js + Express backend (ES modules)
│   ├── src/
│   │   ├── app.js              # Express app, middleware, router setup
│   │   ├── server.js           # Server bootstrap and listener
│   │   ├── index.js            # Entrypoint
│   │   ├── controllers/
│   │   │   ├── health.controller.js
│   │   │   └── smokeTest.controller.js
│   │   ├── routes/
│   │   │   ├── health.routes.js
│   │   │   ├── smokeTest.routes.js
│   │   │   └── index.js
│   │   └── services/
│   │       └── gemma.service.js # Official @google/genai SDK integration
│   ├── package.json
│   └── .env.example
├── .gitignore
├── .env.example
└── README.md
```

---

## ⚙️ Environment Configuration

Server-side environment variables are loaded via `dotenv` and kept strictly confidential. The API key is never exposed to the client browser or bundled in Vite.

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

Set the required variables:

```env
# Server-side Gemini API Key (Obtain from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_api_key_here

# Gemma Model to use (default: gemma-4-26b-a4b-it)
GEMMA_MODEL=gemma-4-26b-a4b-it

# Server Port
PORT=5000
```

> **Security Note:** `.env`, upload buffers, temporary files, and evidence are excluded from Git in `.gitignore`.

---

## 📦 Installation

Install root, server, and client dependencies:

```bash
npm run install:all
```

Or individually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

---

## 🚀 Running the Application

### Option A: Run Both Concurrently (Recommended)
```bash
npm run dev
```

### Option B: Run in Separate Terminals
**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
Runs Express server on `http://localhost:5000`.

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
Runs Vite dev server on `http://localhost:5173`.

---

## 🔌 API Endpoints (Phase 1)

### 1. `GET /api/health`
Health check endpoint confirming that the backend server is running.
- **Response:**
  ```json
  {
    "status": "ok",
    "service": "CivicProof Backend",
    "serverTime": "2026-10-25T06:23:02.628Z",
    "configured": true,
    "hasApiKey": true,
    "model": "gemma-4-26b-a4b-it"
  }
  ```

### 2. `POST /api/health/model-check`
Performs an active connectivity test by making a lightweight request directly to the configured Gemma model via the Gemini API.

### 3. `POST /api/gemma-smoke-test`
Technical development endpoint to verify that Gemma 4 processes uploaded images.
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `image` (Required): Image file (JPEG, PNG, WebP; up to 5 MB)
  - `prompt` (Optional): Custom instruction text
- **Response Envelope:**
  ```json
  {
    "status": "success",
    "data": {
      "model": "gemma-4-26b-a4b-it",
      "prompt": "Describe this test image in detail and identify visible objects and conditions without guessing or assuming facts.",
      "response": "The image is a solid, uniform square of coral pink color.",
      "latencyMs": 11584,
      "timestamp": "2026-10-25T06:25:12.651Z"
    }
  }
  ```

---

## 🧪 Verification & Smoke Testing

To test the image smoke-test endpoint from the command line:

```bash
curl -X POST http://localhost:5000/api/gemma-smoke-test \
  -F "image=@path/to/test_image.jpg" \
  -F "prompt=Describe visible objects in this image."
```

Or open `http://localhost:5173/` in your browser to exercise the smoke-test UI with live image preview and model output display.
