
CREATE TABLE public.imc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.app_clients(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL,
  age INTEGER,
  sex TEXT,
  goal TEXT,
  imc NUMERIC(5,2) NOT NULL,
  category TEXT NOT NULL,
  meal_plan TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.imc_records TO service_role;

ALTER TABLE public.imc_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.imc_records FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX imc_records_client_idx ON public.imc_records (client_id, created_at DESC);
