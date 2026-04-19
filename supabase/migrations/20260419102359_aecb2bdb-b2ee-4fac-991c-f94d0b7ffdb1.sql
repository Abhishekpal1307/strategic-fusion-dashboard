drop policy if exists "public read intel images" on storage.objects;
create policy "owner list intel images" on storage.objects
  for select to authenticated using (bucket_id = 'intel-images' and (storage.foldername(name))[1] = auth.uid()::text);