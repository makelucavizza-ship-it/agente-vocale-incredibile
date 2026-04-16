-- Migration 002: tabella configurazione feature
-- Esegui nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS feature_config (
  key        TEXT PRIMARY KEY,
  config     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);
