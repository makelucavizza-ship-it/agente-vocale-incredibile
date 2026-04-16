-- Migration 001: CRM features, business settings, waitlist
-- Esegui nel SQL Editor di Supabase

-- Colonne CRM su clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS skin_type  TEXT,
  ADD COLUMN IF NOT EXISTS allergies  TEXT,
  ADD COLUMN IF NOT EXISTS birthday   DATE;

-- Tabella business_settings (flag booleani per ogni feature)
CREATE TABLE IF NOT EXISTS business_settings (
  key        TEXT PRIMARY KEY,
  value      BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO business_settings (key, value) VALUES
  ('crm_enabled',         true),
  ('badge_noshow',        true),
  ('efficiency_view',     true),
  ('profitability_view',  true),
  ('seasonality_view',    true),
  ('smart_waitlist',      true),
  ('reminder_24h',        false),
  ('briefing_wa',         false),
  ('voice_notes',         false),
  ('photo_before_after',  false),
  ('voice_booking',       false),
  ('voice_stock',         false),
  ('sentiment_analysis',  false),
  ('monthly_report',      false),
  ('revenue_forecast',    false),
  ('business_mode',       false),
  ('welcome_ritual',      false),
  ('post_treatment_wa',   false),
  ('anniversary_msg',     false),
  ('birthday_msg',        false),
  ('life_moment_surprise',false),
  ('seasonal_advice',     false),
  ('loyalty_invisible',   false),
  ('skin_diary',          false),
  ('referral_amplified',  false),
  ('google_reviews_auto', false),
  ('scarcity_waitlist',   false),
  ('partnership_qr',      false),
  ('educational_broadcast',false),
  ('social_reminder',     false)
ON CONFLICT (key) DO NOTHING;

-- Tabella waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name    TEXT NOT NULL,
  client_phone   TEXT,
  service        TEXT NOT NULL,
  preferred_date DATE,
  notes          TEXT,
  status         TEXT DEFAULT 'waiting', -- 'waiting' | 'notified' | 'booked'
  created_at     TIMESTAMPTZ DEFAULT now()
);
