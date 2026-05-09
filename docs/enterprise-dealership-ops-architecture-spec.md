# Enterprise Dealership Operations Platform Architecture Spec

## 0. Scope and Assumptions

This specification assumes:

- Next.js App Router, React, TypeScript, Tailwind CSS, `shadcn/ui`, Supabase, PostgreSQL, Supabase Auth, and Supabase Realtime are already initialized.
- The current workspace does not yet contain application source files, so this document defines the target production architecture rather than refactoring an existing implementation.
- The platform is an operational system of record for recon and inter-department vehicle flow, not a generic CRUD back office.
- The initial deployment target is a single SaaS control plane with support for multiple dealership groups and multiple rooftops per group.

Primary engineering goals:

- Millions of vehicle, workflow, event, and audit records.
- Thousands of concurrent users across multiple dealerships.
- Near-real-time operational boards and queue views.
- Configurable workflow stages, SLAs, and routing rules.
- Clear path from multi-location product to true multi-tenant SaaS.

---

## 1. Production-Grade Folder Architecture for Next.js App Router

```text
src/
  app/
    (public)/
      page.tsx
    (auth)/
      sign-in/page.tsx
      callback/route.ts
      select-dealership/page.tsx
    (ops)/
      layout.tsx
      control-tower/page.tsx
      queues/
        [queueCode]/page.tsx
      boards/
        [boardCode]/page.tsx
      vehicles/
        [vehicleId]/page.tsx
      workflows/
        [reconJobId]/page.tsx
      analytics/page.tsx
      admin/
        workflow-templates/page.tsx
        sla-policies/page.tsx
        users/page.tsx
        dealerships/page.tsx
    api/
      webhooks/
        dms/route.ts
        inspections/route.ts
        parts/route.ts
      internal/
        exports/route.ts
        health/route.ts
        metrics/route.ts
      realtime/
        token/route.ts
    globals.css
    layout.tsx

  modules/
    auth/
      domain/
      application/
      infrastructure/
      ui/
    tenancy/
      domain/
      application/
      infrastructure/
      ui/
    vehicles/
      domain/
      application/
      infrastructure/
      ui/
    recon/
      domain/
      application/
      infrastructure/
      ui/
    workflow/
      domain/
      application/
      infrastructure/
      ui/
    queues/
      domain/
      application/
      infrastructure/
      ui/
    sla/
      domain/
      application/
      infrastructure/
      ui/
    notifications/
      domain/
      application/
      infrastructure/
      ui/
    files/
      domain/
      application/
      infrastructure/
      ui/
    analytics/
      domain/
      application/
      infrastructure/
      ui/
    audit/
      domain/
      application/
      infrastructure/
      ui/

  components/
    app-shell/
    data-grid/
    control-tower/
    queue-board/
    vehicle-timeline/
    forms/
    charts/
    feedback/
    shared/
    ui/

  server/
    db/
      migrations/
      seeds/
      generated/
      sql/
    repositories/
    query-services/
    commands/
    event-bus/
    projections/
    jobs/
    auth/
    observability/
    cache/

  lib/
    supabase/
      browser.ts
      server.ts
      middleware.ts
    env/
      client.ts
      server.ts
    constants/
    utils/
    formatting/
    dates/

  hooks/
  state/
  types/
  config/
  tests/
    integration/
    e2e/
    contracts/
    performance/
```

Architectural rules:

- `app/` contains routing, layouts, and page composition only.
- `modules/` owns domain logic by bounded context.
- `server/` owns data access, command handling, projections, background jobs, and observability.
- `components/` contains reusable presentation primitives and operational UI assemblies.
- Write paths and read paths are intentionally separated.

---

## 2. Scalable Feature and Module Architecture

Bounded contexts:

- `auth`: identity, sessions, SSO hooks, active context selection.
- `tenancy`: tenant, dealership, memberships, feature flags.
- `vehicles`: vehicle identity, stock metadata, acquisition source, status metadata.
- `recon`: recon job lifecycle for a vehicle unit moving through operations.
- `workflow`: stage definitions, transitions, routing rules, automation rules.
- `queues`: board projections, workload routing, assignments, capacity and WIP.
- `sla`: clocks, policies, pause rules, breach detection, escalation.
- `notifications`: in-app notifications, subscriptions, delivery channels, digests.
- `files`: photos, inspection sheets, ROs, invoices, PDFs, OCR metadata.
- `analytics`: KPIs, aggregates, throughput, aging, productivity.
- `audit`: append-only audit trail, timeline, forensic access logs.

Scaling rules:

- Each module owns its schema contract, query services, domain events, and UI surface.
- Cross-module reads happen through query services or projection tables, not direct deep coupling.
- Inter-module state changes are communicated via domain events persisted to an outbox.

---

## 3. Recommended Domain-Driven Design Structure

Per module:

```text
modules/recon/
  domain/
    entities/
    value-objects/
    policies/
    events/
    errors/
  application/
    commands/
    handlers/
    dto/
    mappers/
  infrastructure/
    repositories/
    query-services/
    serializers/
  ui/
    components/
    hooks/
    presenters/
```

Core aggregates:

