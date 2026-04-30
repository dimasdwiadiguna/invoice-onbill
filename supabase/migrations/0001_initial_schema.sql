-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enum types ───────────────────────────────────────────────────────────────
CREATE TYPE public.entity_type      AS ENUM ('individual', 'cv', 'pt');
CREATE TYPE public.plan_type        AS ENUM ('free', 'pro');
CREATE TYPE public.invoice_status   AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE public.invoice_tax_type AS ENUM ('pph21', 'pph23', 'none');
CREATE TYPE public.invoice_template AS ENUM (
  'it_software', 'konsultasi',
  'kreator_endorse', 'kreator_production', 'kreator_afiliasi',
  'umkm_jasa'
);

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL DEFAULT '',
  email                TEXT        NOT NULL DEFAULT '',
  address              TEXT,
  entity_type          public.entity_type,
  has_npwp             BOOLEAN     NOT NULL DEFAULT false,
  npwp_number          VARCHAR(15),
  is_pkp               BOOLEAN     NOT NULL DEFAULT false,
  logo_url             TEXT,
  brand_color          TEXT,
  invoice_prefix       TEXT,
  preferred_font       TEXT,
  custom_footer        TEXT,
  plan                 public.plan_type NOT NULL DEFAULT 'free',
  onboarding_completed BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── clients ──────────────────────────────────────────────────────────────────
CREATE TABLE public.clients (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  address        TEXT,
  npwp           VARCHAR(20),
  pic_name       TEXT,
  pic_email      TEXT,
  internal_notes TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- ─── invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE public.invoices (
  id             UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID                     NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id      UUID                     NOT NULL REFERENCES public.clients(id),
  invoice_number TEXT                     NOT NULL,
  template       public.invoice_template  NOT NULL,
  status         public.invoice_status    NOT NULL DEFAULT 'draft',
  issue_date     DATE                     NOT NULL,
  due_date       DATE,
  paid_date      DATE,
  -- monetary values in Rupiah × 100 (integer pence to avoid float rounding)
  subtotal       BIGINT                   NOT NULL DEFAULT 0,
  dpp            BIGINT                   NOT NULL DEFAULT 0,
  pph_amount     BIGINT                   NOT NULL DEFAULT 0,
  ppn_amount     BIGINT                   NOT NULL DEFAULT 0,
  net_amount     BIGINT                   NOT NULL DEFAULT 0,
  tax_type       public.invoice_tax_type  NOT NULL DEFAULT 'none',
  tax_rate       NUMERIC(5,4)             NOT NULL DEFAULT 0,
  memo           TEXT,
  invoice_meta   JSONB                    NOT NULL DEFAULT '{}',
  email_subject  TEXT,
  email_body     TEXT,
  created_at     TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- unique invoice number per user (excluding soft-deleted)
CREATE UNIQUE INDEX invoices_user_number_uidx
  ON public.invoices(user_id, invoice_number)
  WHERE deleted_at IS NULL;

-- ─── invoice_items ────────────────────────────────────────────────────────────
CREATE TABLE public.invoice_items (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id   UUID        NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  TEXT        NOT NULL,
  quantity     NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price   BIGINT      NOT NULL DEFAULT 0,
  subtotal     BIGINT      NOT NULL DEFAULT 0,
  sort_order   INT         NOT NULL DEFAULT 0
);

-- ─── invoice_number_sequences ─────────────────────────────────────────────────
CREATE TABLE public.invoice_number_sequences (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year     INT  NOT NULL,
  month    INT  NOT NULL,
  last_seq INT  NOT NULL DEFAULT 0,
  UNIQUE (user_id, year, month)
);

-- ─── Trigger: create user profile on auth signup ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Trigger: keep updated_at current ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON public.users    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER clients_updated_at  BEFORE UPDATE ON public.clients  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "own_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- clients
CREATE POLICY "own_select" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- invoices
CREATE POLICY "own_select" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- invoice_items (owns through invoices)
CREATE POLICY "own_select" ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "own_insert" ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "own_update" ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));
CREATE POLICY "own_delete" ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));

-- invoice_number_sequences
CREATE POLICY "own_select" ON public.invoice_number_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.invoice_number_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.invoice_number_sequences FOR UPDATE USING (auth.uid() = user_id);
