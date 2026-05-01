-- ─── Client entity type ───────────────────────────────────────────────────────
-- Determines whether the client can withhold PPh.
-- Existing clients default to NULL so the app can prompt the user to confirm.
CREATE TYPE public.client_entity_type AS ENUM ('badan_usaha', 'pemerintah', 'perorangan');

ALTER TABLE public.clients
  ADD COLUMN entity_type public.client_entity_type;

-- NULL = not yet confirmed by user (migrated rows).
-- New clients will always have this set via the client form.
