# Campus Equipment Booking API

A lightweight, robust backend REST API for reserving campus equipment (projectors, cameras, labs) with strict time-overlap prevention and input validation. Built with TypeScript and Hono, and deployed on Cloudflare Workers backed by Cloudflare D1.

---

## 1. Project Overview

* **Title:** Campus Equipment Booking API
* **Base API URL (Production):**
  ```text
  https://campus-equipment-booking-api.nutjon.workers.dev/api
  ```
* **Source Code Repository:** https://github.com/NUTTHAPOUL-JONGKAMOLVIWAT/campus-equipment-booking-api
* **Status:** Verified and live in production on Cloudflare Workers + Cloudflare D1.

---

## 2. Technology Stack

* **Language:** TypeScript (`strict: true`, NodeNext/ES2022)
* **Framework:** [Hono](https://hono.dev/) v4 (lightweight, edge-first Web framework)
* **Runtime:** Cloudflare Workers (`workerd` runtime)
* **Database:** Cloudflare D1 (Serverless SQLite in APAC region)
* **Deployment & Tooling:** Wrangler CLI v4, npm

---

## 3. Prerequisites

* [Node.js](https://nodejs.org/) v20.0.0 or higher
* npm v10.0.0 or higher
* [Cloudflare](https://dash.cloudflare.com/) account (for deployment)

---

## 4. Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NUTTHAPOUL-JONGKAMOLVIWAT/campus-equipment-booking-api
   cd "Midterm Practical Lab Test"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the local D1 database schema and seed data:**
   ```bash
   npm run d1:init:local
   ```

4. **Start the local development server (Wrangler):**
   ```bash
   npm run dev
   ```
   The local API will be available at:
   ```text
   http://localhost:8787/api
   ```

---

## 5. Cloudflare D1 & Deployment

To deploy or manage the production Cloudflare Workers API:

1. **Log in to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Initialize or update the remote D1 schema:**
   ```bash
   npm run d1:init:remote
   ```

3. **Deploy to Cloudflare Workers:**
   ```bash
   npm run deploy
   ```

---

## 6. Testing the API

The API was fully verified with `curl` against the production Cloudflare Worker.

### Sample Quick Tests (Production)

```bash
BASE_URL="https://campus-equipment-booking-api.nutjon.workers.dev/api"

# 1. List equipment (returns 200 OK)
curl -i "$BASE_URL/equipment"

# 2. List bookings (returns 200 OK)
curl -i "$BASE_URL/bookings"

# 3. Create a booking (returns 201 Created)
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T09:00:00.000Z",
    "endAt": "2026-10-20T11:00:00.000Z",
    "purpose": "Class presentation"
  }'

# 4. Overlapping booking conflict test (returns 409 Conflict)
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Suda Dee",
    "startAt": "2026-10-20T10:00:00.000Z",
    "endAt": "2026-10-20T12:00:00.000Z",
    "purpose": "Conflicting reservation"
  }'

# 5. Invalid time test (returns 400 Bad Request)
curl -i -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2026-10-20T12:00:00.000Z",
    "endAt": "2026-10-20T10:00:00.000Z",
    "purpose": "Invalid time range"
  }'
```

---

## 7. Submission Documentation Links

* [API_CONTRACT.md](API_CONTRACT.md) — Comprehensive API contract detailing routes, payloads, status codes, and validation rules.
* [SCHEMA.md](SCHEMA.md) — Entity Relationship Diagram (ERD), schema definitions, and seed data.
* [QUALITY_GATE_REVIEW.md](QUALITY_GATE_REVIEW.md) — Post-Minute-30 Quality Gate audit findings, fixes, and evidence.
* [AI_LOG.md](AI_LOG.md) — Transparent log of AI assistance and student verification/ownership.
