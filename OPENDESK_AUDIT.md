# Opendesk Codebase Audit

**Audit date:** 2026-09-15  
**Scope:** Go API, PostgreSQL/GORM model layer, Next.js web application, deployment files, runtime configuration, and locally available validation.  
**Method:** source and route tracing; environment/configuration inspection without exposing secret values; dependency/configuration inspection; attempted automated validation. The repository root is not a Git repository. The independently initialized `frontend/` Git worktree already contained substantial uncommitted and untracked work before this audit; it was preserved.

## Executive summary

Opendesk is a functional early-stage professional-network and hiring product, not yet a production-ready global marketplace. Its implemented surface is substantially broader than a job board: accounts and verification, professional profiles, posts/comments/reactions, connections, direct messages, notifications, recruiter profiles, job posting/applying, lightweight matching, and recruiter dashboards are present.

The actual architecture is a Go/Gin monolith using GORM/PostgreSQL and a separate Next.js 16 App Router client. It does **not** use an explicit service/repository layer, migrations, test suite, durable background queue, or an API schema/contract. State-changing business logic is concentrated in controller handlers.

The highest risks are public delivery of arbitrary attachments, incomplete authorization around conversation and recruiter-message actions, plaintext reset tokens, public registration leakage of verification links, unlimited list endpoints, missing database integrity/indexes, client-readable long-lived JWTs, and a schema strategy based on runtime table/column patching. Targeted safe remediations were made during this audit; the remaining P0/P1 work needs a planned foundation iteration rather than a rewrite.

## Current architecture

| Area | Actual implementation | Assessment |
| --- | --- | --- |
| API | Go 1.23, Gin 1.10, controller-centric REST routes plus Gorilla WebSocket endpoints. [`main.go`](main.go), [`routes/routes.go`](routes/routes.go) | Sensible small-product baseline; route/handler boundaries need consolidation and tested authorization policies. |
| Persistence | PostgreSQL via GORM. UUID-centric models, Postgres arrays and JSONB. Schema is conditionally created/patched on process start. [`database/database.go`](database/database.go) | Suitable database choice; runtime schema patching is unsafe for controlled deployments. |
| Auth | bcrypt password hashing, 7-day HS256 JWT bearer token, email verification and password reset. [`utils/auth.go`](utils/auth.go), [`controllers/auth.go`](controllers/auth.go) | Password hash cost is good; token lifecycle and browser storage need redesign. |
| Frontend | Next.js 16 / React 19 / TypeScript / Tailwind 4, mostly client components and handwritten fetch wrapper. [`frontend/src/lib/api.ts`](frontend/src/lib/api.ts) | Modern stack and responsive effort; data contract/types/error handling are inconsistent. |
| Realtime | In-process websocket hubs and cron job-alert worker. [`realtime/`](realtime), [`worker/job_alert.go`](worker/job_alert.go) | Works only on one API process; not horizontally scalable or durable. |
| Deployment | Dockerfile for API; Compose runs Postgres and Redis only. [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml) | Redis is unused; no complete production deployment, health/readiness, migration, or frontend deployment configuration. |

### Request and authentication flow

1. The client posts credentials to `/auth/login`.
2. The API verifies bcrypt credentials and email verification, then returns a 7-day signed JWT.
3. The frontend writes the token to both localStorage and a JavaScript-readable cookie; its fetch wrapper sends it as `Authorization: Bearer`.
4. Gin middleware verifies the JWT signature/expiry and places `user_id` in the context.
5. Controllers query GORM directly, build ad hoc JSON responses, and sometimes broadcast in-process websocket events.

This is coherent for a prototype but token storage is XSS-sensitive, revocation is unavailable, and role data is not asserted in the token or centrally enforced.

## Current product capability

| Capability | Status | Notes |
| --- | --- | --- |
| Registration, verification, login, reset | Implemented | Verification email delivery depends on SMTP; verification has no resend throttle. |
| Professional profile | Implemented, basic | Single wide profile record with text fields/arrays; no structured work history, education, certification, project, or CV ownership model. |
| Feed/social | Implemented, basic | Post, image/media URL, comment, toggle-like, connection requests, suggested users. Feed is global, not a network/activity feed. |
| Messaging | Implemented, basic | REST persistence + websocket notifications, attachments, edit/delete/read/typing. No block enforcement, moderation, pagination, or durable realtime scaling. |
| Jobs/applications | Implemented, basic | Recruiter profile, job CRUD, skills, apply, application status, simple job metrics and recommendations. No job lifecycle/deadline/public access/search facets. |
| Recruiter workspace | Partially implemented | Recruiter jobs, applicants, messages, metrics; several UI routes are thin stubs and recruiter/dashboard duplicate routes exist. |
| Search/recommendations | Prototype | ILIKE search across users/posts/jobs and in-memory ranking after loading up to 500 jobs or 150 people. |
| Services/freelance, companies, payments | Not implemented | No service, package, order, review, company, follower, or payment models. |

