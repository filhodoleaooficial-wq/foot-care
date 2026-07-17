CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage quiz questions"
  ON quiz_questions
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read published quiz questions"
  ON quiz_questions
  FOR SELECT
  USING (is_published = true);

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
