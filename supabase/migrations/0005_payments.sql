-- Add admin flag and plan expiry to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Payments table — tracks upgrade requests awaiting admin approval
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type       TEXT        NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  amount          INTEGER     NOT NULL,            -- IDR, e.g. 39000 or 390000
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  note            TEXT,                            -- user's transfer note / reference
  rejection_note  TEXT,                            -- admin rejection reason
  approved_by     UUID        REFERENCES public.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users may view their own payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users may create their own pending payments
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx  ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_created_idx ON public.payments(created_at DESC);
