# Acowale Feedbacker

A production-grade **Feedback Management System** built with NestJS, React, and MongoDB. Supports public feedback submission, admin review, analytics, category management, and full observability.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features Implemented](#features-implemented)
- [Architecture Overview](#architecture-overview)
- [Backend — API Reference](#backend--api-reference)
- [Frontend — UI Pages](#frontend--ui-pages)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Seeding Demo Data](#seeding-demo-data)
- [Running Tests](#running-tests)
- [Generating Static API Docs](#generating-static-api-docs)
- [Observability & Logging](#observability--logging)
- [Security Measures](#security-measures)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | NestJS 11 (TypeScript) |
| **Database** | MongoDB via Mongoose |
| **Authentication** | JWT stored in HttpOnly Cookie |
| **Frontend Framework** | React 19 + Vite 6 (TypeScript) |
| **State Management** | Zustand |
| **Form Validation** | React Hook Form + Zod |
| **HTTP Client** | Axios |
| **Styling** | Vanilla CSS with CSS custom properties |
| **API Documentation** | Swagger / OpenAPI 3.0 |
| **Logging** | Winston (structured JSON) via nest-winston |
| **Rate Limiting** | @nestjs/throttler |
| **Security Headers** | Helmet.js |
| **Health Checks** | @nestjs/terminus |
| **Alerts / Modals** | SweetAlert2 |

---

## Project Structure

```
Acowale Feedbacker/
├── acowale-feedbacker-api/          # NestJS Backend
│   ├── src/
│   │   ├── app.module.ts            # Root module — wires all feature modules
│   │   ├── main.ts                  # Bootstrap: Helmet, CORS, Swagger, pipes
│   │   ├── common/
│   │   │   ├── decorators/          # @Roles() decorator
│   │   │   ├── filters/             # HttpExceptionFilter — structured error responses
│   │   │   ├── guards/              # JwtAuthGuard, RolesGuard
│   │   │   ├── interceptors/        # LoggingInterceptor, ResponseInterceptor
│   │   │   └── interfaces/          # JwtPayload type
│   │   ├── config/                  # Typed config factories (app, db, jwt, throttler)
│   │   ├── database/seeds/          # seed.ts — inserts demo admin + categories
│   │   ├── health/                  # HealthController — /api/v1/health
│   │   ├── scripts/
│   │   │   └── generate-api-docs.ts # Exports OpenAPI spec to docs/api-docs.json
│   │   └── modules/
│   │       ├── auth/                # Login, logout, JWT strategy, Passport local
│   │       ├── users/               # User schema, UsersService
│   │       ├── categories/          # Category CRUD + atomic feedbackCount
│   │       ├── feedback/            # Submission, filtering, cursor pagination, status update
│   │       └── analytics/           # Dashboard aggregation queries
│   ├── logs/                        # Winston output: combined.log, error.log
│   ├── docs/                        # Generated OpenAPI spec (api-docs.json)
│   └── .env                         # Environment variables
│
└── acowale-feedbacker-ui/           # React + Vite Frontend
    ├── src/
    │   ├── main.tsx                 # Entry point
    │   ├── App.tsx                  # Router — public vs admin routes
    │   ├── api/                     # API client functions (one file per resource)
    │   │   ├── axios.instance.ts    # Axios with baseURL + credentials
    │   │   ├── auth.api.ts
    │   │   ├── feedback.api.ts
    │   │   ├── categories.api.ts
    │   │   └── analytics.api.ts
    │   ├── components/layout/       # AdminLayout (sidebar, header, footer)
    │   ├── pages/
    │   │   ├── FeedbackPage.tsx     # Public feedback submission form
    │   │   ├── LoginPage.tsx        # Admin login
    │   │   ├── DashboardPage.tsx    # Admin analytics dashboard
    │   │   ├── FeedbackListPage.tsx # Admin feedback table + cursor pagination
    │   │   ├── CategoriesPage.tsx   # Category management (add/edit/delete)
    │   │   └── NotFoundPage.tsx
    │   ├── store/                   # Zustand auth store
    │   ├── types/                   # Shared TypeScript interfaces
    │   ├── schemas/                 # Zod validation schemas
    │   └── index.css                # Global design tokens + shared components
    └── .env                         # VITE_API_URL
```

---

## Features Implemented

### Core Requirements
- [x] Public feedback submission form (name, email, category, star rating, comment)
- [x] Admin authentication (JWT in HttpOnly Cookie)
- [x] Admin dashboard with analytics (total feedback, average rating, category breakdown, trend chart, rating distribution donut chart)
- [x] Admin feedback table with search, filter by category/status/rating, sort
- [x] Admin status management (update feedback status: pending → reviewed → archived)
- [x] Category management (create, edit, delete with icon/color picker)
- [x] Input validation (both client-side Zod and server-side class-validator)
- [x] Structured error responses via global `HttpExceptionFilter`
- [x] Rate limiting (5 submissions per minute per IP on the public endpoint)
- [x] Health check endpoint (`GET /api/v1/health`)
- [x] Helmet security headers
- [x] CORS configuration

### Bonus / Production-Grade Features
- [x] **Authentication** — JWT in HttpOnly Cookie (not localStorage); prevents XSS token theft
- [x] **Unit Tests** — `FeedbackService`, `AuthService`, `AppController` (12 tests, all passing)
- [x] **Observability** — `LoggingInterceptor` attaches `x-request-id` correlation ID to every request; logs method, URL, status, and response time in structured JSON
- [x] **Persistent Logging** — Winston writes to `logs/combined.log` (all) and `logs/error.log` (errors only)
- [x] **Cursor-based Pagination** — Admin feedback list uses index-seek pagination (O(log n)) instead of `skip()` (O(n))
- [x] **Database Indexes** — `feedback` collection indexed on `categoryId`, `status`, and `createdAt` for O(log n) query performance
- [x] **TOCTOU Race Condition Fix** — Category deletion uses atomic `findOneAndDelete({ feedbackCount: 0 })` to prevent orphaned feedback documents
- [x] **Static API Docs** — `npm run docs:generate` exports full OpenAPI spec to `docs/api-docs.json` (importable in Postman, Insomnia, Redocly)
- [x] **Swagger UI** — Available in dev/staging at `http://localhost:3000/api/docs`
- [x] **Responsive Design** — Mobile and tablet-friendly layout (hamburger nav, stacked filters)
- [x] **Dark Mode** — `data-theme="dark"` CSS variable override
- [x] **Form auto-clear** — Feedback form clears after successful submission
- [x] **Demo seed data** — `npm run seed` populates admin account and sample categories

---

## Architecture Overview

```
Browser
  │
  ├─ Public Route: /
  │     FeedbackPage (React)
  │       └─ POST /api/v1/feedback          ←──── Rate-limited (5/min/IP)
  │
  └─ Admin Routes: /admin/*
        Protected by JwtAuthGuard + RolesGuard
        │
        ├─ /admin/dashboard   → GET /api/v1/analytics/summary
        ├─ /admin/feedback    → GET /api/v1/feedback?cursor=...&limit=10
        └─ /admin/categories  → CRUD /api/v1/categories


NestJS Request Pipeline:
  Incoming Request
    → Helmet (security headers)
    → CORS check
    → Cookie Parser
    → ThrottlerGuard (rate limit)
    → LoggingInterceptor (attach x-request-id, start timer)
    → JwtAuthGuard + RolesGuard (protected routes)
    → ValidationPipe (DTO validation)
    → Controller → Service → MongoDB
    → ResponseInterceptor (wrap in { success, data })
    → LoggingInterceptor (log status + duration)
    → HttpExceptionFilter (on error: structured { error, message, statusCode })
```

---

## Backend — API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login with email + password. Sets `access_token` HttpOnly cookie |
| `POST` | `/auth/logout` | Admin | Clears the `access_token` cookie |
| `GET` | `/auth/me` | Admin | Returns the currently authenticated admin user |

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | List all active categories |
| `POST` | `/categories` | Admin | Create a new category |
| `PATCH` | `/categories/:id` | Admin | Update category name, icon, or color |
| `DELETE` | `/categories/:id` | Admin | Delete category (only if no feedback references it) |

### Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/feedback` | Public | Submit feedback (rate-limited: 5/min per IP) |
| `GET` | `/feedback` | Admin | List feedback with cursor pagination + filters |
| `GET` | `/feedback/:id` | Admin | Get a single feedback record |
| `PATCH` | `/feedback/:id/status` | Admin | Update feedback status |

**Cursor Pagination Query Parameters (GET /feedback):**

| Param | Type | Description |
|---|---|---|
| `cursor` | `string` | ID of the last document from the previous page |
| `limit` | `number` | Results per page (default: 10, max: 100) |
| `search` | `string` | Search across name, email, and comment |
| `categoryId` | `string` | Filter by category |
| `status` | `string` | `pending` \| `reviewed` \| `archived` |
| `rating` | `number` | Filter by exact star rating (1–5) |
| `sortBy` | `string` | `createdAt` \| `rating` \| `submitterName` |
| `sortOrder` | `string` | `ASC` \| `DESC` |

**Response shape:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "limit": 10,
    "hasNextPage": true,
    "nextCursor": "abc123",
    "total": 248
  }
}
```

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics/summary` | Admin | Total count, avg rating, status breakdown, category breakdown, trend data, rating distribution |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns MongoDB connection status and uptime |

---

## Frontend — UI Pages

### Public

| Route | Page | Description |
|---|---|---|
| `/` | `FeedbackPage` | Public feedback submission form. Category dropdown populated from API. Star rating widget. Zod schema validation. Form clears on success. |

### Admin (JWT Protected)

| Route | Page | Description |
|---|---|---|
| `/admin/login` | `LoginPage` | Email + password login. Sets HttpOnly cookie. |
| `/admin/dashboard` | `DashboardPage` | Stats cards (total, avg rating, pending count). Trend line chart. Donut chart (rating distribution). Recent feedback table. Category breakdown. |
| `/admin/feedback` | `FeedbackListPage` | Full feedback table. Cursor-based previous/next pagination. Search, filter, sort controls. Inline status dropdown per row. |
| `/admin/categories` | `CategoriesPage` | Category list with icon + color badges. Add / Edit modal. Delete with confirmation. |

---

## Setup & Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** running locally on `mongodb://localhost:27017` (or provide a connection URI in `.env`)

### 1. Clone and install dependencies

```bash
# Install backend dependencies
cd acowale-feedbacker-api
npm install

# Install frontend dependencies
cd ../acowale-feedbacker-ui
npm install
```

### 2. Configure environment variables

**Backend** — create `acowale-feedbacker-api/.env`:
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173
COOKIE_SECRET=your-super-secret-cookie-key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/acowale-feedbacker

# JWT
JWT_SECRET=your-jwt-secret-minimum-32-chars
JWT_EXPIRES_IN=24h

# Rate Limiter
THROTTLER_TTL=60000
THROTTLER_LIMIT=10

# Logging
LOG_LEVEL=info
```

**Frontend** — create `acowale-feedbacker-ui/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Running the Application

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd acowale-feedbacker-api
npm run start:dev       # Watch mode with ts-node

# Terminal 2 — Frontend (http://localhost:5173)
cd acowale-feedbacker-ui
npm run dev
```

### URLs

| Service | URL |
|---|---|
| Public feedback form | http://localhost:5173 |
| Admin login | http://localhost:5173/admin/login |
| Swagger UI (dev only) | http://localhost:3000/api/docs |
| Health check | http://localhost:3000/api/v1/health |

---

## Seeding Demo Data

Populates the database with an admin user account and sample categories:

```bash
cd acowale-feedbacker-api
npm run seed
```

**Demo admin credentials:**
```
Email:    admin@acowale.com
Password: Admin@123
```

**Sample categories created:**
- 🐛 Bug Report
- 💡 Feature Request
- 📖 Documentation
- ⚡ Performance
- 🎨 Design / UX

---

## Running Tests

```bash
cd acowale-feedbacker-api
npm run test          # Run all unit tests
npm run test:cov      # Run with coverage report
```

**Test suites:**

| Suite | Tests | Description |
|---|---|---|
| `AppController` | 1 | Smoke test — app bootstraps |
| `AuthService` | 5 | Login validation, JWT generation, bad credentials |
| `FeedbackService` | 6 | Create, validate category, cursor pagination, findById, updateStatus |

All 12 tests pass.

---

## Generating Static API Docs

Generates a static OpenAPI spec file — importable into Postman, Insomnia, Redocly, or SwaggerHub — without a running server:

```bash
cd acowale-feedbacker-api
npm run docs:generate
```

Output: `docs/api-docs.json` and optionally `docs/api-docs.yaml` (if `js-yaml` is installed).

This file can be committed to the repository and diffed in CI to detect accidental breaking API changes.

---

## Observability & Logging

### Request Correlation

Every incoming HTTP request receives a unique `x-request-id` header (generated server-side if not provided by the client). This ID is attached to every log line for that request, enabling full request tracing across log aggregators (Datadog, ELK, Grafana Loki).

### Log Output

| File | Contents |
|---|---|
| `logs/combined.log` | All requests: method, URL, status code, duration (ms), request ID |
| `logs/error.log` | Only `error` level entries: unhandled exceptions, 5xx responses |
| Console | Colorized, human-readable format in development |

### Log Format (JSON)

```json
{
  "timestamp": "2026-06-25T00:00:00.000Z",
  "level": "info",
  "message": "HTTP Response",
  "requestId": "a1b2c3d4-...",
  "method": "POST",
  "url": "/api/v1/feedback",
  "statusCode": 201,
  "duration": "42ms"
}
```

### Health Check

`GET /api/v1/health` returns MongoDB connection state and process uptime:

```json
{
  "status": "ok",
  "info": {
    "mongodb": { "status": "up" }
  },
  "details": {
    "mongodb": { "status": "up" }
  }
}
```

---

## Security Measures

| Measure | Implementation |
|---|---|
| **HttpOnly JWT Cookie** | Token never accessible to JavaScript — prevents XSS theft |
| **Helmet.js** | Sets `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, CSP headers |
| **CORS** | Strict origin whitelist via `CORS_ORIGIN` env var |
| **Rate Limiting** | Public feedback endpoint: 5 requests/minute per IP |
| **Input Validation** | `class-validator` + `ValidationPipe(whitelist: true, forbidNonWhitelisted: true)` — strips unknown fields |
| **Role-based Auth** | `@Roles(UserRole.ADMIN)` decorator + `RolesGuard` on all admin routes |
| **Swagger disabled in prod** | Swagger UI only served when `NODE_ENV !== 'production'` |
| **Static API Docs** | `npm run docs:generate` produces a static spec for external integrators |
