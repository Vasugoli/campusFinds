1. Application Overview

Name: CampusFinds
Purpose: A simple, secure, and reliable Lost & Found web application for college campuses that lets students post lost/found items (with photos & locations), search/filter listings, claim items, report abuse, and enables admins to moderate and manage community activity.
Target audience: College students, faculty, and campus staff 
Primary objectives:

Make it fast and easy to report and recover lost items.

Provide privacy-preserving contact/claim workflows.

Keep moderation lightweight but effective.

Be low-cost to run for campus scale while easy to operate and extend.

2. Core Features (Functional Requirements)
2.1 Authentication & Authorization

Email/password registration and login (required).

JWT-based session tokens. Support for storing tokens in httpOnly cookies or secure storage.

Roles: user, admin. Only admins can assign roles and ban users.

2.2 User Profiles

Fields: displayName, email, avatarUrl, rollNo, phone (optional), role, isBanned, createdAt.

Users can update their profile (except role and isBanned).

Admins can view full profiles and ban/unban users.

2.3 Items (Lost / Found)

Item fields: title, description, category, status (lost|found|returned), images (urls + publicIds), location (free-text + optional geo), reporterId, claimedBy, visibility (public|private), tags, searchKeywords, createdAt, updatedAt.

CRUD endpoints & UI: create, edit, delete (users only for their posts; admin can manage all).

Image upload: client uploads to Cloudinary or S3 (prefer signed upload/presets); backend stores image metadata. Validate file type & size. Produce thumbnails/resized variants.

2.4 Search & Listing

Full list with filters: category, status, location, date-range.

Text search on title, description, tags. Lightweight approach: searchKeywords array and regex search for MVP; optional Algolia integration for production.

Pagination / infinite scroll. Provide server-side pagination parameters (page & limit) and offset/skip or cursor-based.

2.5 Item Detail & Claim Flow

Item detail page with image carousel and contact/claim button.

Claim workflow: claimant sends request → reporter receives notification and can mark as returned/approve. When status becomes returned, system logs event and notifies claimant and reporter.

2.6 Reporting & Moderation

Users can report items (reason). Reports stored in reports collection with status open|reviewed|resolved.

Admin/Moderator dashboard to list reports, hide/remove items, warn/ban users.

Auto-flagging: configurable thresholds (e.g., auto-hide after N reports) and keyword-based flags.

2.7 Notifications

Email notifications (SendGrid) for critical events: new comment/claim, claim approved/denied, admin messages.

Browser push (web-push) for real-time notifications (optional).

Ability for admins to send broadcast notifications.

2.8 Admin Panel

User management (view, assign roles, ban/unban).

Item moderation (view reports, hide/delete items).

Export CSV/JSON for items, users, reports.

Basic analytics dashboard: counts for signups, items created, claims, reports.

2.9 Offline & Resilience (MVP soft support)

Frontend uses service worker + local queue to allow offline creation of items and sync when online (graceful degraded UX).

Client should show offline indicator and queued actions count.

2.10 Audit & Activity Logs

Log important actions in activityLogs: item creation/updates/deletes, claims, role changes, reports, admin actions (actor, timestamp, metadata).

3. Technical Requirements
3.1 Platforms & Languages

Backend: Deno runtime + Express (via Deno npm interop) — implement in TypeScript.

Frontend: React + TypeScript (Vite recommended).

DB: MongoDB (Atlas preferred) using Mongoose models.

Image storage: Cloudinary (recommended) 

Email: SendGrid.

Notifications: Web Push (VAPID) for browser. Optional mobile push later.

Containerization: Dockerfile for app. CI/CD pipelines for builds & deploy (GitHub Actions).

Documentation: OpenAPI/Swagger for REST API.

3.2 Integrations & Services

Authentication: JWT plus optional Google OAuth.

Logs & Monitoring: Sentry for errors, Prometheus/Grafana or hosted metrics for performance (optional).

CDN: Cloudinary or S3 + CloudFront for images.

Storage backups: MongoDB Atlas snapshots or scheduled backup scripts.

Optional: Redis for caching & rate-limiting counters.

3.3 Development & Testing Tools

Unit tests: Jest (or Deno test runner if fully Deno-native) for backend and React Testing Library + Jest for frontend.

Integration tests: Supertest or equivalent against running test server and DB (use test DB / Docker).

Functions & e2e: Cypress for critical user flows (create item, claim, admin).

Lint & format: ESLint + Prettier + Deno formatter where applicable.

3.4 File & Repo Layout (deliverable)
/client/                 # React + TS (Vite)
  /src
  /tests
  vite.config.ts
  tsconfig.json