## What works well and should be preserved

- The technology baseline is appropriate: Go/Gin, PostgreSQL, Next.js, TypeScript, and Tailwind are credible choices for an incremental product build.
- API middleware verifies JWT signatures and expiration and rejects a missing `JWT_SECRET`; CORS is explicit rather than wildcard. [`utils/auth.go`](utils/auth.go), [`middleware/cors.go`](middleware/cors.go)
- Passwords use bcrypt cost 14 in the primary auth utility. [`utils/auth.go`](utils/auth.go)
- Sensitive job and recruiter actions generally verify job ownership. [`controllers/jobs.go`](controllers/jobs.go), [`controllers/recruiter_dashboard.go`](controllers/recruiter_dashboard.go)
- The UI already contains a recognizable visual system (typography, themed tokens, panels, status treatments) and intentional desktop/mobile feed layouts. [`frontend/src/app/globals.css`](frontend/src/app/globals.css), [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)
- The UI has useful loading/empty treatments on several primary routes and client-side redirect guards. It should be refined, not replaced.
- The project correctly keeps real environment files ignored and supplies an environment key template. [`.gitignore`](.gitignore), [`.env.example`](.env.example)

## Findings and recommendations

### P0 — critical

#### P0-1: Public uploads could be arbitrary content and were served directly

- **Location:** `controllers/upload.go`, `controllers/message.go`, `main.go:56`
- **Problem:** Generic Cloudinary and local attachment endpoints previously accepted unsized, unvalidated content; local attachments are served under `/uploads` directly. A user could upload unexpected active or executable content, exhaust server resources, or publish material without ownership/retention controls.
- **Why it matters:** This is an XSS, malware-hosting, storage-abuse, and availability risk. Resumes and message attachments raise the risk profile further.
- **Audit fix:** Added a 10 MiB request/file limit plus extension and content-signature validation for image/PDF/DOC/DOCX uploads; active SVG and executable formats are excluded. [`utils/upload_validation.go`](utils/upload_validation.go), [`controllers/upload.go`](controllers/upload.go), [`controllers/message.go`](controllers/message.go)
- **Next:** Move private resumes/attachments to private object storage with signed download URLs, malware scanning, content-disposition controls, per-user quotas, asynchronous processing, and database ownership records. **Fix now (P0 follow-up).**

#### P0-2: Recruiter-to-applicant messages did not confirm that recipient applied to the job

- **Location:** `controllers/recruiter_messages.go:16`, `controllers/recruiter_messages.go:89`
- **Problem:** A job owner could choose any supplied user ID as a recipient or retrieve a job-scoped conversation with any ID.
- **Why it matters:** It violates the intended recruitment data boundary and enables unsolicited job-thread messaging.
- **Audit fix:** Both message creation and history now require a matching `job_applications` record. [`controllers/recruiter_messages.go`](controllers/recruiter_messages.go)
- **Next:** Give applicants their own job-message read/reply route with the same ownership check and unify it with conversation messaging. **Fix now.**

#### P0-3: Conversation read and typing endpoints accepted arbitrary conversation IDs

- **Location:** `controllers/message.go:249`, `controllers/message.go:269`
- **Problem:** Any authenticated user could mark another conversation read or emit typing events into it by guessing its UUID.
- **Why it matters:** This is an IDOR and realtime integrity vulnerability.
- **Audit fix:** Read and typing actions now check that the user is one of the two conversation owners. [`controllers/message.go`](controllers/message.go)
- **Next:** Use a database-enforced conversation participant relation as the single authorization source and add endpoint tests. **Fix now.**

#### P0-4: Password-reset tokens were stored and logged in plaintext

- **Location:** `controllers/password_reset.go`
- **Problem:** Reset tokens were persisted in plaintext and emitted to application logs if SMTP failed.
- **Why it matters:** A database/log reader could immediately reset accounts.
- **Audit fix:** New tokens are SHA-256 digested before persistence/lookup; plaintext local-testing logging was removed. [`controllers/password_reset.go`](controllers/password_reset.go)
- **Next:** Delete old plaintext rows in a deliberate migration, add one-active-token semantics, a transactional consume/update path, reset-audit events, and server-side session revocation. **Fix now.**

