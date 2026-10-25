# CivicProof

> **Evidence that speaks for your neighbourhood.**<br />
> Citizen-side civic complaint evidence reviewer powered by Gemma 4.

---

## 📌 CivicProof MVP Overview

CivicProof is a citizen-side evidence review assistant designed to help residents compare an original issue report photograph, an official closure notification, and a recent photograph of the affected area.

The application uses **Gemma 4** (`gemma-4-26b-a4b-it`) via the official Google Gen AI SDK (`@google/genai`) on the Gemini API to analyze the evidence, compare visual observations with closure claims, determine a cautious assessment status, and generate an editable follow-up report that citizens can copy and submit through official grievance channels.

---

## 🚀 Key Features

1. **Three-Image Multimodal Evidence Workflow:**
   - **Input A (Original Issue):** Photograph of the concern when first reported.
   - **Input B (Closure Evidence):** Closure notification screenshot or resolution message.
   - **Input C (Current Condition):** Recent photograph of the site.
   - **Optional Closure Note:** Text context for user-supplied ticket details (up to 1,000 characters).

2. **Gemma 4 AI Interpretation & Comparison:**
   - Objective visual observations separated from inferences.
   - Direct comparison of reported defect vs current condition against the closure claim.
   - Controlled assessment verdicts:
     - `still_visible`: Concern appears to remain in current evidence.
     - `partly_resolved`: Some improvement visible, but concern appears to remain.
     - `appears_resolved`: Original visible concern does not appear to remain.
     - `inconclusive`: Evidence does not support a reliable comparison.

3. **Honest Uncertainty & Limitations:**
   - Explicitly notes differences in camera angles, unverified capture dates, and physical coordinates.
   - States clearly that the review is an advisory aid based only on citizen evidence, not proof of government records or misconduct.

4. **Actionable Citizen Reports:**
   - In-place editable follow-up message tailored to the evidence.
   - One-click copy for the follow-up message.
   - One-click copy for the full structured evidence summary report.
   - Full reset and evidence replacement controls.

---

## 🏗️ Architecture

```
CivicProof/
├── docs/
│   └── prd.md                 # Product Requirements Document (Source of Truth)
├── client/                     # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── App.jsx             # Complete CivicProof review application
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
│   │   │   ├── smokeTest.controller.js
│   │   │   └── evidence.controller.js
│   │   ├── routes/
│   │   │   ├── health.routes.js
│   │   │   ├── smokeTest.routes.js
│   │   │   ├── evidence.routes.js
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

> **Security Note:** `.env`, upload buffers, temporary files, and private evidence are strictly excluded from Git in `.gitignore`.

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

## 🖥️ Running the Application

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

## 🔌 API Endpoints

### 1. `POST /api/analyze-civic-evidence`
Primary multimodal analysis endpoint:
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `originalImage` (Required): Original issue photograph (JPEG, PNG, WebP; max 3 MB)
  - `closureEvidence` (Required): Resolution notice screenshot (JPEG, PNG, WebP; max 3 MB)
  - `currentImage` (Required): Recent condition photograph (JPEG, PNG, WebP; max 3 MB)
  - `closureText` (Optional): Resident context or closure note (max 1,000 chars)
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": {
      "status": "still_visible",
      "summary": "The reported pothole appears to remain present in the current photograph despite ticket closure.",
      "originalObservations": ["Pothole with broken asphalt along roadway"],
      "closureClaim": "Ticket closed as resolved: Road patched and asphalt repaved",
      "currentObservations": ["Similar asphalt depression and surface disruption visible at site"],
      "evidenceComparison": "The visible surface defect in the current image closely matches the dimensions of the original complaint.",
      "uncertainties": ["Exact capture coordinates cannot be verified independently from photos."],
      "limitations": ["Assessment is advisory and based strictly on citizen-provided photos."],
      "suggestedFollowUp": "Hello, I am requesting a review of complaint #... Current photos indicate the issue remains unresolved.",
      "model": "gemma-4-26b-a4b-it",
      "latencyMs": 14200,
      "timestamp": "2026-10-25T07:15:00.000Z"
    }
  }
  ```

### 2. `GET /api/health`
Confirms the backend server is operational and reports model configuration status.

### 3. `POST /api/health/model-check`
Runs a real connectivity ping against the Gemini API using Gemma 4.

### 4. `POST /api/gemma-smoke-test`
Development smoke-test endpoint for single-image verification.