/server/ /src/
  /models
  /routes
  /middleware
  /utils
  server.ts
  deno.json
/scripts/
  seed.ts
  migrate_from_firebase.ts (optional)
.env.example
Dockerfile
README.md
APP_DETAILS.md
openapi.yaml
.postman_collection.json
.github/workflows/ci.yml

4. Design & User Experience
4.1 Design Aesthetic

Clean, minimal, campus-friendly. Use a neutral base with one accent color (e.g., IETE blue) and one complimentary color.

Prefer Tailwind CSS for rapid styling or Material UI for component completeness.

Design system: consistent spacing, 2xl rounded corners for cards, subtle shadows, legible typography (system or Google fonts). Mobile-first responsive design.

4.2 User Flow (high-level)

Landing → brief description + CTA (Sign in / Browse Items).

Auth (register/login) → onboard (add roll no, phone optional).

Items list/search → item detail → contact/claim.

Create item → image upload → confirmation.

Notifications & profile center for tracking claims and posts.

Admin panel accessible via role check; separate route /admin.

4.3 UX Requirements & Accessibility

WCAG 2.1 AA compliance target: keyboard nav, ARIA labels, color contrast checks.

Form validation inline with clear error messages.

Image uploader with drag-and-drop, preview, and client resizing.

Skeleton loaders for lists; graceful error states with retry.

Provide tooltips and microcopy for critical actions (e.g., “Mark as returned will notify claimant”).

4.4 Wireframes & Components (deliverables)

Provide basic wireframes or component sketches for: Landing, Login, Items List, Item Detail, Create Item, Profile, Admin Dashboard.

Component library: Button, Card, Modal, ImageUploader, SearchBar, Filters, DataTable.

5. Security & Compliance
5.1 Authentication & Secrets

Use strong JWT_SECRET stored in secrets manager on prod. Tokens signed with HS256 and short-ish expiration (e.g., 7 days refreshable). Use refresh tokens or httpOnly cookies for session renewal.

Passwords: hash with bcrypt or argon2 (salted). Enforce password strength at registration.

5.2 Data Protection

Encryption in transit: TLS for all network traffic.

Encryption at rest: use DB/host provider encryption (MongoDB Atlas). For S3/Cloudinary rely on provider encryption.

PII minimization: only collect phone/rollNo if necessary; document retention policy.

Backups: regular automated DB snapshots; test restore monthly.

5.3 Access Control & Admin Safety

Role-based access control. Only admin endpoints accessible to users with admin role. All role changes audited (activityLogs).

Rate-limit auth endpoints and item creation to prevent abuse.

Input validation & sanitization using Zod or Joi. Prevent NoSQL injection and XSS.

5.4 File Upload Security

Validate MIME types and file size on client & server. Re-validate server-side after upload if possible. Generate derivative images (thumbnails) and strip metadata (EXIF) to avoid leaking location data.

Use presigned uploads or server-signed upload tokens; never accept raw base64 large payloads without limits.

5.5 Privacy & Compliance

Data retention policy: auto-purge activity logs or apply TTL on logs older than configurable threshold.

Provide privacy policy and terms of use. If storing personal data of EU citizens, follow GDPR basics: consent, data deletion on request, portability. (Adjust according to campus/legal requirements.)

Provide mechanism for user to request account deletion and data export.

5.6 Monitoring Security

Integrate Sentry for error reporting. Log important security events: failed logins, role changes, bans, repeated reports.

6. Scalability & Performance
6.1 Architecture Principles

Stateless backend API servers (no sticky session). Scale horizontally behind a load balancer. Use shared state in MongoDB and Redis (if used).

CDN for static assets & images (Cloudinary/S3 with CDN).

Use connection pooling to MongoDB and limit open connections.

6.2 Database & Indexing

Index frequently queried fields: createdAt, status, category, reporterId, searchKeywords. Composite index for status + category + createdAt.

Use pagination via cursors for large lists. Avoid large skip offsets; prefer _id or createdAt-based cursor.

Consider read-replicas for high-read workloads.

6.3 Caching & Rate-limiting

Cache frequently requested, low-change data (e.g., categories) using Redis or in-memory caches on CDNs.

Implement rate-limiting (e.g., express-rate-limit) per IP & per user for sensitive endpoints.

6.4 Image & Media Optimization

Resize & compress images client-side before upload. Generate multiple sizes on upload and serve appropriate size via srcset. Use lazy-loading for images.

Use webp where supported.

6.5 Concurrency & Background Work

Use background worker(s) or scheduled jobs for heavy tasks: image moderation, email batch sending, analytics aggregation. Use a lightweight worker or serverless functions (depending on infra).