### P1 — high

#### P1-1: Registration validation and verification lifecycle were weak

- **Location:** `controllers/auth.go`
- **Problem:** Server registration had no required/email/password/name constraints, verification links were returned in registration responses, and verification tokens never expired.
- **Why it matters:** Client validation is bypassable; response link leakage and permanent tokens weaken account integrity.
- **Audit fix:** API validation now requires normalized email, nonempty bounded name, and an 8–72 byte password; verification links are no longer returned, and verification tokens expire in 24 hours. [`controllers/auth.go`](controllers/auth.go), [`models/user.go`](models/user.go), [`database/database.go`](database/database.go)
- **Next:** Hash verification tokens too, rate-limit registration/resend, avoid user enumeration, and require a properly managed migration. **Fix now.**

#### P1-2: Browser JWT handling has no revocation and is exposed to XSS

- **Location:** `utils/auth.go`, `frontend/src/lib/auth.ts`, `frontend/middleware.ts`
- **Problem:** A 7-day access token is stored in localStorage and in a JavaScript-readable cookie. Password reset does not invalidate it; middleware checks only presence, not validity or role.
- **Why it matters:** Any XSS can steal the bearer token; a compromised session survives credential reset until expiry.
- **Recommendation:** Replace with short-lived access tokens and rotated, HttpOnly/Secure/SameSite refresh sessions (server-side session table or a managed provider); add logout-all/reset revocation. Ensure Next middleware only handles UX routing, while API authorization remains authoritative. **Fix now; requires coordinated auth migration.**

#### P1-3: Authorization and relationship integrity remain incomplete

- **Location:** `controllers/connection.go`, `controllers/message.go`, `controllers/block.go`, models
- **Problem:** Self-connection is not rejected; target users are not checked before connection/message creation; duplicates rely on race-prone reads; blocks are neither unique nor used to restrict profiles, connections, messages, posts, or search.
- **Why it matters:** Broken social boundaries and race-created duplicate records degrade trust and make abuse controls ineffective.
- **Recommendation:** Add unique/check constraints, transaction-aware create-or-conflict logic, target existence checks, and a central `CanInteract(actor, subject)` policy applied to all relationship-sensitive controllers. **Fix now.**

#### P1-4: Jobs API is authenticated-only and unbounded; public marketplace/search is not viable

- **Location:** `routes/routes.go`, `controllers/jobs.go:80`, `controllers/search.go`
- **Problem:** Job listing/detail requires a JWT, but a job marketplace needs discoverability. Lists return all records; no consistent page/limit/filter/sort metadata exists. Job creation/edit accepts free-form types and salary values; no deadline, publication, or lifecycle model exists.
- **Why it matters:** It prevents organic discovery, leaks scale costs, and causes incompatible future API changes.
- **Recommendation:** Introduce versioned public read endpoints and authenticated management endpoints; define a `JobStatus`, employment/remote enums, deadline, currency/range validation, cursor pagination, and indexed filters. Preserve existing endpoints during a deprecation period. **Fix now (design and contract first).**

#### P1-5: Runtime database mutation replaces migrations

- **Location:** `database/database.go`
- **Problem:** Startup conditionally creates tables and columns but does not run GORM AutoMigrate across all models or create/alter indexes/constraints deterministically. The newly added verification expiry column follows the same compatibility pattern.
- **Why it matters:** Schema drift, incomplete releases, and rollback impossibility are production risks. `Block` was not previously included in startup table creation.
- **Audit fix:** `Block` and `VerifyExpiresAt` are included in the compatibility bootstrap. [`database/database.go`](database/database.go)
- **Recommendation:** Adopt a versioned migration tool (goose/atlas or GORM migrations with an explicit migration runner); baseline the existing database first, then remove runtime schema mutation from the request-serving binary. **Fix now.**

#### P1-6: Message, feed, and recruiter queries have N+1/unbounded patterns

- **Location:** `controllers/message.go`, `controllers/post.go`, `controllers/recruiter_dashboard.go`, `controllers/recommendation.go`, `worker/job_alert.go`
- **Problem:** Conversation list looks up user/profile/last message per conversation; message history loads attachments per message; feed loads profile and like counts per post; recruiter dashboards count/load per job/applicant; recommendations run per-candidate queries and load a fixed 500/150 record window.
- **Why it matters:** Latency and database load grow linearly or worse; matching quality is biased by arbitrary recent windows.
- **Recommendation:** Define paginated query shapes, select projection DTOs, grouped aggregates, joins/subqueries, and query/index plans verified with `EXPLAIN ANALYZE`. Move recommendation scoring to bounded offline/precomputed candidates only after baseline query health. **Fix now for core list flows; later for sophisticated recommendations.**