- `ReconJob`: lifecycle root for a vehicle moving through operational stages.
- `WorkflowTemplate`: configurable stage model and routing rules.
- `StageInstance`: execution instance for one stage within one recon job.
- `WorkItem`: assignable unit of work inside a stage.
- `SlaClock`: SLA/TAT tracking boundary for a job or stage.
- `Notification`: durable user-facing operational alert.

Value objects:

- `DealershipScope`
- `StageCode`
- `QueueCode`
- `SlaDeadline`
- `BusinessHoursWindow`
- `VehicleIdentity`
- `Money`
- `PriorityScore`

DDD guidance:

- Keep mutations behind application command handlers.
- Keep dashboards on read models and projections, not aggregates.
- Avoid giant “vehicle service” classes spanning every department.

---

## 4. Complete Supabase Database Schema Architecture

Recommended PostgreSQL schemas:

- `public`: app tables exposed through Supabase with RLS.
- `auth`: Supabase-managed identity tables.
- `app_private`: internal helper tables and security definer functions.
- `analytics`: rollups, facts, materialized views, KPI snapshots.
- `audit`: high-volume append-only compliance and activity tables.

High-level data zones:

- Transactional: jobs, vehicles, stages, tasks, assignments.
- Configurational: workflow templates, SLAs, permissions, calendars.
- Projection: queue board rows, timeline rows, dashboard counters.
- Audit/Event: domain outbox, activity stream, audit log.
- Analytics: fact tables and aggregated metrics.

---

## 5. Recommended PostgreSQL Tables

### Tenancy and Identity

- `tenants`
- `dealer_groups`
- `dealerships`
- `app_users`
- `user_memberships`
- `roles`
- `permissions`
- `role_permissions`
- `membership_roles`
- `feature_flags`

### Vehicle and Recon Core

- `vehicles`
- `vehicle_acquisitions`
- `stock_units`
- `recon_jobs`
- `recon_job_status_history`
- `workflow_templates`
- `workflow_stage_definitions`
- `workflow_transition_rules`
- `workflow_stage_sla_bindings`
- `recon_job_stage_instances`
- `recon_job_blockers`
- `work_items`
- `work_item_assignments`
- `department_capacity_snapshots`

### Queue and Board Projection

- `queue_definitions`
- `queue_memberships`
- `queue_routing_rules`
- `queue_board_rows`
- `queue_row_tags`
- `board_configurations`
- `board_saved_views`

### SLA and Time Tracking

- `business_calendars`
- `business_calendar_holidays`
- `sla_policies`
- `sla_policy_rules`
- `sla_clocks`
- `sla_clock_pauses`
- `sla_breaches`
- `tat_snapshots`

### Files and Communication

- `file_objects`
- `file_versions`
- `vehicle_photos`
- `documents`
- `comments`
- `comment_mentions`
- `notifications`
- `notification_deliveries`
- `user_notification_preferences`

### Audit, Events, and Projection Support

- `domain_event_outbox`
- `integration_event_inbox`
- `activity_stream`
- `audit.audit_log`
- `audit.access_log`
- `analytics.kpi_snapshots`
- `analytics.queue_metrics_hourly`
- `analytics.stage_metrics_daily`

### External Integrations

- `integration_connections`
- `integration_sync_runs`
- `integration_sync_errors`
- `external_entity_mappings`

---

## 6. Relationship Diagrams

### Tenancy

```text
tenant
  -> dealer_group
    -> dealership
      -> user_membership
        -> membership_roles
          -> roles
            -> role_permissions
              -> permissions
```

### Operational Core

```text
vehicle
  -> stock_unit
  -> recon_job
      -> workflow_template
      -> recon_job_stage_instances
          -> work_items
              -> work_item_assignments
      -> sla_clocks
      -> recon_job_blockers
      -> comments
      -> file_objects
      -> activity_stream
```

### Workflow Configuration

```text
workflow_template
  -> workflow_stage_definitions
      -> workflow_transition_rules
      -> workflow_stage_sla_bindings
      -> queue_definitions
```

### Realtime Projection

```text
recon_job_stage_instances
work_items
sla_clocks
recon_job_blockers
  -> queue_board_rows
  -> analytics.queue_metrics_hourly
  -> activity_stream
```

---

## 7. Workflow Engine Architecture

The workflow engine is the operational heart of the platform.

Core design:

- `workflow_templates` define a dealership or tenant-specific operational flow.
- `workflow_stage_definitions` define ordered or parallel stages, owning department, queue mapping, exit criteria, and automation hooks.
- `recon_jobs` are workflow executions tied to a stock unit or vehicle.
- `recon_job_stage_instances` record actual entry, exit, owner, blockers, and stage metrics.

Workflow engine requirements:

- Support linear stages and future parallel branches.
- Support conditional routing by acquisition type, vehicle class, store, or exception path.
- Support manual override with full audit trail.
- Support stage re-entry without corrupting historical TAT.

Recommended transition model:

- Commands: `StartReconJob`, `AdvanceStage`, `ReopenStage`, `PauseStage`, `CompleteWorkItem`, `AddBlocker`, `RemoveBlocker`.
- Transition guard checks: permission, prerequisite tasks, required documents, approval state, and blocker state.
- Every successful command writes domain rows and outbox events in one transaction.

Do not derive board state directly from raw workflow joins at runtime. Persist the current executable state into `queue_board_rows`.

---

## 8. Event-Driven Architecture

