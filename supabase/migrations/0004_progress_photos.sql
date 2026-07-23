-- v3 bloc 3 : photos de progression liées à une date (pas forcément à une
-- séance précise) + bucket Storage privé pour les fichiers image.

-- ============================================================================
-- progress_photos : métadonnée (date, chemin du fichier), pas le fichier lui-même
-- ============================================================================
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_date date not null,
  storage_path text not null unique, -- "<user_id>/<uuid>.jpg", vérifié aussi par les policies Storage
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index progress_photos_user_id_date_idx on progress_photos(user_id, taken_date);

alter table progress_photos enable row level security;

create policy "progress_photos_select_own" on progress_photos
  for select using (auth.uid() = user_id);
create policy "progress_photos_insert_own" on progress_photos
  for insert with check (auth.uid() = user_id);
create policy "progress_photos_update_own" on progress_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_photos_delete_own" on progress_photos
  for delete using (auth.uid() = user_id);

create trigger progress_photos_set_updated_at
  before update on progress_photos
  for each row execute function set_updated_at();

-- ============================================================================
-- Storage : bucket privé, un dossier par utilisateur ("<user_id>/...")
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Convention de chemin : le premier segment du chemin est l'UUID de
-- l'utilisateur propriétaire (storage.foldername renvoie les segments de
-- dossier du chemin, donc [1] est le premier).
create policy "progress_photos_storage_select_own"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_update_own"
  on storage.objects for update
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_delete_own"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
