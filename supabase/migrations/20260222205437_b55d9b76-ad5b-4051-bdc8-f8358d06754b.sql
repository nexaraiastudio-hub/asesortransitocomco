-- Make chat-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- Drop overly permissive public read policy if it exists
DROP POLICY IF EXISTS "Public read access for chat attachments" ON storage.objects;

-- Ensure owner-only read access
CREATE POLICY "Users can read own chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
