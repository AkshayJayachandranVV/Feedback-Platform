# DECISIONS.md — Engineering Decision Log

> Answers to key architectural and engineering decisions made during the development of **Acowale Feedbacker**.

---

## 1. Why did you choose this technology stack?

**Backend — NestJS (TypeScript)**
NestJS was chosen because it enforces structure by default. Its module system, dependency injection container, guard/interceptor/pipe pipeline, and decorator-driven architecture make the codebase predictable and easy to navigate by any developer. It also has first-class support for Swagger, validation, JWT, and throttling — removing the need to wire these manually.

**Frontend — React + Vite + TypeScript**
Vite provides near-instant HMR and a lean production build. React's component model paired with TypeScript kept the UI type-safe end-to-end — from API response shapes (`PaginatedFeedback`, `Feedback`) through to form validation schemas (`zod`). No framework overhead was needed beyond what Vite provides.

**Language — TypeScript throughout**
Using TypeScript on both sides means shared type assumptions. If the API response shape changes, the TypeScript compiler surfaces the mismatch in the UI at build time — not at runtime in production.

---

## 2. Why did you choose this database?

**MongoDB (via Mongoose)**
The core entity — a feedback submission — is a self-contained document: submitter info, rating, comment, category reference, status, IP address, and timestamps all belong together and are always queried together. There are no complex relational joins needed; the only cross-collection reference is `categoryId → Category`, which is a single virtual populate.

MongoDB's flexible schema also allowed rapid iteration. When the `status` field was added mid-development, no migration script was required — existing documents defaulted naturally.

The real trade-off was the lack of ACID foreign-key enforcement. MongoDB does not natively prevent orphaned `feedback` documents when a referenced `category` is deleted. This was solved with an atomic counter strategy: a `feedbackCount` field on the `Category` document, incremented via `$inc` when feedback is created, and used as a gate for deletion (`findOneAndDelete({ _id, feedbackCount: 0 })`). This prevents orphans without requiring a replica set or distributed lock.

---

## 3. Why did you structure your application this way?

**Backend — Feature-module architecture**
Each domain lives in its own folder (`auth/`, `feedback/`, `categories/`, `analytics/`, `health/`) with its own controller, service, DTO, and schema. Adding a new entity means adding one new folder — nothing else is touched. Cross-cutting concerns (guards, interceptors, filters) live in `common/`.

**Frontend — Co-located API and type layers**
The `api/` directory holds one file per backend resource (`feedback.api.ts`, `categories.api.ts`, `analytics.api.ts`). The `types/` directory holds the shared interfaces. Pages import from `api/` and `types/` — never from each other. This enforces a clean dependency direction: `pages → api → axios → backend`.

The goal was **locality of change**: a developer modifying the feedback flow reads one backend module and one frontend page — not 10 global files.

---

## 4. What trade-offs did you make due to time constraints?

- **No refresh token rotation** — JWT access tokens are stored in HttpOnly cookies and expire after a fixed TTL. There is no silent-refresh or revocation mechanism. When the token expires, the user is simply logged out.
- **No E2E tests** — Only unit tests were written (for `FeedbackService` and `AuthService`). A Playwright or Cypress suite covering the full submission-to-admin workflow was deferred.

---

## 5. What would you improve if you had one more week?

- **Add refresh token rotation** — Issue a long-lived refresh token stored in a separate HttpOnly cookie, with a Redis-backed revocation list. The access token stays short-lived; silent refresh happens transparently.
- **Add WebSocket live-feed** — Use Socket.io (NestJS gateway) to push new feedback events to the admin dashboard in real time. Currently the admin must manually refresh to see new submissions.
- **Add Playwright E2E tests** — Cover the full user journey: load the public form → submit feedback → log in as admin → verify submission appears → change status → verify badge updates.
- **Add a CI/CD GitHub Actions pipeline** — On every push to `main`: run unit tests, TypeScript build, generate static `api-docs.json`, and fail the pipeline on any regression.

---

## 6. What was the most difficult technical challenge you faced?

**The TOCTOU (Time-of-Check to Time-of-Use) race condition on category deletion.**

The initial implementation used a two-step check:

```
1. Count feedback referencing this category
2. If count == 0, delete the category
```