#### P1-7: Realtime and job alerts are single-process, nondurable systems

- **Location:** `realtime/chat_hub.go`, `realtime/notifications.go`, `worker/job_alert.go`
- **Problem:** Websocket clients exist only in Go process memory; cron reads all alert preferences, spawns an unbounded goroutine per preference, and has no job locking/retry/dead-letter mechanism.
- **Why it matters:** Multiple API replicas silently lose/cross-miss events; worker failures and duplicate alerts are likely under load.
- **Recommendation:** First make notifications reliable in the database with polling fallback/outbox; then use Redis pub/sub or a dedicated websocket gateway and a durable queue/worker with concurrency bounds and idempotency constraints. **Fix now for reliability design; later for infrastructure.**

### P2 — medium

#### P2-1: API contracts, error responses, and validation are inconsistent

- **Location:** all controllers; e.g. `controllers/profile.go`, `controllers/jobs.go`, `controllers/notification.go`
- **Problem:** Models are often returned directly, errors sometimes expose database messages, request fields mix snake_case and camelCase aliases, `Bind`/`BindJSON`/`ShouldBindJSON` are mixed, and status codes use 200 for creation.
- **Why it matters:** Frontend coupling and unsafe error disclosure make evolution expensive.
- **Recommendation:** Establish request/response DTOs, a standard error envelope with correlation ID, shared validation helpers, a route inventory/OpenAPI contract, and no raw ORM error bodies. Incrementally migrate by domain. **Later, beginning with auth/jobs.**

#### P2-2: Model integrity and indexes are insufficient for scale

- **Location:** `models/*.go`
- **Problem:** Most foreign keys lack `not null`, relationships, unique constraints, cascading policy, or composite indexes. Examples: duplicate likes, connections, blocks, conversation pairs, job applications, participant rows, and post likes are possible; `Job` mixes string and `uuid.UUID` IDs; `UserPreference` uses `gorm.Model` while other models use UUIDs.
- **Why it matters:** Race conditions and orphaned records become data quality/security bugs; indexes do not support actual list/filter query patterns.
- **Recommendation:** Create a schema design record and migrations for unique composite constraints (`job_id, applicant_id`; `post_id,user_id`; normalized conversation pair; blocks), foreign keys, indexes on owner/time/status/list filters, and consistent UUID types. **Later, preceded by data cleanup.**

#### P2-3: Search/recommendations are prototype features presented as product capability

- **Location:** `controllers/search.go`, `controllers/jobs.go`, `controllers/recommendation.go`, `utils/ai.go`
- **Problem:** Search is ILIKE-only with hardcoded limits; recommendations use in-memory scoring/repeated queries; embedding code is a stub. Sponsored/boost language in UI has no billing/governance implementation.
- **Why it matters:** Results will not scale or meet user expectations; UI can promise features that do not exist.
- **Recommendation:** Begin with PostgreSQL `pg_trgm` + full-text `tsvector` fields, filter/sort pagination, and explainable non-ML ranking; label nonfunctional promotion as unavailable until a real product decision exists. **Later.**

#### P2-4: UX system is promising but inconsistent and not fully accessible

- **Location:** `frontend/src/app/globals.css`, `frontend/src/components`, feature pages
- **Problem:** CSS has product tokens but pages still use many ad hoc Tailwind values, aggressive gradients/glass effects, varying radii/buttons/cards, raw `<img>` instead of `next/image`, modal lacks focus trap/dialog semantics, form errors are mostly generic, and dark-mode selectors do not cover all hardcoded light colors. Mobile navigation omits Jobs and primary create actions.
- **Why it matters:** The experience can feel template-like/inconsistent and is not reliably keyboard/screen-reader usable.
- **Recommendation:** Codify small primitives (Button, TextField, Select, Dialog, Card, Empty/Loading/Error state, Avatar, Badge) on current tokens; use semantic landmarks, labels, `aria-describedby`, focus-visible, accessible dialog behavior, contrast testing, and responsive task testing. Keep the current confident editorial direction; reduce decorative effects where they compete with information. **Later, after P1.**