Use a transactional outbox pattern.

Flow:

1. Domain command writes business tables.
2. Same transaction inserts an event into `domain_event_outbox`.
3. Background worker claims pending outbox rows with `FOR UPDATE SKIP LOCKED`.
4. Worker publishes side effects:
   - update board projections
   - update activity stream
   - update KPI snapshots
   - trigger notifications
   - send external webhooks
   - broadcast realtime patches
5. Event marked processed with retry metadata.

Why this matters:

- Prevents lost updates between business writes and notifications.
- Decouples write latency from downstream workload.
- Allows replay for projections and analytics rebuilds.

Event families:

- `recon.job.*`
- `workflow.stage.*`
- `work-item.*`
- `sla.clock.*`
- `notification.*`
- `integration.sync.*`

---

## 9. Queue Management Architecture

Operational queues are first-class domain objects, not filtered tables.

Core tables:

- `queue_definitions`: canonical queue metadata and sorting defaults.
- `queue_routing_rules`: rule-based placement logic.
- `queue_board_rows`: denormalized current board state for fast reads.
- `department_capacity_snapshots`: current and historical capacity.

Queue row payload should include:

- tenant and dealership scope
- recon job id
- vehicle identity summary
- current stage
- current queue
- assigned department and owner
- age in stage
- overall age
- SLA status
- blocker flags
- priority score
- sort rank
- snapshot version

Queue operations:

- claim
- assign
- move
- escalate
- hold
- release blocker
- bulk reprioritize

Board reads hit `queue_board_rows`, never fully normalized joins.

---

## 10. SLA and TAT Engine Design

The SLA engine must support operational timing, not just timestamps.

Core objects:

- `sla_policies`: named policies per tenant, dealership, department, or stage.
- `sla_policy_rules`: thresholds, business-hours behavior, pause conditions, escalation thresholds.
- `sla_clocks`: active and historical clocks per recon job or stage instance.
- `sla_clock_pauses`: reasoned pause intervals.
- `sla_breaches`: breach and recovery events.

Clock semantics:

- Start on stage entry or explicit trigger.
- Pause on approved waits such as parts delay, customer hold, vendor hold, missing title.
- Resume on unblock event.
- Stop on stage completion.
- Evaluate against dealership-local business calendar and time zone.

Recommended derived fields on `sla_clocks`:

- `started_at`
- `due_at`
- `breached_at`
- `completed_at`
- `elapsed_business_seconds`
- `paused_business_seconds`
- `remaining_business_seconds`
- `status`

TAT strategy:

- Persist stage-level actuals in `recon_job_stage_instances`.
- Persist current job-level TAT snapshot in `tat_snapshots`.
- Build dashboard KPIs from snapshots and aggregate facts, not raw ad hoc math.

---

## 11. Realtime Synchronization Architecture

Use Supabase Realtime selectively.

Subscribe to:

- `queue_board_rows`
- `notifications`
- `activity_stream`
- lightweight `department_capacity_snapshots`

Do not subscribe clients directly to large normalized tables at scale.

Recommended realtime pattern:

- Server writes update projection rows.
- Clients subscribe by `tenant_id`, `dealership_id`, and `board_code`.
- Realtime payload carries row change and `snapshot_version`.
- Client patches local cache if version is newer.
- Fallback invalidation triggers targeted refetch.

Use broadcast or presence channels for:

- active viewers on a board
- card locks during drag operations
- collaboration indicators

Use Postgres-change streams only for durable data. Use broadcast for ephemeral UI state.

---

## 12. State Management Architecture

Split state by responsibility:

- Server Components: initial auth context, route-level bootstrapping, default filters, non-live reference data.
- TanStack Query: network cache for read models and command refresh orchestration.
- Zustand: purely client-side operational UI state.
- Supabase client: session handling and realtime subscriptions.

Zustand owns:

- grid density
- visible columns
- current saved view
- pinned filters
- side panel state
- selected cards or rows
- drag and bulk selection state
- client-only ticker offsets

TanStack Query owns:

- queue rows
- vehicle detail query
- stage history
- notifications feed
- KPI widgets
- workflow configuration read models

Avoid mixing domain data into Zustand. It will create stale synchronization problems under heavy realtime traffic.

---

## 13. React Query, Zustand, and Supabase Strategy

Recommended strategy:

- Route entry loads shell and reference data in Server Components.
- Client components hydrate TanStack Query with initial data.
- Mutations go through Server Actions or typed client-to-route handlers.
- On mutation success:
  - optimistic patch local row if safe
  - await authoritative realtime event or refetch projection
- Supabase browser client is used for:
  - auth session
  - realtime subscriptions
  - signed file URL retrieval when needed

Query key examples:

- `["queue-board", tenantId, dealershipId, boardCode, savedViewId, filtersHash]`
- `["vehicle-detail", tenantId, dealershipId, vehicleId]`
- `["kpi", tenantId, dealershipId, widgetCode, period]`
- `["notifications", userId, dealershipId]`

Realtime cache behavior:

- Patch row-level updates directly when the projection payload is complete.
- Invalidate only the affected query slice.
- Batch invalidations with debounce during bursts.

---

## 14. Dashboard Rendering Strategy

The control tower is a streaming operational surface, not a static analytics page.

Rendering approach:

- Server-render the page shell, navigation, active dealership context, and default widget configuration.
- Stream high-priority above-the-fold widgets first.
- Render each board or widget as an isolated client island with independent query and subscription lifecycle.
- Use suspense boundaries around queue, timeline, and KPI clusters.

Widget contract:

- widget config
- query service
- threshold logic
- loading skeleton
- error boundary
- realtime adapter

Treat widgets as composable operational modules, not dashboard cards hardcoded into one page.

---

## 15. Large Table and Grid Rendering Architecture

Operational grids must be server-driven.

Requirements:

- cursor pagination
- server-side sorting
- server-side filtering
- column pinning
- saved views
- bulk actions
- row-level updates
- keyboard navigation

Recommended stack:

- `@tanstack/react-table`
- `@tanstack/react-virtual`
- custom grid wrapper in `components/data-grid`

Grid API should accept:

- `columns`
- `queryState`
- `rows`
- `rowVersion`
- `selectionModel`
- `bulkActions`
- `onCommand`

Do not ship client-side filtering over tens of thousands of rows.

---

## 16. Virtualization Strategy

Use virtualization everywhere rows or cards can exceed a few hundred items.

Recommendations:

- Fixed row heights for primary queue grids.
- Virtualized column rendering for ultra-wide operational tables.
- Virtualized lane card stacks for dense board columns.
- Avoid deeply variable heights on live boards because layout thrash will hurt subscription bursts.

For row detail:

- render detail in side sheet instead of row expansion by default
- if inline expansion is required, use measured virtualization carefully and only in secondary screens

---

## 17. Realtime Operational Board Architecture

Board types:

- department board
- stage board
- exception board
- SLA breach board
- ready-for-sale board

Board row source:

- `queue_board_rows` projection

Board lane examples:

- `check-in`
- `inspection`
- `estimate`
- `approval`
- `parts-wait`
- `mechanical`
- `detail`
- `photo`
- `pricing`

Drag-drop behavior:

- UI drag is only a command intent.
- Server validates route, ownership, and prerequisites.
- Server mutation updates authoritative workflow state.
- Projection refresh and realtime event update board.

Card surface fields:

- stock number
- VIN short
- make model trim
- days in recon
- time in stage
- SLA chip
- blocker badges
- owner
- promised ready date
- key exceptions

---

## 18. Notification Architecture

Notification layers:

- in-app durable notifications
- ephemeral toast alerts
- email and SMS future channels
- Slack or Teams future escalation channels

Notification categories:

- assignment
- SLA warning
- SLA breach
- blocker added
- approval requested
- stage stalled
- parts arrived
- vehicle ready for next department

Core design:

- Persist durable notifications in `notifications`.
- Deliver channel attempts in `notification_deliveries`.
- Use user preferences table for routing by severity and category.
- Support digest and immediate delivery modes.

---

## 19. Audit Logging Architecture

Audit logging must support compliance, dispute resolution, and operations debugging.

Capture:

- actor user id
- actor membership scope
- command name
- entity type
- entity id
- before payload
- after payload
- changed fields
- correlation id
- ip address
- user agent
- source surface
- timestamp

Implementation:

- Append-only `audit.audit_log`
- Partition monthly when event volume grows
- Write audit rows in the same transaction for critical command operations

Do not use application logs as your audit system.

---

## 20. Activity Timeline Architecture

Timeline is a user-facing projection, not a direct audit feed.

Timeline sources:

- stage entered
- stage completed
- assignment changed
- comment added
- file uploaded
- approval requested
- approval granted or denied
- blocker added or resolved
- SLA breached or recovered

Projection table:

- `activity_stream`

Recommended columns:

- `tenant_id`
- `dealership_id`
- `entity_type`
- `entity_id`
- `occurred_at`
- `actor_user_id`
- `activity_type`
- `headline`
- `body`
- `metadata jsonb`

Render strategy:

- timeline query is paginated by entity and time
- display grouped human-readable events
- keep raw machine audit data separate

---

## 21. File and Document Management Architecture

Use Supabase Storage for binary assets and Postgres metadata tables for relational access.

Storage buckets:

- `vehicle-photos`
- `inspection-documents`
- `repair-documents`
- `pricing-documents`
- `exports`

Metadata tables:

- `file_objects`
- `file_versions`
- `documents`

Required metadata:

- tenant and dealership scope
- entity linkage
- original filename
- mime type
- byte size
- checksum
- uploaded by
- storage path
- scan status
- OCR status
- document classification

Rules:

- originals immutable
- derived thumbnails and previews versioned separately
- signed URLs short-lived
- security checks happen through metadata row access plus bucket path convention

---

## 22. Supabase RLS Policy Strategy

RLS is mandatory, but must be optimized for scale.

Policy principles:

- Every transactional table includes `tenant_id`.
- Most operational tables include `dealership_id`.
- User access is determined through `user_memberships`.
- Privilege expansion happens through roles and permissions, not hardcoded email logic.

Recommended pattern:

- `auth.uid()` maps to `app_users.auth_user_id`.
- Security definer helper functions return:
  - active tenant
  - active dealership set
  - permission checks
- Policies use cheap equality filters and indexed membership joins.

Example policy shape:

```sql
tenant_id = app_private.current_tenant_id()
and dealership_id = any(app_private.current_dealership_ids())
```