Because MongoDB does not enforce ACID foreign-key constraints, two concurrent requests — one creating feedback referencing a category, and one deleting that category — can both pass step 1 simultaneously. The delete wins, and the new feedback document is orphaned with a dangling `categoryId`.

The solution required eliminating the two-step window entirely. A `feedbackCount` integer field was added to the `Category` schema, incremented atomically via `$inc` the moment feedback is created. The deletion query became a single atomic operation:

```js
findOneAndDelete({ _id: categoryId, feedbackCount: 0 })
```

If `feedbackCount` is not zero, the query matches nothing and returns `null` — the category is preserved. There is no gap between the check and the delete; they are the same operation.

---

## 7. Which AI tools did you use?

**Antigravity  — used as an agentic pair programmer throughout the project. It wrote, reviewed, and refactored code across both the backend and frontend, generated the observability strategy, and identified the TOCTOU and missing index issues before they reached production.

---

## 8. Share one instance where AI helped you.

When implementing cursor-based pagination, the naive approach of using `_id < lastId` breaks when sorting by a non-unique field like `createdAt` — if two documents share the same timestamp, the cursor skips or repeats them.

AI suggested a compound tiebreaker condition:

```js
{ $or: [
    { createdAt: { $lt: cursorValue } },
    { createdAt: cursorValue, _id: { $lt: cursorId } }
]}
```

This ensures stable ordering even when the primary sort field has duplicate values. Arriving at this manually would have required significant debugging in production with real data.

---

## 9. Share one instance where you disagreed with AI and why.

At the start of the project, AI suggested building the backend with a **SQL database (PostgreSQL)** as the primary data store.

I disagreed and pushed for **MongoDB** instead — and the reason is grounded in the structure of the core entity itself. A feedback submission is a completely self-contained document: submitter name, email, star rating, comment, category reference, status, IP address, and timestamps all belong to a single record and are always read together as a unit. There are no complex relational joins needed. The only cross-collection reference is `categoryId → Category`, which is a single virtual populate — not a multi-table join.

Forcing this shape into a relational schema would have meant unnecessary table splits, join queries on every read, and migration overhead every time a field was added (such as `ipAddress` or `status`). MongoDB's document model maps naturally to the feedback entity, allows flexible schema evolution without migrations, and performs well for the primary access pattern: fetch the latest N feedback records with their category populated.

---

## 10. What would break first if this application suddenly had 100,000 users?

**The analytics aggregation pipeline — and the lack of a WebSocket/live-feed architecture.**

The admin dashboard runs `$group` and `$match` aggregation pipelines over the entire feedback collection on every page load. At 10,000 documents these are fast; at 100,000+ they become progressively expensive, and at 1M+ they will time out without caching.

The immediate fix is a **Redis cache layer** on top of the analytics queries with a 60-second TTL, so the expensive aggregation runs at most once per minute rather than on every request.

The second issue is the absence of a **WebSocket / live-update layer**. With 100,000 users submitting feedback, the admin dashboard would need to poll the API repeatedly to stay current. Real-time delivery via Socket.io (NestJS Gateways) would eliminate the polling load entirely — the server pushes each new feedback event as it arrives, rather than the admin pulling every few seconds.

Third: the single-node MongoDB instance. At this scale it requires a **replica set** for read scaling and automatic failover.

---

## 11. What is one thing in this assignment that you would improve, change, or challenge?

I would challenge the **absence of a WebSocket live-update requirement**.

The assignment specifies an admin dashboard that displays feedback data — but it is entirely poll-based. Every time the admin wants to know if new feedback has arrived, they must manually refresh the page or wait for a timed re-fetch. This is fundamentally at odds with how a real feedback management tool should behave.

In a production environment with even moderate submission volume, the admin should see new feedback appear on the dashboard **in real time** — the moment a user submits the form, the counter updates, the table row appears, and the charts reflect the new data point. This is not a luxury feature; it is the expected baseline for any live operations tool.

The correct implementation is a **NestJS WebSocket Gateway** (backed by Socket.io) that emits a `feedback.created` event to all connected admin clients whenever a new submission is saved. The React frontend subscribes to this channel and appends the new record to the table without a full refetch. This completely eliminates polling, reduces server load at scale, and makes the admin experience feel genuinely real-time.

The fact that this is absent from the assignment requirements — while observability, rate limiting, and pagination are called out explicitly — is the one gap I would challenge and close if given the opportunity.
