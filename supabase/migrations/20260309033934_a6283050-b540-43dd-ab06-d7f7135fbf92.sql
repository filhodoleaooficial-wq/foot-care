
-- Add PRD fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS release_type TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS release_value TEXT,
  ADD COLUMN IF NOT EXISTS external_product_id TEXT,
  ADD COLUMN IF NOT EXISTS sales_page_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_unlocked_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_locked_url TEXT,
  ADD COLUMN IF NOT EXISTS column_count INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS hidden_name BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS redirect_to_sales BOOLEAN NOT NULL DEFAULT false;

-- Add PRD fields to modules
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS content_url TEXT,
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS release_type TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS release_value TEXT,
  ADD COLUMN IF NOT EXISTS open_directly BOOLEAN NOT NULL DEFAULT false;