Avoid:

- large subqueries inside every policy
- JSON parsing inside policy clauses
- permission logic duplicated in multiple policy files

Use service-role only for:

- background jobs
- outbox processing
- system integrations
- backfills and maintenance

---

## 23. Multi-Dealership Architecture

Model:

- `tenant` = SaaS customer or dealer organization
- `dealer_group` = optional grouping layer for enterprise accounts
- `dealership` = rooftop or location

Operational rules:

- recon jobs always belong to one dealership
- users can belong to multiple dealerships
- boards and KPIs are dealership-scoped by default
- regional managers get roll-up access across selected dealerships

Data model rule:

- include both `tenant_id` and `dealership_id` on operational rows even when derivable
- this improves index locality, query simplicity, and policy performance

---

## 24. Future Multi-Tenant SaaS Architecture

Near-term:

- single Supabase project
- logical isolation via `tenant_id`
- RLS-enforced access

Growth path:

- tenant-aware feature flags
- tenant-aware workflow templates
- tenant-aware branding and settings
- tenant-aware integrations

Scale path:

- keep largest append-only tables partitionable by time and tenant
- prepare for premium tenant isolation by moving large customers to dedicated databases or dedicated Supabase projects if needed
- define all integration credentials per tenant, never globally

SaaS control-plane readiness:

- `tenants`
- `subscriptions`
- `plans`
- `feature_flags`
- `usage_counters`

---

## 25. Authentication Flow Architecture

Flow:

1. User signs in with Supabase Auth.
2. On callback, app resolves `app_user` and memberships.
3. User selects active tenant and dealership if more than one.
4. Middleware validates session and active context cookie.
5. Server Components bootstrap permissioned navigation and data scope.

Enterprise-ready auth roadmap:

- email magic link for early teams
- passwordless or MFA for internal ops
- SSO via SAML or OIDC for enterprise groups
- SCIM future for user provisioning

Keep auth concerns separate from authorization scope selection.

---

## 26. RBAC Architecture

RBAC model:

- `permissions`: atomic capabilities
- `roles`: named bundles
- `membership_roles`: assignments at tenant or dealership scope

Example permissions:

- `recon.job.view`
- `recon.job.edit`
- `workflow.stage.advance`
- `workflow.override`
- `queue.assign`
- `queue.bulk-reprioritize`
- `sla.policy.manage`
- `analytics.view`
- `admin.users.manage`

Role examples:

- technician
- service advisor
- recon manager
- used car manager
- parts manager
- detail lead
- pricing manager
- regional director
- tenant admin

Authorization model:

- RBAC for coarse grants
- attribute checks for scope and workflow-specific conditions
- command handlers enforce both permission and business rules

---

## 27. API and Service Layer Structure

Recommended server composition:

```text
server/
  commands/
    recon/
    workflow/
    queue/
    notifications/
  repositories/
    *.repository.ts
  query-services/
    queue-board.query-service.ts
    vehicle-detail.query-service.ts
    kpi.query-service.ts
  projections/
    queue-board.projector.ts
    activity-stream.projector.ts
  event-bus/
    outbox-dispatcher.ts
    event-handlers/
```

Responsibilities:

- repositories: transactional persistence for aggregates
- command handlers: business mutations
- query services: optimized read models
- projectors: build denormalized views
- event handlers: async reactions

Do not let route handlers speak SQL directly except for very small read-only cases.

---

## 28. Server Actions vs API Routes Strategy

Use Server Actions for:

- authenticated first-party UI commands
- low-latency form submits
- stage transition actions
- assignment commands
- comment creation

Use API Routes for:

- external webhooks
- mobile scanner or kiosk clients
- exports and file streaming
- public or machine-to-machine integration endpoints
- long-running idempotent command endpoints

Rule of thumb:

- if the caller is your own React tree, prefer Server Actions
- if the caller is external, cross-platform, or needs explicit HTTP contract, use API Routes

---

## 29. Edge Functions Usage Strategy

Use Supabase Edge Functions for:

- external webhook normalization close to the database
- asynchronous outbox consumers when lightweight
- scheduled notification digests
- file post-processing triggers
- AI enrichment entrypoints in the future

Do not put the full workflow engine in Edge Functions.

Use Edge Functions as:

- stateless adapters
- orchestrators
- lightweight processors

If event throughput exceeds Edge limits, move workers to a dedicated container or queue worker while keeping the outbox contract unchanged.

---

## 30. Error Handling Architecture

Error taxonomy:

- `ValidationError`
- `AuthorizationError`
- `ConflictError`
- `InvariantViolationError`
- `IntegrationError`
- `TransientInfrastructureError`
- `NotFoundError`

Rules:

- domain and application layers throw typed errors
- route and action boundaries map errors to user-safe responses
- every error response carries correlation id
- UI distinguishes:
  - retryable failure
  - validation issue
  - stale state conflict
  - permission denial

Operational boards must handle optimistic conflicts gracefully because multiple users will work the same unit.

---

## 31. Validation Architecture

Validation stack:

- Zod schemas for input contracts
- domain invariants in command handlers
- database constraints for final enforcement

Use all three layers.

Examples:

- Zod validates request shape
- command handler validates stage transition prerequisites
- database unique index prevents duplicate active stage instance