#### P2-5: Client data fetching and error handling are duplicated

- **Location:** `frontend/src/lib/api.ts`, pages/components
- **Problem:** Pages use `apiFetch`, raw `fetch`, and thin `api`; errors expose raw API text; request loading, aborting, retrying and cache state are bespoke; React Query is installed but unused. Feed's profile update event calls `load()` twice.
- **Why it matters:** It causes unnecessary calls, inconsistent empty/error states, and difficult contract changes.
- **Recommendation:** Use the existing React Query dependency deliberately for domain hooks, typed API client and normalized errors; remove legacy overloads once migrated; add abort/cancel behavior. **Later.**

#### P2-6: UI routes and messages overstate capability

- **Location:** `frontend/src/app/recruiter/dashboard/messages/page.tsx`, `.../settings/page.tsx`, sponsor cards, `controllers/recruiter_dashboard.go`
- **Problem:** Recruiter messages/settings pages are four-line placeholders; applicant detail returns empty experience/education arrays; promotion language implies a paid tool without a product implementation.
- **Why it matters:** Users encounter false affordances and incomplete hiring workflows.
- **Recommendation:** Replace stubs with intentional "not available" states or complete them with actual backend data; do not expose payment/boost claims until approved. **Later.**

### P3 — future architecture

#### P3-1: Marketplace, company, and network product domains need a deliberate model

- **Location:** absent models/routes; current profile/job/recruiter structures
- **Problem:** Services, packages, orders, reviews, companies, following, posts/feed ranking, recommendations, and payments do not yet have data-model foundations.
- **Why it matters:** Adding them as fields to `Profile`, `Recruiter`, and `Job` will create an unmaintainable generic marketplace.
- **Recommendation:** Add bounded domain modules only after the Phase 1 contracts stabilize: `companies/memberships`, `portfolio/projects`, `services/packages`, `orders`, `reviews`, then `follows/connections/feed`. Prefer PostgreSQL-native search before a separate search cluster. **Later.**

## Security posture summary

| Control | Current state | Required next action |
| --- | --- | --- |
| Password hashing | bcrypt cost 14 for normal register/reset after audit fix | Add password policy/breach checks if appropriate and session invalidation. |
| JWT | HS256, exp, secret required | Short access + HttpOnly refresh, key rotation, session revocation. |
| Authorization | Present but controller-specific | Centralize ownership/interactions; add systematic IDOR tests. |
| Rate limiting | Login and reset only, in-memory | Apply route-specific limits with Redis/durable store; add registration/resend/upload/message limits. |
| CORS/CSRF | Explicit origins, bearer token model | Reassess CSRF when refresh cookies are introduced; maintain strict origin allowlist. |
| Uploads | Size/type checks added | Private files, AV scan, signed delivery, quotas, ownership. |
| Secrets | env keys ignored; no secrets surfaced in audit | Validate all required production env at boot, rotate current exposed credentials if `.env` was ever shared. |
| Observability | Gin default logs; `fmt/log` calls | Structured logs, request IDs, redaction, error reporting, metrics, health/readiness. |

## Database and migration findings

- No versioned migrations or test database bootstrap exists. The current startup patching must be treated as temporary legacy compatibility, not a deployment system.
- Model relationships and referential actions are mostly implicit. Define foreign keys and deletions before allowing account/job deletion in production.
- Required early indexes: jobs `(status, created_at DESC)`, jobs filters (employment type/remote type/location), applications `(job_id, applicant_id)` unique and `(applicant_id, created_at DESC)`, messages `(conversation_id, created_at)`, notifications `(user_id, read, created_at DESC)`, posts `(user_id, created_at DESC)`, and connections normalized pair/status indexes.
- Search should use Postgres full-text and trigram indexes with a supported query plan before Elasticsearch/OpenSearch is considered.
- Add database-side validation where it protects invariants: salary range, status enum/check, non-self relationship constraints, and unique pairs.

## Major user-flow assessment

| Flow | Current path | Friction/risk |
| --- | --- | --- |
| New professional | Register → email verification → login → feed/profile/jobs | Verification must depend on real SMTP; no guided profile completion or public job discovery; profile is not a structured career identity. |
| Job seeker | Jobs → job detail → modal apply → application saved | Jobs require login, filters/save/tracking are absent, resume is publicly addressable, no applicant-facing application list/status notifications. |
| Employer | Register/recruiter profile → post job → recruiter dashboard → applicants | Recruiter can self-create without company verification; job data lacks lifecycle; applicant data is incomplete; messaging is not a two-sided workflow. |
| Freelancer/client | No end-to-end flow | Do not market it as available until service/order/review/payments are defined. |
| Network | Feed/profile → connect/message | Blocks do not enforce boundaries; global feed and simple connection model do not yet create a trustworthy professional graph. |

