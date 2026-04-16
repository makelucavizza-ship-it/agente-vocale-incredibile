-- Migration 003: tabella chiusure/ferie
-- Esegui nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS closures (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL UNIQUE,
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