Never rely on client validation for queue or workflow integrity.

---

## 32. Logging and Observability Strategy

Minimum stack:

- structured JSON logs
- request and command correlation ids
- OpenTelemetry tracing
- error monitoring such as Sentry
- infrastructure metrics from hosting and Supabase

What to log:

- command execution
- query latency above threshold
- realtime subscription errors
- outbox backlog size
- projection lag
- integration failures
- auth and RLS failures

Golden signals:

- route latency
- command latency
- outbox dispatch lag
- queue projection freshness
- realtime delivery error rate
- database CPU and index hit rate

---

## 33. Environment Variable Architecture

Separate:

- public client env
- server-only env
- job-worker env

Recommended typed env files:

- `src/lib/env/client.ts`
- `src/lib/env/server.ts`

Categories:

- Supabase URLs and keys
- app URL and cookie domain
- logging and telemetry DSNs
- integration credentials
- feature flags
- storage bucket names
- cron or worker tunables

Never access raw `process.env` outside the env modules.

---

## 34. Deployment Architecture

Recommended initial topology:

- Next.js app on Vercel
- Supabase managed Postgres, Auth, Storage, Realtime
- Supabase Edge Functions for adapters and lightweight workers
- optional dedicated worker service as scale grows

Environments:

- local
- preview
- staging
- production

Environment practices:

- isolated Supabase project per environment
- migration-only schema changes
- seeded demo dealership data in non-prod
- preview deployments point to preview-safe environment only

---

## 35. Performance Optimization Strategy

Key principles:

- read from projections
- write to normalized tables
- avoid broad subscriptions
- avoid offset pagination on hot tables
- precompute board-centric data

Hot-path optimization targets:

- queue board reads under 200 ms
- stage transition command under 300 ms excluding external calls
- control tower first meaningful render under 2 s on typical enterprise network

Major tactics:

- cursor pagination
- selective field projection
- batched realtime invalidation
- background analytics aggregation
- partitioning for append-only histories

---

## 36. Query Optimization Strategy

Read model strategy:

- build query services around operational views
- use CTEs and lateral joins sparingly and benchmark them
- avoid giant ORM-generated joins for board surfaces

Patterns:

- current board query reads `queue_board_rows`
- detail query joins normalized tables for one vehicle or recon job
- KPI query reads aggregated facts and current snapshots

Use EXPLAIN ANALYZE on every hot dashboard and board query before production.

---

## 37. Caching Strategy

Caching layers:

- request deduplication in Server Components
- TanStack Query client cache
- derived projection tables in Postgres
- optional external cache later for expensive cross-store analytics

Cache rules:

- live boards are dynamic and should not use stale full-page caching
- static config like workflow templates can use short revalidation
- KPI widgets can use low-second freshness windows if not truly live

Primary “cache” for this system is projection design, not CDN page caching.

---

## 38. Indexing Strategy

Mandatory index patterns:

- all tables: primary key
- all scoped tables: `tenant_id`
- operational tables: `(tenant_id, dealership_id, status)`
- queue board: `(tenant_id, dealership_id, queue_code, sort_rank)`
- stage instances: `(recon_job_id, entered_at desc)`
- active stage lookup: partial unique index on active stage rows
- SLA clocks: `(tenant_id, dealership_id, status, due_at)`
- activity stream: `(entity_type, entity_id, occurred_at desc)`
- notifications: `(user_id, read_at, created_at desc)`

Use:

- BTREE for hot lookup and sort paths
- BRIN for huge append-only time-series tables
- GIN for targeted JSONB search only where justified

---

## 39. Realtime Optimization Strategy

Scale rules:

- subscribe to projection tables only
- filter subscriptions by dealership and board
- coalesce multiple domain changes into one projection update when possible
- include row version for idempotent client patching

Burst handling:

- debounce query invalidation
- rate-limit toasts
- update counters separately from full row payloads when that is cheaper

Realtime freshness SLO:

- board projection visible to subscribed clients within 1 to 3 seconds after committed command

---

## 40. Event Naming Conventions

Convention:

- `<bounded-context>.<entity>.<past-tense-action>`

Examples:

- `recon.job.created`
- `recon.job.priority-changed`
- `workflow.stage.entered`
- `workflow.stage.completed`
- `workflow.stage.reopened`
- `work-item.assigned`
- `work-item.completed`
- `sla.clock.breached`
- `sla.clock.recovered`
- `notification.created`

Rules:

- use past tense for facts
- use imperative names only for commands
- keep names stable for analytics and integrations

---

## 41. Naming Conventions

Database:

- tables: plural snake_case
- columns: snake_case
- enum values: lowercase snake_case
- foreign keys: `<referenced_table_singular>_id`

TypeScript:

- types and classes: PascalCase
- functions: camelCase
- constants: SCREAMING_SNAKE_CASE for true constants only
- files: kebab-case

UI:

- component names by business purpose, not visual primitive alone
- example: `QueueBoardCard`, not `VehicleCard2`

---

## 42. Suggested Reusable UI Architecture

Reusable UI layers:

- primitives from `shadcn/ui`
- operational composites
- domain-specific work surfaces

Operational composites:

