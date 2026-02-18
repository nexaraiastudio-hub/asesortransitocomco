
-- Create leads_usuarios table
CREATE TABLE public.leads_usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  source TEXT DEFAULT 'registro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_usuarios ENABLE ROW LEVEL SECURITY;

-- Admins can read all leads
CREATE POLICY "Admins can read all leads"
  ON public.leads_usuarios FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON public.leads_usuarios FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert for authenticated users (self-registration)
CREATE POLICY "Users can insert own lead"
  ON public.leads_usuarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role insert (from edge functions)
CREATE POLICY "Service role full access"
  ON public.leads_usuarios FOR ALL
  USING (auth.role() = 'service_role');
