-- Drop the insecure upload policy
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;

-- Create secure upload policy strictly bound to the user's UUID folder
CREATE POLICY "Secure upload for chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