- `AppShell`
- `ControlTowerHeader`
- `QueueFiltersBar`
- `DataGrid`
- `BoardLane`
- `BoardCard`
- `SlaBadge`
- `AgingBadge`
- `BlockerPill`
- `AssignmentAvatarStack`
- `TimelineList`
- `MetricTile`
- `ExceptionPanel`

Design direction:

- dense information surfaces
- strong hierarchy
- state color system for SLA and blocker severity
- keyboard-first operations
- side panels instead of modal-heavy flows

---

## 43. Operational Dashboard Widget Architecture

Each widget is a package with:

- widget config
- query function
- transform or threshold logic
- visual component
- realtime refresh adapter

Widget examples:

- vehicles by stage
- SLA breaches now
- aging over threshold
- department WIP vs capacity
- approvals awaiting action
- parts wait count
- ready-for-sale today
- throughput last 24 hours

Recommended file shape:

```text
components/control-tower/widgets/
  sla-breach-widget/
    config.ts
    query.ts
    transform.ts
    component.tsx
```

---

## 44. KPI Calculation Architecture

Do not calculate core KPIs directly from hot transactional joins at request time.

Layers:

- current-state projections for live operational KPIs
- hourly aggregates for near-term trends
- daily facts for reporting

KPI examples:

- average days in recon
- stage dwell time by department
- SLA attainment rate
- approval turnaround
- parts delay rate
- ready-for-sale throughput
- reopen rate
- technician utilization proxy

Calculation pipeline:

- domain events
- projector writes current snapshots
- background job rolls up hourly and daily facts

---

## 45. Analytics Architecture

Short term:

- OLTP and analytics share Postgres with separate `analytics` schema

Medium term:

- replicate event and fact tables to warehouse when advanced BI or data science grows

Analytics tables:

- `analytics.kpi_snapshots`
- `analytics.queue_metrics_hourly`
- `analytics.stage_metrics_daily`
- `analytics.dealership_scorecards_daily`

Rule:

- executive dashboards query analytics facts
- operational command center queries live projections plus small aggregates

---

## 46. Suggested Hooks Architecture

Hooks by category:

- auth and tenancy
- board and grid
- vehicle detail
- realtime
- command execution
- notifications

Examples:

- `useActiveTenant()`
- `useActiveDealership()`
- `useQueueBoard()`
- `useQueueBoardSubscription()`
- `useVehicleDetail()`
- `useVehicleTimeline()`
- `useSlaTicker()`
- `useCommandMutation()`
- `usePermission()`
- `useNotificationFeed()`

Rules:

- data hooks wrap TanStack Query
- realtime hooks own subscription wiring and cache patching
- UI state hooks stay thin and compose Zustand selectors

---

## 47. Suggested Component Architecture

Page structure:

- route page
- screen component
- section components
- widget or board components
- domain detail side sheet

Example:

```text
app/(ops)/control-tower/page.tsx
  -> ControlTowerScreen
    -> ControlTowerHeader
    -> DepartmentCapacityStrip
    -> SlaBreachWidget
    -> QueueBoardPreview
    -> ExceptionsPanel
```

Vehicle detail surface:

- header summary
- current stage panel
- SLA panel
- blockers panel
- assignments panel
- files panel
- activity timeline

---

## 48. Suggested Repository and Service Pattern

Pattern:

- repositories for transactional persistence
- query services for reads
- command handlers for writes
- domain services only where cross-aggregate policy is needed

Examples:

- `ReconJobRepository`
- `StageInstanceRepository`
- `QueueBoardQueryService`
- `AdvanceStageHandler`
- `SlaClockService`

Read/write split rule:

- if a function returns board rows, it belongs in a query service
- if a function changes workflow state, it belongs in a command handler

---

## 49. Background Jobs Architecture

Job categories:

- outbox dispatch
- projection rebuild
- SLA sweep and escalation
- KPI rollups
- notification digesting
- integration sync
- stale workflow detection

Execution plan:

- pg_cron for simple scheduled triggers
- Edge Functions for lightweight asynchronous processors
- dedicated worker service for high-volume event processing if required

Job safety:

- idempotency keys
- retry with backoff
- dead-letter status
- visibility into lag and failures

---

## 50. Future AI Integration Architecture

AI should attach to the event and document pipelines, not invade core transactional flows.

Near-term AI opportunities:

- OCR and document classification for inspection sheets and invoices
- estimate summarization
- photo quality checks
- parts delay risk prediction
- bottleneck prediction
- ETA prediction for ready-for-sale
- operational anomaly detection

Data architecture:

- `ai_jobs`
- `ai_job_results`
- `document_embeddings` if semantic retrieval is needed

Integration rules:

- AI writes suggestions, never silent authoritative workflow mutations
- high-confidence automation still goes through explicit command handlers
- store model version, prompt version, and confidence score

---

## Reference Table Designs

### `tenants`

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
```

### `dealerships`

```sql
create table public.dealerships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealer_group_id uuid references public.dealer_groups(id),
  code text not null,
  name text not null,
  timezone text not null,
  business_calendar_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index dealerships_tenant_idx on public.dealerships (tenant_id, status);
