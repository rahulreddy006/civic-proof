# CivicProof
## Product Requirements Document (PRD) — MVP v1.0

**Product name:** CivicProof  
**Tagline:** Evidence that speaks for your neighbourhood.  
**Category:** Civic technology · Multimodal AI · Evidence verification  
**Primary AI model:** Gemma 4 via the Gemini API  
**MVP stack:** React, Vite, Tailwind CSS, Node.js, Express  
**Build constraint:** 120 minutes  
**Target users:** Citizens reporting sanitation, road, drainage, streetlight, and other visible civic issues  
**Product format:** Responsive web application  
**Persistence:** None required for the MVP

---

# 1. Executive summary

CivicProof is a citizen-side civic complaint evidence reviewer that helps people compare what they originally reported, what a closure message says, and what they can observe now.

A civic complaint may be marked resolved while a resident believes the underlying problem remains. The resident may have an original photograph, a screenshot indicating that the complaint was closed, and a new photograph of the affected area. These pieces of evidence are difficult to communicate together when requesting a review.

CivicProof brings them together into one reviewable report.

The application uses Gemma 4 to interpret the supplied images and compare their visible contents with the provided closure claim. It then produces a cautious assessment, explains the evidence supporting it, identifies uncertainty, and generates an editable follow-up message.

## Product promise

**Help a citizen understand what the available evidence appears to show and communicate the remaining concern clearly.**

CivicProof does not replace municipal grievance portals. It does not directly verify government records, prove that work was performed, establish the exact location or date of a photograph, or determine whether an official acted improperly.

Its output is an evidence-based review that remains under the user's control.

## Core differentiator

The project is not simply an image classifier or a civic chatbot.

It connects three different evidence sources:

1. The original photograph of the reported issue.
2. The closure screenshot or written closure message.
3. The photograph showing the current condition.

Gemma interprets the visual and textual information. Application code validates the result and creates a structured report that the user can inspect, edit, and copy.

---

# 2. Problem statement and research basis

## 2.1 The problem

A resident reports a visible civic issue, such as garbage accumulating beside a drain. Later, they receive a closure notification. They revisit the location and believe the issue still exists.

They now need to communicate three things:

- What the original issue looked like.
- What the closure notification claims.
- What the current photograph shows.

Without a structured presentation, the resident may need to explain the history repeatedly, attach evidence without context, or write a follow-up message from scratch.

Recent reporting from Hyderabad documents residents' complaints about technical issues in the My GHMC application, incorrect location mapping, and tickets allegedly marked resolved without visible work. These reports establish that such concerns have been raised; they do not establish their overall prevalence. [The New Indian Express, February 10, 2026](https://www.newindianexpress.com/amp/story/cities/hyderabad/2026/Feb/10/civic-complaints-hit-a-dead-end-on-my-ghmc-app).

