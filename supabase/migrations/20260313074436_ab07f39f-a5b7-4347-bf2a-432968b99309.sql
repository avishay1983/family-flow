
CREATE TABLE public.device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_name text NOT NULL,
  device_label text DEFAULT '',
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(device_id)
);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to device_registrations"
ON public.device_registrations
FOR ALL
TO public
USING (true)
WITH CHECK (true);