Queue system for background tasks (Redis + Bull or simple in-memory queue for MVP).

6.6 Performance Targets & Load Testing

Response-time target: 95% of API requests < 300ms under normal campus load (e.g., 1–5k monthly active users).

Start with capacity for spikes (e.g., start/end of semester). Run load tests (k6 or Locust) before launch.

6.7 Observability

Metrics: requests per second, latency percentiles, error rates, DB ops, queue length.

Logs: structured JSON logs, indexable (e.g., ELK, Datadog). Alerts for elevated error rate or DB connection problems.

7. DevOps, CI/CD & Deployment
7.1 Environments

local (dev), staging (pre-prod), production. Use environment-specific config and secrets.

Provide deno.json tasks and npm scripts to run seed data & start dev servers.

7.2 CI/CD Pipeline

GitHub Actions pipeline:

Lint → Unit tests → Build → Integration tests → Deploy to staging on develop branch.

Merge to main triggers production deploy after manual approval.

Use secrets for DB URI, JWT secret, S3/Cloudinary keys, SendGrid key.

7.3 Container & Infrastructure

Dockerfile for backend (multi-stage) and for frontend static build. Optionally provide Helm chart or simple docker-compose for staging.

Recommend host choices: Render / Fly / DigitalOcean App Platform / Railway / Heroku / self-hosted. Provide deployment instructions for at least one target (e.g., Render).

7.4 Backups & DR

DB snapshot schedule (daily); test restores quarterly. Document RTO (acceptable downtime) and RPO (data loss tolerance), e.g., RTO < 1 hour, RPO < 1 hour (adjust to campus needs).

8. Testing & Quality Gates
8.1 Test Types & Coverage Targets

Unit tests: 70% coverage minimum for backend critical code.

Integration tests: API flows for auth, create item, claim, report, admin actions.

E2E tests: critical user flows (create + claim + admin).

Accessibility tests: axe or similar on key pages.

8.2 Acceptance Criteria

Auth flows working: register/login with JWT, protected endpoints enforce auth/roles.

Item create/edit/delete works and persists media metadata.

Search + filters return correct results with pagination.

Reporting → admin moderation → item hide/delete workflow verified.

Email notifications send for key events.

Admin CSV export includes required fields and can be downloaded.

CI passes and auto-deploys to staging.

9. Deliverables (what to produce)

Complete repository with frontend/ and backend/ code in TypeScript.

deno.json, .env.example, Dockerfile, README.md, APP_DETAILS.md.

openapi.yaml (OpenAPI 3.0) and Postman collection.

Database models and migration script(s).

Seed script to inject demo users and items.

Full test suite (unit, integration, e2e).

CI pipeline (.github/workflows/ci.yml) to lint/test/build/deploy.

Admin panel and basic analytics UI.

Security & operations docs: runbook, backup/restore steps, incident response checklist.

Performance report and suggested scaling plan (based on load tests).

Optional: migration helper for Firebase → MongoDB mapping if migrating from an earlier Firebase draft.

10. Non-functional Requirements & KPIs

Availability target: 99.5% uptime initial goal.

Latency: 95th percentile API < 300ms under normal load.

Data retention & privacy: implement deletion and export within 72 hours of request.

Test coverage: backend critical modules >= 70%.

Accessibility: WCAG 2.1 AA compliant for public pages.

11. Implementation Constraints & Preferences

Code language: TypeScript only. No mixed JS unless for build artifacts.

Runtime: Deno preferred for backend; if full Deno ecosystem causes large blockers, ensure parity and document differences.

UI stack: React + TypeScript + Tailwind (or Material UI if project prefers one rich component system).

Image service: Cloudinary recommended; provide S3 alternative implementation.

Use environment placeholders for secrets; never commit real secrets.

12. Prioritized Roadmap (MVP → v1 → extras)
MVP (deliver within first sprint)

Auth (email), create/list item, image upload, basic search, claim flow, reports, admin panel basic, tests for core flows, deployment to staging.

v1 (next)

Google OAuth, push notifications, offline queueing, analytics dashboard, CSV export, role assignment UI, automated backups & monitoring.

Extras (post v1)

Algolia search, mobile apps, in-app messaging, geolocation proximity alerts, college SSO integration, advanced image moderation (Vision API).

13. How to Use This Prompt

Paste this entire prompt into an AI project generator, or hand it to a dev team as the single spec.

Require generated code to include meaningful commits: one commit per major feature (e.g., feat(auth): add email/password auth, feat(items): add create/list endpoints).

For automated generation, request the tool to output a ZIP or repo URL and to include automated tests and CI config.