Official grievance portals provide a separate channel for submitting and tracking civic issues. CivicProof complements those channels by helping a citizen organize evidence they already possess rather than trying to replace the official process. [Andhra Pradesh CDMA grievance services](https://cdma.ap.gov.in/services/grievances/).

## 2.2 Target problem

CivicProof specifically addresses the difficulty of comparing evidence across a complaint's lifecycle.

It does not attempt to solve the broader problems of municipal responsiveness, staff allocation, complaint routing, road maintenance, garbage collection, or government accountability.

## 2.3 Target users

**Primary user:** A resident who has already reported a visible civic issue and wants to request a review because they believe the issue remains unresolved.

**Secondary users:**
- Residents' welfare associations.
- Community volunteers.
- Local civic advocates.
- People helping neighbours prepare a follow-up report.

These are intended user groups, not verified adoption statistics.

## 2.4 Core user story

"As a resident whose civic complaint was marked resolved, I want to compare my original photograph, closure message, and current photograph so that I can prepare a clear, factual follow-up without making unsupported accusations."

## 2.5 Product hypothesis

When citizens can review all three pieces of evidence together and receive a structured, editable report, they will find it easier to explain why a complaint may require further attention.

This hypothesis should be tested with actual users after the hackathon.

---

# 3. Product objectives

## 3.1 MVP objectives

1. Allow a user to upload the original issue photograph, closure screenshot, and current-condition photograph.
2. Accept an optional closure note or short explanation.
3. Submit the labelled evidence to Gemma 4 through the required Gemini API.
4. Produce one of four controlled assessment statuses.
5. Show the observations and evidence comparison supporting the result.
6. Explain uncertainty and limitations.
7. Generate a factual, editable follow-up message.
8. Allow the user to copy the message and report.
9. Handle incomplete evidence and API errors honestly.

## 3.2 Non-goals

The MVP will not:

- Connect to GHMC, Puramithra, or another municipal backend.
- Submit or reopen an official complaint automatically.
- Verify official complaint status or government records.
- Authenticate citizens or government employees.
- Store complaint histories in a database.
- Track citizen locations.
- Automatically publish information to social media.
- Identify or accuse officials or workers.
- Claim that the exact same physical location is shown in two photographs unless that is independently established.
- Predict repair completion dates.
- Determine legal liability.
- Provide maps, analytics dashboards, or a multi-agent workflow.
- Require users to create an account.

These features are outside the two-hour MVP and must not be implied by the interface.

---

# 4. Primary workflow

## Step 1 — Start a review

The home screen explains what CivicProof does and asks the user to begin a new evidence review.

The interface presents three distinct upload areas:

**A. Original issue photograph**

The image showing the originally reported concern.

**B. Closure evidence**

A screenshot of the closure notification, a closure message, or a written description of what the authority said was done.

**C. Current-condition photograph**

A recent image showing the present state of the reported concern.

An optional text field allows the user to add relevant context, such as the issue category or a short explanation of what has changed.

## Step 2 — Validate the input

Before analysis, the application checks that all three evidence categories are present.

It validates the image formats and file sizes and explains which item needs attention if something is missing.

The application must not infer missing information simply to enable the analysis.

## Step 3 — Analyze evidence with Gemma

The backend sends the three labelled images and the optional text to the selected Gemma 4 model.

The model is asked to:

- Describe the visible condition in the original photograph.
- Extract or summarize the closure claim when readable.
- Describe the visible condition in the current photograph.
- Compare the evidence with the closure claim.
- Select a supported assessment status.
- State what cannot be established from the images.

## Step 4 — Present the assessment

The result screen displays the conclusion alongside the three evidence sources.

The user can inspect the model's observations before deciding whether to use the generated follow-up message.

## Step 5 — Generate the follow-up report

CivicProof generates an editable message explaining the apparent unresolved concern and referring to the supplied evidence.

The user can copy the report and continue through their preferred official reporting channel.

CivicProof does not submit the report on the user's behalf.

---

# 5. Functional specification

## FR-01: Evidence input

The application must provide three individually labelled evidence uploads.

Supported initial formats:

- JPEG/JPG
- PNG
- WebP

Each upload area must display a preview after a valid image is selected.

Users must be able to replace an image before analysis.

The optional closure-text field must accept plain text.

**Acceptance criteria:** A user can supply all three images, preview them, replace them, and start the analysis. Missing inputs are identified before submission.

## FR-02: File validation

The backend must validate uploaded files independently of frontend validation.

Recommended MVP limits:

- Maximum 3 MB per image.
- Maximum three images per analysis.
- Maximum 9 MB of uploaded image data in total, excluding multipart overhead.
- A reasonable closure-note limit, such as 1,000 characters.

Reject invalid file types, oversized uploads, and malformed requests with clear errors.

The frontend must not be treated as the security boundary.

**Acceptance criteria:** Invalid file types and oversized requests are rejected before a model call.

## FR-03: Gemma integration

The backend must call the required Gemma 4 model through the Gemini API.

The initial candidate model is:

`gemma-4-26b-a4b-it`

The alternative `gemma-4-31b-it` can be evaluated if necessary. Use a model only after confirming that it is accessible in the relevant API project and satisfies the event's requirements.

The application must use real user-submitted images for live analysis. A mock response is not an acceptable substitute for the AI integration.

The API key must remain server-side.

**Acceptance criteria:** One end-to-end request successfully sends all three labelled images and the closure claim to Gemma and receives a usable response.

Official reference: [Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api).

## FR-04: Evidence interpretation

The model must return observations about all three evidence categories.

The analysis must distinguish between:

- What is visibly present.
- What the closure evidence claims.
- What appears different in the current photograph.
- What remains uncertain.

The model must not treat a closure status such as "Resolved" as proof that work was completed.

Likewise, the persistence of a visually similar object must not automatically be interpreted as proof that the authority did nothing.

**Acceptance criteria:** Each result contains separate observations for the original image, closure evidence, and current image.

## FR-05: Controlled assessment status

The result must use exactly one of the following statuses:

| Status | Meaning |
|---|---|
| `still_visible` | The reported concern appears to remain visible in the current evidence. |
| `partly_resolved` | The concern appears to have improved, but a relevant portion remains. |
| `appears_resolved` | The original visible concern does not appear to remain in the supplied current evidence. |
| `inconclusive` | The available evidence does not support a reliable comparison. |

These statuses are advisory assessments, not proof of official resolution.

The system must prefer `inconclusive` when images differ significantly in view, when the original issue is not identifiable, or when the image quality prevents a reliable comparison.

**Acceptance criteria:** Every successful result returns a valid status. Unsupported statuses are rejected.

## FR-06: Evidence comparison

The result screen must show:

- Original photograph.
- Closure screenshot or displayed closure text.
- Current photograph.
- The model's visible observations.
- The evidence-based comparison.
- Explicit uncertainties and limitations.

The model must not invent complaint IDs, official actions, dates, location names, or staff identities.

Where metadata is supplied by the user, it may be displayed as user-provided information, not independently verified fact.

**Acceptance criteria:** Users can inspect the three inputs beside the analysis that references them.

## FR-07: Follow-up message

The application must generate a short, editable follow-up message.

The message should:

- State that the user is requesting a review.
- Identify the reported concern using only supplied information.
- Describe what the current photograph appears to show.
- Reference the closure claim if one was provided.
- Request clarification or further action.
- Avoid accusations of misconduct.
- Avoid claiming that the photographs independently verify the exact date or location.

Example structure:

"Hello, I am requesting a review of the reported civic issue. The supplied closure message indicates that the issue was resolved, but my current photograph appears to show that the concern remains. I have included the original photograph, closure evidence, and current photograph for review. Please verify the current condition and advise on the next steps."

This is an illustrative template. The final message must adapt to the actual evidence and must not invent case details.

The user must be able to edit and copy the message.

**Acceptance criteria:** A valid result generates an editable message grounded in the provided information. An inconclusive result must use cautious wording.

## FR-08: Report handling

The MVP must provide:

- A readable review screen.
- A copyable evidence summary.
- A copyable follow-up message.
- A restart action to clear the current review.

PDF export is optional and must not delay the primary workflow.

No database is required for the MVP.

---

# 6. AI design and model contract

## 6.1 Input design

The backend should clearly label each image in the model request:

- `ORIGINAL_ISSUE_PHOTO`
- `CLOSURE_EVIDENCE`
- `CURRENT_CONDITION_PHOTO`

The accompanying instruction should explain the purpose of each image so the model does not confuse the original report with the current condition.

The closure screenshot may contain text, while the other images may contain visual evidence. The model must interpret each according to its role.

## 6.2 System instruction

Use a prompt along these lines:

"You are an evidence-review assistant for civic complaints.

You will receive an original issue photograph, evidence of a closure claim, a current-condition photograph, and optionally a short user note.

Describe only information supported by the supplied evidence.

Separate direct visual observations from inferences. Compare the visible original concern with the current condition and the supplied closure claim.

Do not assume that different photographs show the exact same place or date. Do not assume that a closure message proves that the physical issue was resolved. Do not infer misconduct, intent, or an official's identity.

Choose only one of these statuses:
- still_visible
- partly_resolved
- appears_resolved
- inconclusive

When image quality, viewpoint, missing context, or contradictory evidence prevents a fair comparison, use inconclusive.

Do not invent dates, locations, complaint identifiers, official actions, or facts that were not supplied.

Return concise structured JSON containing the assessment, observations, comparison, uncertainties, limitations, and a suggested follow-up message.

The application will independently validate your response."

The backend must pass the three images in the correct order, with their labels and the supplied closure note.

## 6.3 Response structure

The model should return an object with fields equivalent to:

- `status`
- `summary`
- `originalObservations`
- `closureClaim`
- `currentObservations`
- `evidenceComparison`
- `uncertainties`
- `limitations`
- `suggestedFollowUp`

The application must validate the response before displaying it.

For example, `status` must be one of the four allowed strings. Required text fields must be present and reasonably bounded in length.

If the model returns invalid JSON, an unsupported status, or missing required fields, the backend must return a controlled error.

A schema-valid response is not automatically a correct response. The user must be able to inspect the original evidence alongside the result.

## 6.4 Model limitations

Gemma is responsible for visual interpretation and comparison, not authoritative verification.

It cannot independently establish:
- Exact capture dates.
- Exact physical location.
- Whether two photographs show the same place.
- Whether an official physically visited the location.
- Whether a specific person performed or omitted an action.
- Whether the municipality's internal records are accurate.

CivicProof must preserve these limitations in its UX, not bury them in documentation.

---

# 7. Technical architecture

## 7.1 Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Browser-native file preview
- Responsive layout

**Backend**
- Node.js
- Express.js
- Multer for multipart upload handling
- `@google/genai` for Gemini API access
- Server-side response validation

**Storage**
- No database.
- No permanent image storage.
- Keep data only as long as necessary to complete the request.

**External service**
- Gemini API with a verified Gemma 4 model.

## 7.2 Data flow

1. User uploads three images and enters optional closure text.
2. React sends a multipart request to the Express endpoint.
3. Express validates the images and text.
4. The server constructs a labelled multimodal request.
5. Gemma returns the proposed evidence assessment.
6. Express validates the response and the status.
7. React displays the result and editable follow-up message.
8. The user copies the report or starts a new review.

## 7.3 API endpoint

`POST /api/analyze-civic-evidence`

Request fields:
- `originalImage`: image file.
- `closureEvidence`: closure screenshot.
- `currentImage`: current-condition photograph.
- `closureText`: optional string.

Response fields:
- `status`
- `summary`
- `originalObservations`
- `closureClaim`
- `currentObservations`
- `evidenceComparison`
- `uncertainties`
- `limitations`
- `suggestedFollowUp`

Error responses should have a predictable structure containing a safe error code and a user-readable message.

A separate `GET /api/health` endpoint may be used for local development and basic deployment checks.

## 7.4 Error handling

The system must handle:

- Missing image inputs.
- Unsupported file formats.
- Oversized uploads.
- Gemini API authentication failure.
- API quota exhaustion.
- Model timeout.
- Malformed model output.
- Network failure.
- Unreadable images.
- Partial or insufficient evidence.

No error should silently substitute a prepared result while implying that it was generated live.

---

# 8. UI and UX requirements

## 8.1 Design direction

CivicProof should feel like a serious, trustworthy civic tool.

Recommended direction:
- Clear typography.
- Light or neutral backgrounds.
- Strong contrast for statuses.
- Evidence displayed side by side.
- Minimal motion.
- A straightforward upload workflow.
- Responsive desktop and mobile layouts.

Avoid excessive dashboard cards, fake civic statistics, decorative maps, and unnecessary charts.

## 8.2 Screen A: Home and upload

Required components:
- CivicProof brand.
- One-sentence value proposition.
- Short explanation of the evidence-review process.
- Three distinct evidence upload areas.
- Optional closure-note input.
- Analyze button.
- A short privacy notice explaining that images are sent to the AI service for analysis.
- Example-input instructions for the demo.

The upload order must remain clear.

## 8.3 Screen B: Analysis state

Show progress without fabricating stages or progress percentages.

Possible labels:
- Validating evidence.
- Analyzing the supplied images.
- Preparing the evidence comparison.

Allow the user to understand that the application is waiting for the analysis.

If the request fails, offer a retry action and explain the failure where possible.

## 8.4 Screen C: Results

The result screen should contain:

1. **Assessment header:** Status and a short explanation.
2. **Evidence gallery:** The three supplied images.
3. **Observation comparison:** What appears in the original and current images.
4. **Closure claim:** What the closure evidence says, when readable.
5. **Uncertainty:** What the application could not establish.
6. **Follow-up message:** Editable text.
7. **Actions:** Copy message, copy report, start new review.

Do not display a numerical confidence score unless the project has a validated interpretation for it. A model-generated percentage should not be presented as a calibrated probability.

## 8.5 Status presentation

Use both text and an icon or label. Colour alone must never determine the meaning.

`still_visible` should not be represented as proof of government failure.

`appears_resolved` should not imply that every part of the issue has been addressed.

`inconclusive` must be a legitimate outcome rather than a hidden failure state.

---

# 9. Privacy, security, and responsible use

Civic evidence can contain faces, vehicle registration plates, house numbers, phone numbers, and other personal information.

The MVP must:

- Keep the Gemini API key server-side.
- Exclude `.env` from version control.
- Restrict upload types and sizes.
- Avoid persistent storage unless explicitly required.
- Avoid logging image contents or personal information.
- Tell users that uploaded images are sent to the model API.
- Avoid exposing private credentials in errors or logs.
- Treat uploaded image contents and text as untrusted input.
- Avoid assuming that visible metadata establishes an authoritative location or date.
- Allow users to edit their follow-up message before copying it.
- Encourage users to remove unnecessary personal information before uploading evidence.

The prototype should use prepared or anonymized photos wherever possible.

The report is intended to assist factual communication, not to make accusations or encourage public targeting of individuals.

---

# 10. MVP acceptance criteria

The MVP must satisfy these criteria before it is considered ready for a live demonstration.

**AC-01 — Real model integration:** A real request succeeds using the configured Gemma 4 model through the required Gemini API.

**AC-02 — Complete evidence input:** The user can submit the three required pieces of evidence and an optional closure note.

**AC-03 — Supported status:** Every successful analysis returns one of the four permitted statuses.

**AC-04 — Evidence visibility:** The original images appear beside the observations supporting the result.

**AC-05 — Honest uncertainty:** Ambiguous evidence can produce `inconclusive`; the system does not force a positive or negative result.

**AC-06 — No fabricated metadata:** The report does not invent location, date, ticket identifiers, official actions, or personal identities.

**AC-07 — Usable follow-up:** The suggested message is editable and copyable.

**AC-08 — Safe failure:** Invalid uploads, unavailable APIs, and malformed responses generate understandable errors.

**AC-09 — Credential security:** No model API key is included in frontend code or a public repository.

**AC-10 — Demo readiness:** The complete workflow can be demonstrated in under two minutes, with a prepared backup clearly marked as prepared.

## Test set

Prepare at least three known examples:

1. An issue that remains visibly present.
2. An issue that appears to have been resolved.
3. An ambiguous case where changes in camera angle or image quality prevent reliable comparison.

A small, prepared test set establishes whether the workflow handles the chosen examples. It does not establish broad model accuracy.

---

# 11. Two-hour build plan

The following is the implementation schedule for the hackathon MVP.

| Time | Task | Required outcome |
|---|---|---|
| 0–15 min | Bootstrap the app and test a real image-input request | Confirm API access and a real Gemma response |
| 15–35 min | Build the upload form and Express endpoint | Successfully send three images and closure text |
| 35–65 min | Implement the comparison prompt and status validation | Complete the model-powered analysis |
| 65–85 min | Build the result screen and evidence display | Show status, observations, and uncertainty |
| 85–100 min | Implement follow-up message generation and copy actions | Produce a usable report |
| 100–120 min | Test the three example cases, fix critical bugs, rehearse the demo | Reliable end-to-end demonstration |

The schedule assumes model access works immediately. If the API request is still failing after the first 15 minutes, prioritize fixing the integration instead of polishing the interface.

## Mandatory cutoff decisions

- If the model cannot interpret three images reliably, simplify the evidence comparison rather than adding more features.
- If structured output is malformed, add server-side validation or parsing.
- If visual comparison remains ambiguous, return `inconclusive`.
- If the API fails during the presentation, show a clearly labelled prepared example rather than a fake live result.

---

# 12. Demo script

The demonstration should take approximately 90 seconds.

**0–10 seconds — Problem**

"Sometimes a civic complaint is marked resolved, but a resident still believes the physical issue remains. CivicProof helps organize the evidence before requesting a review."

**10–25 seconds — Input**

Upload the original photograph, closure evidence, and current photograph.

**25–45 seconds — Gemma result**

Show the model's assessment and observations. Point out the visible evidence on which the conclusion depends.

**45–65 seconds — Evidence comparison**

Show how the original and current photographs compare, what the closure message claims, and what cannot be independently established.

**65–85 seconds — Follow-up report**

Open the editable follow-up message, explain how it uses the supplied evidence, and copy it.

**85–90 seconds — Close**

"CivicProof doesn't replace the official grievance system or claim to prove misconduct. It helps a citizen present a clearer, evidence-based request for review."

The demo must use a real Gemma call if the API is operational. A prepared fallback must be explicitly labelled.

---

# 13. Submission and documentation

Before submitting the project, confirm the applicable challenge requirements with the organizers.

The public repository should include:

- Project README.
- Project purpose and problem statement.
- Installation and startup instructions.
- Required environment variables.
- Model name and Gemini API integration details.
- Architecture summary.
- Known limitations.
- Test/demo instructions.
- Appropriate open-source license.
- A demonstration video or screenshots if required by the current submission template.

The official challenge repository describes a public project repository and a separate submission process. Follow the active submission instructions rather than assuming the code repository itself completes the submission. [Official Hack Day repository](https://github.com/reacthyderabad/hacktoberfest-hack-day-2026).

Do not commit credentials, personal evidence images, or identifiable citizen information.

**Project naming note:** Retain CivicProof as the chosen working name. Before making the repository public, check for existing repositories or products with the same name, since similar naming has appeared in earlier research.

---

# 14. Out of scope and future roadmap

## Out of scope for the MVP

The following features must not be built during the first two hours:

- Municipal system integration.
- Ticket creation or automatic reopening.
- Authentication and user accounts.
- A permanent evidence database.
- Public sharing pages.
- Automated location verification.
- Maps or geospatial dashboards.
- Automatic PDF generation if it delays the main workflow.
- Analytics or complaint statistics.
- A multi-agent architecture.
- Support for every civic issue category.

## Future roadmap

**Phase 2 — Better evidence handling**
- More robust evidence comparisons.
- User confirmation of extracted details.
- Improved handling of different viewpoints.
- Better report exports.

**Phase 3 — Citizen workflows**
- Optional case history.
- Secure storage with explicit consent.
- More structured civic follow-up templates.
- Accessibility and multilingual interface improvements.

**Phase 4 — Integrations**
- Investigate official grievance-system integrations if authorized and feasible.
- Support civic categories with appropriate evidence criteria.
- Evaluate real-world usefulness with citizens and community organizations.

These phases are future options, not commitments for the MVP.

---

# 15. Final product definition

CivicProof is a citizen-side civic complaint evidence reviewer that connects an original issue photograph, a closure claim, and a current-condition photograph into one transparent assessment and editable follow-up report.

Gemma 4 interprets the multimodal evidence. Application logic validates the output, presents the uncertainty, and produces a structured artifact the citizen can review.

The MVP is successful when a user can upload the three pieces of evidence, receive a cautious and interpretable comparison, inspect the observations, and copy an evidence-based follow-up—without requiring access to a municipal API or claiming more than the evidence supports.

**Core principle: CivicProof helps citizens communicate what the evidence appears to show; it does not pretend that AI can independently verify municipal work or prove misconduct.**