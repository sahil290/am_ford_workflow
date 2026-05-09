create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  code text not null,
  name text not null,
  timezone text not null default 'America/Chicago',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  first_name text,
  last_name text,
  display_name text not null,
  email text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid references public.dealerships(id),
  app_user_id uuid not null references public.app_users(id),
  membership_type text not null default 'dealership',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid references public.dealerships(id),
  code text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, dealership_id, code)
);

create table if not exists public.workflow_stage_definitions (
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

create table if not exists public.vehicles (
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
  acquisition_type text not null,
  created_at timestamptz not null default now(),
  unique (dealership_id, vin),
  unique (dealership_id, stock_number)
);

create table if not exists public.recon_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  vehicle_id uuid not null references public.vehicles(id),
  workflow_template_id uuid not null references public.workflow_templates(id),
  status text not null,
  current_stage_code text not null,
  priority_score numeric(10, 2) not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  ready_for_sale_at timestamptz,
  created_by uuid references public.app_users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.recon_job_stage_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  recon_job_id uuid not null references public.recon_jobs(id),
  workflow_stage_definition_id uuid not null references public.workflow_stage_definitions(id),
  stage_code text not null,
  status text not null,
  entered_at timestamptz not null default now(),
  exited_at timestamptz,
  assigned_user_id uuid references public.app_users(id),
  elapsed_business_seconds int not null default 0,
  wait_business_seconds int not null default 0,
  sequence_no int not null
);

create table if not exists public.sla_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid references public.dealerships(id),
  code text not null,
  name text not null,
  target_hours numeric(10, 2) not null,
  warning_hours numeric(10, 2),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, dealership_id, code)
);

create table if not exists public.sla_clocks (
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

create table if not exists public.queue_board_rows (
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
  priority_score numeric(10, 2) not null default 0,
  stage_age_minutes int not null default 0,
  total_age_minutes int not null default 0,
  sla_status text not null,
  blocker_count int not null default 0,
  assigned_user_id uuid references public.app_users(id),
  sort_rank bigint not null,
  snapshot_version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_stream (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid not null references public.dealerships(id),
  entity_type text not null,
  entity_id uuid not null,
  activity_type text not null,
  headline text not null,
  body text,
  actor_user_id uuid references public.app_users(id),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid references public.dealerships(id),
  user_id uuid not null references public.app_users(id),
  category text not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.domain_event_outbox (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id),
  dealership_id uuid references public.dealerships(id),
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

create index if not exists dealerships_scope_idx
  on public.dealerships (tenant_id, status);

create index if not exists memberships_scope_idx
  on public.user_memberships (tenant_id, dealership_id, app_user_id, status);

create index if not exists vehicles_scope_idx
  on public.vehicles (tenant_id, dealership_id, created_at desc);

create index if not exists recon_jobs_stage_idx
  on public.recon_jobs (tenant_id, dealership_id, current_stage_code, status, priority_score desc);

create index if not exists stage_instances_job_idx
  on public.recon_job_stage_instances (recon_job_id, entered_at desc);

create unique index if not exists stage_instances_active_idx
  on public.recon_job_stage_instances (recon_job_id, stage_code)
  where status = 'active';

create index if not exists sla_clocks_due_idx
  on public.sla_clocks (tenant_id, dealership_id, status, due_at);

create index if not exists queue_board_rows_board_idx
  on public.queue_board_rows (tenant_id, dealership_id, board_code, queue_code, sort_rank);

create index if not exists queue_board_rows_sla_idx
  on public.queue_board_rows (tenant_id, dealership_id, sla_status, stage_age_minutes desc);

create index if not exists activity_stream_entity_idx
  on public.activity_stream (entity_type, entity_id, occurred_at desc);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists domain_event_outbox_pending_idx
  on public.domain_event_outbox (processed_at, available_at, id)
  where processed_at is null;
