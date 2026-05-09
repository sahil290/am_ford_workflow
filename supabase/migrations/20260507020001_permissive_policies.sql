-- Allow public read access to core setup tables
create policy "Allow public read access to tenants"
  on public.tenants for select using (true);

create policy "Allow public read access to dealerships"
  on public.dealerships for select using (true);

create policy "Allow public read access to workflow_templates"
  on public.workflow_templates for select using (true);

create policy "Allow public read access to workflow_stage_definitions"
  on public.workflow_stage_definitions for select using (true);

create policy "Allow public read access to queue_board_rows"
  on public.queue_board_rows for select using (true);

-- Allow public insert to intake related tables
create policy "Allow public insert to vehicles"
  on public.vehicles for insert with check (true);

create policy "Allow public read to vehicles"
  on public.vehicles for select using (true);

create policy "Allow public insert to recon_jobs"
  on public.recon_jobs for insert with check (true);

create policy "Allow public read to recon_jobs"
  on public.recon_jobs for select using (true);

create policy "Allow public update to recon_jobs"
  on public.recon_jobs for update using (true);
