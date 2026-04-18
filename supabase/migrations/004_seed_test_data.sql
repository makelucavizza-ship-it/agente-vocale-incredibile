-- ============================================================
-- DATI DI PROVA — esegui nel SQL Editor di Supabase
-- Puoi cancellare tutto con: DELETE FROM bookings; DELETE FROM clients;
-- ============================================================

-- Servizi (se non ne hai già)
INSERT INTO services (name, duration_minutes, price, active) VALUES
  ('Pulizia del viso',      60,  55.00, true),
  ('Trattamento anti-età',  90,  80.00, true),
  ('Massaggio rilassante',  60,  50.00, true),
  ('Manicure',              45,  30.00, true),
  ('Pedicure',              60,  35.00, true),
  ('Ceretta gambe',         45,  25.00, true),
  ('Sopracciglia e ciglia', 30,  20.00, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Clienti + Prenotazioni
-- ============================================================
DO $$
DECLARE
  g UUID; m UUID; f UUID; s UUID; e UUID; l UUID; a UUID; c UUID;
BEGIN

  -- 8 clienti con profili clinici diversi
  INSERT INTO clients (id, name, phone, email, birthday, skin_type, allergies, notes)
  VALUES
    (gen_random_uuid(), 'Giulia Rossi',      '+39 333 1234567', 'giulia.rossi@email.it',     '1990-06-15', 'secca',     'nichel',             'Preferisce gli orari del mattino'),
    (gen_random_uuid(), 'Maria Bianchi',     '+39 347 2345678', 'maria.bianchi@email.it',    '1985-11-22', 'grassa',    null,                 'Viene ogni 3 settimane'),
    (gen_random_uuid(), 'Francesca Ferrari', '+39 320 3456789', null,                         '1995-03-08', 'normale',   null,                 null),
    (gen_random_uuid(), 'Sofia Conti',       '+39 349 4567890', 'sofia.conti@email.it',      '1988-07-30', 'sensibile', 'profumi sintetici',  'Solo prodotti ipoallergenici'),
    (gen_random_uuid(), 'Elena Romano',      '+39 338 5678901', null,                         '1992-01-14', 'mista',     null,                 null),
    (gen_random_uuid(), 'Laura Esposito',    '+39 366 6789012', 'laura.esposito@email.it',   '1978-09-05', 'normale',   null,                 'Preferisce orari pomeridiani'),
    (gen_random_uuid(), 'Anna Ricci',        '+39 342 7890123', null,                         '1999-12-28', 'secca',     'lattice',            'Prima visita a maggio'),
    (gen_random_uuid(), 'Chiara Moretti',    '+39 351 8901234', 'chiara.moretti@email.it',   '1983-04-19', 'sensibile', null,                 'Cliente fidelizzata da 2 anni')
  ON CONFLICT DO NOTHING;

  -- Recupera gli ID per nome
  SELECT id INTO g FROM clients WHERE phone = '+39 333 1234567';
  SELECT id INTO m FROM clients WHERE phone = '+39 347 2345678';
  SELECT id INTO f FROM clients WHERE phone = '+39 320 3456789';
  SELECT id INTO s FROM clients WHERE phone = '+39 349 4567890';
  SELECT id INTO e FROM clients WHERE phone = '+39 338 5678901';
  SELECT id INTO l FROM clients WHERE phone = '+39 366 6789012';
  SELECT id INTO a FROM clients WHERE phone = '+39 342 7890123';
  SELECT id INTO c FROM clients WHERE phone = '+39 351 8901234';

  -- 20 prenotazioni nei prossimi 30 giorni
  INSERT INTO bookings (client_id, service, date, time_slot, duration_minutes, status, source, notes)
  VALUES
    -- Giulia Rossi — 3 appuntamenti
    (g, 'Pulizia del viso',       '2026-04-22', '09:30', 60, 'confirmed', 'phone',  null),
    (g, 'Sopracciglia e ciglia',  '2026-05-06', '10:00', 30, 'confirmed', 'phone',  null),
    (g, 'Trattamento anti-età',   '2026-05-13', '09:30', 90, 'confirmed', 'manual', null),

    -- Maria Bianchi — 3 appuntamenti
    (m, 'Pulizia del viso',       '2026-04-23', '11:00', 60, 'confirmed', 'phone',  null),
    (m, 'Manicure',               '2026-05-07', '14:00', 45, 'confirmed', 'manual', null),
    (m, 'Ceretta gambe',          '2026-05-16', '15:30', 45, 'confirmed', 'phone',  null),

    -- Francesca Ferrari — 2 appuntamenti
    (f, 'Massaggio rilassante',   '2026-04-25', '16:00', 60, 'confirmed', 'phone',  null),
    (f, 'Pedicure',               '2026-05-09', '10:30', 60, 'confirmed', 'phone',  null),

    -- Sofia Conti — 3 appuntamenti
    (s, 'Trattamento anti-età',   '2026-04-24', '10:00', 90, 'confirmed', 'phone',  'Solo prodotti ipoallergenici'),
    (s, 'Pulizia del viso',       '2026-05-08', '11:00', 60, 'confirmed', 'phone',  null),
    (s, 'Manicure',               '2026-05-15', '09:00', 45, 'confirmed', 'manual', null),

    -- Elena Romano — 2 appuntamenti
    (e, 'Ceretta gambe',          '2026-04-28', '14:30', 45, 'confirmed', 'phone',  null),
    (e, 'Sopracciglia e ciglia',  '2026-05-12', '11:30', 30, 'confirmed', 'manual', null),

    -- Laura Esposito — 3 appuntamenti
    (l, 'Massaggio rilassante',   '2026-04-30', '15:00', 60, 'confirmed', 'manual', null),
    (l, 'Pedicure',               '2026-05-05', '16:00', 60, 'confirmed', 'phone',  null),
    (l, 'Manicure',               '2026-05-14', '15:30', 45, 'confirmed', 'phone',  null),

    -- Anna Ricci — 2 appuntamenti
    (a, 'Pulizia del viso',       '2026-05-04', '09:00', 60, 'confirmed', 'manual', 'Prima visita'),
    (a, 'Sopracciglia e ciglia',  '2026-05-18', '10:30', 30, 'confirmed', 'manual', null),

    -- Chiara Moretti — 2 appuntamenti
    (c, 'Trattamento anti-età',   '2026-05-02', '11:00', 90, 'confirmed', 'phone',  null),
    (c, 'Ceretta gambe',          '2026-05-11', '14:00', 45, 'confirmed', 'phone',  null);

END $$;
