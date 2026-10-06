# AI Usage Log (AI_LOG.md)

**Project:** Campus Equipment Booking API  
**Developer:** Student  
**AI Assistant:** Antigravity (Google DeepMind)  
**Verification Principle:** Every AI-generated suggestion, code snippet, and design recommendation was critically inspected, tested, and validated by the student prior to adoption.

---

## 1. Overview of AI Usage

During the development of the Campus Equipment Booking API, AI was utilized as a pair-programming and planning assistant across specific phases:
1. **Initial Repository Inspection & Planning:** Inspecting the workspace environment and identifying requirements from the exam brief and rubric.
2. **Minimal Project Implementation:** Providing minimal boilerplate for TypeScript, Hono, and SQLite parameter binding without unnecessary libraries or bloated layers.
3. **Quality Gate Review & Audit:** Auditing edge cases (path resolution, boundary overlap logic, and HTTP status code choices).
4. **Cloudflare Workers & D1 Migration Planning:** Designing the transition from local Node.js + SQLite to Cloudflare Workers + D1, ensuring the API contract remained 100% identical.
5. **Testing & Evidence Gathering:** Formulating comprehensive curl test cases based on `curl_test_guide.md` and verifying responses.
6. **Documentation Synthesis:** Assisting in structuring `README.md`, `API_CONTRACT.md`, and `SCHEMA.md` to reflect the actual verified code.

---

## 2. Key Prompts, Assistance, and Verification Record

| Phase / Prompt Topic | What AI Provided | What Was Verified & Validated by Student |
|---|---|---|
| **Phase 1: Workspace Inspection & Plan** | Identified that the starter folder was empty and outlined the minimal Hono + SQLite stack needed to meet the brief. | Confirmed local Node.js v26 environment and verified that zero external boilerplate or frontend was needed. |
| **Phase 2: Initial Implementation** | Generated minimal Hono routes (`GET /equipment`, CRUD `/bookings`), input validation, and SQL parameter binding. | Reviewed code to ensure zero string concatenation into SQL (`?` placeholders used), verified standard date parsing, and tested local server startup. |
| **Phase 3: Post-Minute-30 Quality Gate** | Analyzed potential reliability and accuracy issues across the implementation. | Confirmed `src/db.ts` path fragility with `process.cwd()`, refactored to `import.meta.dirname`, mathematically verified overlap formula, and tested PATCH self-exclusion. |
| **Phase 4: Cloudflare Workers + D1 Migration** | Outlined step-by-step migration plan: creating `schema.sql`, configuring `wrangler.jsonc`, and converting synchronous DB calls to `await c.env.DB.prepare().bind()`. | Executed `wrangler login`, provisioned D1 database, applied migrations, ran local `wrangler dev` tests, deployed to Cloudflare Workers, and verified live HTTPS endpoint. |
| **Phase 5: Production Verification** | Assisted in running the complete 9-test suite from `curl_test_guide.md` against the live production worker. | Audited and verified all HTTP response codes (`200`, `201`, `204`, `400`, `404`, `409`) and JSON response payloads using HTTP/curl tests against the live Cloudflare Worker. |

---

## 3. Specific Quality Gate Improvements

During the Quality Gate review, AI suggestions were evaluated critically, resulting in three concrete improvements recorded in [`QUALITY_GATE_REVIEW.md`](QUALITY_GATE_REVIEW.md):

1. **Reliability (Path Resolution):**  
   * *AI Observation:* `path.resolve(process.cwd(), ...)` can resolve incorrectly if run from outside the root directory.  
   * *Action Taken:* Updated to `path.resolve(import.meta.dirname, '..', ...)` to anchor database paths reliably.
2. **Accuracy (Boundary Overlap & Self-Conflict):**  
   * *AI Observation:* In reservation systems, boundary conditions (`<` vs `<=`) and self-updates on `PATCH` often produce false conflicts.  
   * *Action Taken:* Verified that strict inequality (`startAt < requested.endAt AND endAt > requested.startAt`) correctly permits back-to-back bookings, and verified that `AND id != ?` successfully excludes the booking being updated from conflicting with itself.
3. **Reasoning / You Own It (REST Semantics & Zero-Addon Architecture):**  
   * *AI Observation:* Clearly demarcating `400` vs. `404` vs. `409` avoids common ambiguity in REST grading.  
   * *Action Taken:* Confirmed that missing foreign keys (unknown `equipmentId`) return `404 Not Found` (referencing a nonexistent primary resource), syntax errors return `400 Bad Request`, and scheduling clashes return `409 Conflict`. Confirmed native edge D1 bindings avoided native C++ compilation risks on Windows.

---

## 4. Student Ownership & Declaration

* AI did **not** generate unverified code or make autonomous architectural commitments.
* All code paths, SQL queries, status codes, and edge cases were tested with real HTTP clients (`curl`) against both the local runtime and the live production Cloudflare Worker.
* I can independently explain, defend, and modify every route handler, SQL query, and validation rule in this repository.
