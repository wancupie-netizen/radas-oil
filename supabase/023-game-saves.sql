-- RADAS OIL - PATCH 023
-- Supabase cloud persistence using Anonymous Auth + RLS.

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

drop policy if exists "RADAS players read own save"
  on public.game_saves;

drop policy if exists "RADAS players insert own save"
  on public.game_saves;

drop policy if exists "RADAS players update own save"
  on public.game_saves;

create policy "RADAS players read own save"
on public.game_saves
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "RADAS players insert own save"
on public.game_saves
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "RADAS players update own save"
on public.game_saves
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update
on public.game_saves
to authenticated;