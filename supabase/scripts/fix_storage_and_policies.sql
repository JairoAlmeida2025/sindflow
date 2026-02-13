-- 1. Create storage bucket for public assets if it doesn't exist
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- 2. Storage Policies
-- Allow public read access
create policy "Public Access" on storage.objects for select
using ( bucket_id = 'public-assets' );

-- Allow authenticated users to upload (both master and clients need to upload photos)
create policy "Authenticated Upload" on storage.objects for insert
with check ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );

-- Allow users to update their own uploads (or just allow authenticated for simplicity in this MVP)
create policy "Authenticated Update" on storage.objects for update
using ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );

-- Allow users to delete their own uploads
create policy "Authenticated Delete" on storage.objects for delete
using ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );

-- 3. API Keys Policies (Master Only)
-- Ensure RLS is enabled
alter table api_keys enable row level security;

-- Policy for Master to do everything on api_keys
create policy "Master Full Access API Keys" on api_keys
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'master'
  )
);
