# CivicProof

**Evidence that speaks for your neighbourhood.**

CivicProof is a citizen-side civic complaint evidence reviewer powered by Gemma 4. It helps residents compare an original issue photograph, a closure notification, and a recent photograph of the affected area, then prepare an editable, evidence-based follow-up message.

**Live demo:** [https://civic-proof-dusky.vercel.app/](https://civic-proof-dusky.vercel.app/)

## Overview

A resident may receive a notification that a civic complaint has been marked as resolved while believing that the underlying issue remains. Explaining the concern can require bringing together evidence from different points in time and comparing that evidence with the closure claim.

CivicProof brings these items into one review workflow:

1. Upload a photograph of the original issue.
2. Upload the closure notification or screenshot.
3. Upload a recent photograph showing the current condition.
4. Optionally add context from the closure message.
5. Ask Gemma 4 to interpret and compare the supplied evidence.
6. Review the assessment, observations, uncertainties, and limitations.
7. Edit and copy a follow-up message for use through an appropriate official grievance channel.

CivicProof is intended to help citizens communicate what their evidence appears to show. It does not independently verify municipal records, establish the exact date or location of photographs, prove that work was or was not performed, or determine misconduct.

## Key Features

### Three-image evidence workflow

Each input has a separate role in the analysis:

- **Original issue:** A photograph showing the concern when it was first reported.
- **Closure evidence:** A closure notification screenshot or resolution message.
- **Current condition:** A recent photograph showing how the issue appears now.
- **Optional closure note:** Additional context supplied by the user, up to 1,000 characters.

### Gemma 4 multimodal analysis

CivicProof uses `gemma-4-26b-a4b-it` through the Gemini API and the official Google Gen AI JavaScript SDK (`@google/genai`) to interpret the supplied images, compare observations with the closure claim, and return a structured assessment.

### Controlled assessment statuses

| Status | Meaning |
| --- | --- |
| `still_visible` | The reported concern appears to remain visible in the current evidence. |
| `partly_resolved` | Some improvement may be visible, but part of the concern appears to remain. |
| `appears_resolved` | The original visible concern does not appear to remain in the supplied current evidence. |
| `inconclusive` | The available evidence does not support a reliable comparison. |

These statuses are advisory assessments based on supplied evidence. They are not proof of the official state of a grievance.

### Evidence-focused results

The result view presents the model's observations about the original image, closure evidence, and current image, along with an evidence comparison, uncertainties, and limitations.

### Editable follow-up report

CivicProof generates a follow-up message that users can review and edit before copying. It also provides a copyable summary of the evidence and assessment.

### Input validation and safe failure handling

The application validates required evidence inputs and image types and sizes. API failures and invalid model responses should be handled with clear errors rather than fabricated results.

### No account required

The MVP is designed to work without user authentication or a database and does not submit a complaint automatically.

## Live Demo

**[Open CivicProof](https://civic-proof-dusky.vercel.app/)**

The deployed demo is provided for evaluation. API-dependent functionality may require the backend and Gemini API configuration to be available. Do not treat a prepared example as a live model result unless the interface explicitly identifies it as prepared.

## How It Works

1. The React frontend collects the three labelled evidence images and an optional closure note.
2. The frontend submits them to the Express backend as `multipart/form-data`.
3. The backend validates the request and passes the labelled images and context to Gemma 4 through the Gemini API.
4. The backend parses and validates the model response, including the allowed status values.
5. The frontend displays the assessment, observations, evidence comparison, uncertainties, and limitations.
6. The user reviews the evidence and may edit and copy the suggested follow-up message.

The model interprets visual and textual evidence. Application code validates inputs and output structure, enforces the allowed status values, and presents the report. The user remains responsible for reviewing the evidence and deciding how to use the report.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, JavaScript
- **Backend:** Node.js, Express.js
- **AI integration:** Google Gen AI JavaScript SDK (`@google/genai`)
- **Model:** Gemma 4 (`gemma-4-26b-a4b-it`)
- **API:** Gemini API
- **Version control:** Git and GitHub
- **Deployment:** Vercel for the live frontend demo; the backend and model endpoint must be configured for API-dependent features

Use the actual dependency versions recorded in the project's package files as the source of truth.

## Architecture

```text
CivicProof/
├── docs/
│   └── prd.md
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── index.js
│   │   ├── controllers/
│   │   │   ├── health.controller.js
│   │   │   ├── smokeTest.controller.js
│   │   │   └── evidence.controller.js
│   │   ├── routes/
│   │   │   ├── health.routes.js
│   │   │   ├── smokeTest.routes.js
│   │   │   ├── evidence.routes.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── gemma.service.js
│   │   └── package.json
│   ├── .env.example
│   ├── package.json
│   ├── .gitignore
│   └── README.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This structure reflects the current project layout provided for CivicProof. If the repository changes, the actual source tree and scripts should take precedence over this diagram.

## Requirements

- Node.js and npm compatible with the dependencies in the project.
- A Gemini API key with access to the configured Gemma 4 model.
- Git, if running the project from source.

Official references:

- [Gemma 4 model documentation](https://ai.google.dev/gemma/docs/core/model_card_4)
- [Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai)

## Environment Configuration

CivicProof uses server-side environment variables. Never expose the API key through the frontend or a `VITE_` variable.

Copy the root `.env.example` to `.env` if that is how the current root scripts load environment variables. If the backend loads its own environment file, configure the corresponding `server/.env` using `server/.env.example`. Do not overwrite an existing local `.env` file.

Example configuration:

```env
GEMINI_API_KEY=your_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
PORT=5000
```

Obtain a key from [Google AI Studio](https://aistudio.google.com/apikey).

### Security Requirements

- Never commit `.env` files or API keys.
- Never expose `GEMINI_API_KEY` through frontend code or `VITE_` environment variables.
- Keep model API requests on the backend.
- Do not log uploaded images or sensitive closure-message content.
- Do not commit private civic evidence, personal information, or identifiable screenshots.
- Treat uploaded images and closure text as untrusted input.
- Review the Gemini API and provider privacy terms applicable to your deployment.

## Installation

From the repository root, install the dependencies:

```bash
npm run install:all
```

Alternatively, install the packages individually if needed:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

Configure the appropriate server-side `.env` file before testing AI-dependent endpoints.

## Running the Application

### Run both services concurrently

From the repository root:

```bash
npm run dev
```

### Run the backend and frontend separately

**Terminal 1 — Backend:**

```bash
cd server
npm run dev
```

The Express server is expected to run on `http://localhost:5000` when `PORT=5000` is configured.

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
```

The Vite configuration proxies `/api` requests to `http://localhost:5000` in the local setup described by the project.

## 🚀 Deployment Guide (Vercel + Render)

CivicProof is structured for frictionless separate deployment: the React/Vite frontend on **Vercel** and the Node.js/Express backend on **Render**.

### 1. Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/rahulreddy006/civic-proof`.
3. Configure the service settings:
   - **Name:** `civicproof-backend`
   - **Region:** Choose the region closest to your users.
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the **Environment Variables** in the Render Dashboard:
   - `GEMINI_API_KEY`: `<Your real Google AI Studio API key>`
   - `GEMMA_MODEL`: `gemma-4-26b-a4b-it`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` *(or leave blank to allow all origins)*
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://civicproof-backend.onrender.com`).
   - You can test it by visiting: `https://civicproof-backend.onrender.com/api/health`

*(Alternatively, use the included [`render.yaml`](./render.yaml) blueprint by clicking **New +** → **Blueprint**.)*

---

### 2. Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Select your `civic-proof` repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Select `client` (Click "Edit" and choose the `client` folder)
   - **Build Command:** `npm run build` *(automatic)*
   - **Output Directory:** `dist` *(automatic)*
4. Add the **Environment Variable**:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://civicproof-backend.onrender.com` *(your deployed Render backend URL, without a trailing slash)*
5. Click **Deploy**.

Vercel will build and deploy your app. All evidence analysis requests will now securely route directly to your live Render backend!

## API Endpoints

### `POST /api/analyze-civic-evidence`

The primary endpoint for multimodal evidence analysis. Accepts `multipart/form-data`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `originalImage` | File | Yes | Original issue photograph. |
| `closureEvidence` | File | Yes | Closure notification screenshot or image. |
| `currentImage` | File | Yes | Current-condition photograph. |
| `closureText` | String | No | User-supplied context or closure note, up to 1,000 characters. |

Supported image types: JPEG/JPG, PNG, and WebP. The configured MVP limits are 3 MB per image and 9 MB combined image data. The backend must enforce these limits independently of frontend checks.

A successful response uses a success envelope with a `data` object containing the assessment. The exact response and error behavior should match the implementation in `server/src/controllers/evidence.controller.js` and the associated route/service files.

Example response shape:

```json
{
  "status": "success",
  "data": {
    "status": "still_visible",
    "summary": "The reported concern appears to remain in the current photograph.",
    "originalObservations": [
      "A visible obstruction appears in the original photograph."
    ],
    "closureClaim": "The supplied closure evidence indicates that the issue was resolved.",
    "currentObservations": [
      "A similar obstruction appears in the current photograph."
    ],
    "evidenceComparison": "The available visual evidence suggests that the concern may remain.",
    "uncertainties": [
      "The capture dates and exact locations cannot be independently verified from the images alone."
    ],
    "limitations": [
      "This assessment is advisory and based on citizen-provided evidence."
    ],
    "suggestedFollowUp": "Please review the supplied evidence and confirm the current condition of the reported issue.",
    "model": "gemma-4-26b-a4b-it",
    "latencyMs": 14200,
    "timestamp": "2026-10-25T07:15:00.000Z"
  }
}
```

This is an illustrative response structure. The sample observations, latency, and timestamp are examples only and are not a claim about a real API call. The live application must display the actual validated response.

### `GET /api/health`

Returns the backend health status and model configuration information. A successful server health response does not necessarily prove that the Gemini API is reachable or that a model request will succeed.

### `POST /api/health/model-check`

Performs a real model connectivity check against the Gemini API using the configured Gemma 4 model. This endpoint may make an API request and can therefore fail if credentials, access, quota, or connectivity are unavailable.

### `POST /api/gemma-smoke-test`

Development endpoint for testing single-image Gemma integration. It is separate from the three-image civic evidence-analysis workflow.

## Input Limits and Validation

The MVP supports:

- Three required evidence images per review.
- JPEG/JPG, PNG, and WebP image formats.
- Maximum 3 MB per image.
- Maximum 9 MB combined image data.
- Optional closure note of up to 1,000 characters.

Missing files, unsupported image types, oversized requests, API errors, and invalid model responses should produce clear error messages. Client-side checks support usability; server-side validation is required for security.

## Privacy and Responsible Use

Civic evidence may include faces, vehicle registration plates, house numbers, addresses, phone numbers, or other personal information.

Before uploading, remove or obscure personal information that is not necessary for the review. Upload only evidence you have permission to share. The images and associated text are sent to the configured AI service for analysis.

CivicProof is intended to avoid permanent storage of uploaded evidence in the MVP, but users should consult the applicable deployment and provider terms rather than assume that every service involved has identical retention practices.

CivicProof is not an official municipal service. It does not independently verify a grievance's official status, establish capture dates or exact locations from photos alone, prove that work was or was not performed, or determine misconduct. The assessment is an aid to human review and should be checked before the suggested message is used.

## Testing and Verification

Before describing a build as release-ready, verify:

- The frontend and backend start successfully.
- The frontend production build succeeds.
- The health endpoint responds.
- Required evidence fields are enforced.
- Unsupported and oversized images are rejected.
- A real three-image request reaches the configured Gemma 4 model.
- The response is parsed and validated on the server.
- All four assessment statuses render correctly.
- Ambiguous evidence can result in `inconclusive`.
- Malformed model output and API errors do not crash the application.
- The follow-up message is editable and copy actions work.
- No API key or private evidence is included in Git.

Recommended scenarios:

1. **Still visible:** The reported concern appears to remain in the current photograph.
2. **Appears resolved:** The original visible concern no longer appears in comparable current evidence.
3. **Inconclusive:** The available images cannot be matched reliably or are too unclear.

A small, manually prepared test set is useful for a demonstration but does not establish general model accuracy. Document only the tests that have actually been performed.

## Known Limitations

- Gemma may misread text or misinterpret visual details.
- Different camera angles, lighting, occlusion, or image quality can make comparisons unreliable.
- Photographs alone may not establish the exact date or location.
- Closure evidence may be incomplete or unreadable.
- The application cannot independently verify municipal records or work performed.
- A model-generated assessment is not a legal finding or proof of misconduct.
- Model availability, quotas, latency, and output behavior depend on the configured Gemini API project.
- A `still_visible` or `appears_resolved` assessment is based on the submitted evidence, not an official inspection.

When the evidence is insufficient, CivicProof should return `inconclusive` rather than making a confident claim.

## Roadmap

Potential future improvements include:

- Better evidence comparison and user correction of extracted observations.
- Additional report export formats.
- Improved accessibility and multilingual interface support.
- Evaluation across a wider variety of civic issues and image conditions.
- Secure case history with explicit user consent.
- Authorized integrations with official grievance systems, if available and permitted.

These are future possibilities and are not implied to be implemented in the current MVP.

## Contributing

Contributions are welcome.

1. Review the PRD in the `docs/` directory.
2. Keep API credentials and private evidence out of commits.
3. Make focused, reviewable changes.
4. Run the available build and tests.
5. Document any new environment variables, API endpoints, or limitations.

## License

See the repository's `LICENSE` file for the applicable license terms. If no license file exists, add an appropriate license before describing the project as open source.

## References

- [Google AI for Developers: Gemma 4 Model Card](https://ai.google.dev/gemma/docs/core/model_card_4)
- [Google AI for Developers: Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai)
- [Hacktoberfest Hack Day Hyderabad: Challenge and submission repository](https://github.com/reacthyderabad/hacktoberfest-hack-day-2026)
- [Greater Hyderabad Municipal Corporation](https://www.ghmc.gov.in/)
- [Andhra Pradesh CDMA](https://cdma.ap.gov.in/)

---

CivicProof is a prototype designed to help citizens organize evidence and communicate concerns clearly. It is not a substitute for official grievance channels, professional inspection, or independent verification.