## Validation and deployment audit

- **No Go test files were found** and no frontend unit/e2e test scripts exist.
- `go test ./...` completed successfully after the initial dependency/compiler warm-up. The earlier interrupted Go compiler processes were stopped before the final successful run.
- `npm run lint` currently fails with **112 errors and 41 warnings**. The dominant categories are `@typescript-eslint/no-explicit-any`, React's `set-state-in-effect` rule, hook ordering/dependency issues, and unoptimized/underspecified images. This is a pre-existing frontend quality gate failure; it is not caused by the backend-only audit changes.
- `npm run build` completed successfully. It emitted one non-blocking `baseline-browser-mapping` freshness notice (data over two months old).
- Docker Compose inspection could not be completed during the interruption. The compose definition is not an end-to-end app stack: it omits the API/frontend and includes currently unused Redis.
- The frontend Git worktree began dirty and has a single initial commit. No existing frontend edits were changed by this audit.

## Prioritized implementation plan

### Phase 1 — stable foundation (next 4–6 focused iterations)

1. **Security closure:** complete token/session redesign; reset/verification hash migration; block enforcement; route-level rate limits; private upload delivery/scanning; IDOR test matrix.
2. **Database foundation:** baseline schema migration, foreign keys/unique constraints/indexes, deterministic seed/test database, and removal plan for runtime schema patching.
3. **Job/application core:** public listing/detail discovery, typed job lifecycle/schema, pagination/filter contracts, applicant application history/status/notification workflow, and recruiter two-sided messaging.
4. **API quality:** route inventory/OpenAPI, DTOs/error envelope, controller-to-domain service extraction only where duplication/transactions demand it.
5. **Frontend quality:** typed domain hooks via React Query, reliable loading/error/empty states, accessible primitives, and mobile task testing for auth/profile/jobs/apply/recruiter paths.
6. **Operational baseline:** structured logging/redaction, request IDs, health/readiness, metrics/error reporting, CI that runs format, lint, tests, API contract checks, and build.

### Phase 2 — professional marketplace

Add portfolios/projects and structured professional history first; then service catalog, packages, inquiry/order workflow, delivery, reviews, reputation, and only then payment/escrow after a separate compliance/product decision.

### Phase 3 — professional network

Add company pages/memberships/follows, durable relationship controls, activity feed with privacy/moderation, then comments/reactions/shares/community only with reporting and abuse safeguards.

### Phase 4 — intelligent marketplace

Instrument consented, minimal product signals; build explainable rule-based matching on indexed PostgreSQL data; introduce embeddings/AI assistance only with evaluation, privacy, auditability, and user controls.

### Phase 5 — ecosystem

Payments, subscriptions, verification, employer plans, analytics, and business tooling require a separate threat model, jurisdiction/compliance work, ledger design, and operational support plan.

## Recommended near-term architectural shape

Keep the monolith and split by bounded domain within it rather than introducing microservices:

`HTTP handler → validation/DTO → domain service/policy → GORM repository/query → PostgreSQL`.

Start with `identity`, `profiles`, `jobs`, `applications`, `messaging`, `notifications`, and `recruiting`. Share only cross-cutting primitives (auth context, authorization policy, errors, pagination, observability, uploads). This gives Opendesk room for company/services/network domains without prematurely adding infrastructure.

## Changes made during this audit

- Added expiration for email verification tokens and server-side registration constraints; stopped returning verification URLs in registration responses.
- Changed new password-reset records to store token digests and stopped plaintext reset-token logging.
- Added the `Block` compatibility table and verification-expiry compatibility column to the legacy startup path.
- Added maximum upload sizing and file-signature/type checks for upload endpoints.
- Enforced job-application membership for recruiter applicant messaging/history.
- Enforced conversation membership before marking read or broadcasting typing.
- Enforced block relationships across direct messaging, recruiter outreach, connection requests, profiles, feed visibility, suggestions, and post interactions; blocking also removes an existing connection.
- Added server-side job write validation, skill normalization/deduplication, and transactional job/skill updates; application analytics now records server-authoritative apply events and uses atomic metric upserts.

These are intentionally narrow corrections. They do not complete the required production foundation, and no existing broad frontend changes were rewritten or discarded.
