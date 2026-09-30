-- Product image storage: public read (bucket is public), admin-only writes.
-- Upsert needs INSERT + SELECT + UPDATE policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "product-images: admin select" on storage.objects
for select to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin update" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin delete" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