```

### `vehicles`

```sql
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  vin text not null,
  stock_number text not null,
  year int,
  make text,
  model text,
  trim text,
  mileage int,
  exterior_color text,
  interior_color text,
  acquisition_type text not null,
  created_at timestamptz not null default now(),
  unique (dealership_id, vin),
  unique (dealership_id, stock_number)
);
create index vehicles_scope_idx on public.vehicles (tenant_id, dealership_id, created_at desc);
```

### `recon_jobs`

```sql
create table public.recon_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  vehicle_id uuid not null references public.vehicles(id),
  workflow_template_id uuid not null references public.workflow_templates(id),
  status text not null,
  current_stage_code text not null,
  priority_score numeric(10,2) not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  ready_for_sale_at timestamptz,
  created_by uuid references public.app_users(id),
  updated_at timestamptz not null default now()
);
create index recon_jobs_scope_stage_idx on public.recon_jobs
  (tenant_id, dealership_id, current_stage_code, status, priority_score desc);
```

### `workflow_stage_definitions`

```sql
create table public.workflow_stage_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  workflow_template_id uuid not null references public.workflow_templates(id),
  stage_code text not null,
  display_name text not null,
  sequence_no int not null,
  department_code text not null,
  queue_code text not null,
  stage_type text not null default 'primary',
  allows_reentry boolean not null default false,
  is_terminal boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  unique (workflow_template_id, stage_code),
  unique (workflow_template_id, sequence_no)
);
```

### `recon_job_stage_instances`

```sql
create table public.recon_job_stage_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  recon_job_id uuid not null references public.recon_jobs(id),
  workflow_stage_definition_id uuid not null references public.workflow_stage_definitions(id),
  stage_code text not null,
  status text not null,
  entered_at timestamptz not null default now(),
  exited_at timestamptz,
  assigned_department_code text,
  assigned_user_id uuid references public.app_users(id),
  elapsed_business_seconds int not null default 0,
  wait_business_seconds int not null default 0,
  sequence_no int not null
);
create index stage_instances_job_idx on public.recon_job_stage_instances (recon_job_id, entered_at desc);
create unique index stage_instances_one_active_per_stage_idx
  on public.recon_job_stage_instances (recon_job_id, stage_code)
  where status = 'active';
```

### `queue_board_rows`

```sql
create table public.queue_board_rows (
  recon_job_id uuid primary key references public.recon_jobs(id),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  board_code text not null,
  queue_code text not null,
  lane_code text not null,
  current_stage_code text not null,
  stock_number text not null,
  vin text not null,
  vehicle_label text not null,
  priority_score numeric(10,2) not null default 0,
  stage_age_minutes int not null default 0,
  total_age_minutes int not null default 0,
  sla_status text not null,
  blocker_count int not null default 0,
  assigned_user_id uuid references public.app_users(id),
  sort_rank bigint not null,
  snapshot_version bigint not null default 1,
  updated_at timestamptz not null default now()
);
create index queue_board_rows_board_idx on public.queue_board_rows
  (tenant_id, dealership_id, board_code, queue_code, sort_rank);
create index queue_board_rows_sla_idx on public.queue_board_rows
  (tenant_id, dealership_id, sla_status, stage_age_minutes desc);
```

### `sla_clocks`

```sql
create table public.sla_clocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  recon_job_id uuid not null references public.recon_jobs(id),
  stage_instance_id uuid references public.recon_job_stage_instances(id),
  policy_id uuid not null references public.sla_policies(id),
  status text not null,
  started_at timestamptz not null,
  due_at timestamptz not null,
  breached_at timestamptz,
  completed_at timestamptz,
  elapsed_business_seconds int not null default 0,
  paused_business_seconds int not null default 0
);
create index sla_clocks_due_idx on public.sla_clocks
  (tenant_id, dealership_id, status, due_at);
```

### `domain_event_outbox`

```sql
create table public.domain_event_outbox (
  id bigint generated always as identity primary key,
  tenant_id uuid not null,
  dealership_id uuid,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_name text not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  retry_count int not null default 0,
  error_message text
);
create index domain_event_outbox_pending_idx on public.domain_event_outbox
  (processed_at, available_at, id)
  where processed_at is null;
```

### `activity_stream`

```sql
create table public.activity_stream (
  id bigint generated always as identity primary key,
  tenant_id uuid not null,
  dealership_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  activity_type text not null,
  headline text not null,
  body text,
  actor_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index activity_stream_entity_idx on public.activity_stream
  (entity_type, entity_id, occurred_at desc);
```

---

## Recommended Implementation Order

1. Establish tenancy, auth context, memberships, and permission model.
2. Build vehicle, recon job, workflow template, and stage instance schema.
3. Implement command handlers for stage transitions and assignment flow.
4. Introduce outbox, activity stream, and queue board projection.
5. Build live control tower and queue boards against projection tables.
6. Add SLA clocks, pause logic, and breach escalations.
7. Layer notifications, file management, and analytics rollups.
8. Add external integrations and AI-assisted features after core workflow stability.

---

## Final Architectural Position

This platform should be built as a workflow and projection system with:

- normalized transactional writes
- denormalized board and KPI reads
- transactional outbox for event propagation
- dealership-scoped realtime subscriptions
- RLS-enforced multi-dealership tenancy
- strict separation of command and query responsibilities

If the team follows one principle above all others, it should be this:

Do not make the operational command center read directly from raw transactional joins under load. Persist operational truth into projections optimized for boards, queues, SLA visibility, and live coordination.
