create table public.intel_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('OSINT','HUMINT','IMINT')),
  risk_level text not null check (risk_level in ('high','medium','low','verified')),
  latitude double precision not null,
  longitude double precision not null,
  region text,
  description text,
  notes text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.intel_nodes enable row level security;

create policy "users select own nodes" on public.intel_nodes
  for select using (auth.uid() = user_id);
create policy "users insert own nodes" on public.intel_nodes
  for insert with check (auth.uid() = user_id);
create policy "users update own nodes" on public.intel_nodes
  for update using (auth.uid() = user_id);
create policy "users delete own nodes" on public.intel_nodes
  for delete using (auth.uid() = user_id);

create index idx_intel_nodes_user on public.intel_nodes(user_id);
create index idx_intel_nodes_created on public.intel_nodes(created_at desc);

insert into storage.buckets (id, name, public) values ('intel-images','intel-images', true)
on conflict (id) do nothing;

create policy "public read intel images" on storage.objects
  for select using (bucket_id = 'intel-images');
create policy "auth upload intel images" on storage.objects
  for insert to authenticated with check (bucket_id = 'intel-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "auth delete own intel images" on storage.objects
  for delete to authenticated using (bucket_id = 'intel-images' and (storage.foldername(name))[1] = auth.uid()::text);