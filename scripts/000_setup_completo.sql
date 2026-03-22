-- =====================================================
-- SCRIPT DE INSTALACIÓN COMPLETO
-- Panel de Gestión de Cuentas de Streaming
-- Ejecuta este archivo UNA SOLA VEZ en el SQL Editor de Supabase
-- =====================================================


-- =====================================================
-- PASO 1: TABLAS PRINCIPALES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.streaming_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_user_capacity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.streaming_services(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_days INTEGER NOT NULL,
  expiration_date DATE NOT NULL,
  user_capacity INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  credentials TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  profile_name TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_deletion')),
  deactivated_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('5_days', '3_days', '1_day', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- PASO 2: ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON public.accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_service_id ON public.accounts(service_id);
CREATE INDEX IF NOT EXISTS idx_accounts_expiration_date ON public.accounts(expiration_date);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON public.notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_name ON public.account_users(user_name);
CREATE INDEX IF NOT EXISTS idx_account_users_user_phone ON public.account_users(user_phone);
CREATE INDEX IF NOT EXISTS idx_account_users_status ON public.account_users(status);
CREATE INDEX IF NOT EXISTS idx_account_users_scheduled_deletion ON public.account_users(scheduled_deletion_at);


-- =====================================================
-- PASO 3: FUNCIONES Y TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiration_date := NEW.start_date + (NEW.duration_days || ' days')::INTERVAL;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expiration_date ON public.accounts;
CREATE TRIGGER trigger_update_expiration_date
  BEFORE INSERT OR UPDATE OF start_date, duration_days
  ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_expiration_date();

CREATE OR REPLACE FUNCTION update_account_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.status = 'expired' AND NEW.expiration_date >= CURRENT_DATE THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_account_status ON public.accounts;
CREATE TRIGGER trigger_update_account_status
  BEFORE INSERT OR UPDATE OF expiration_date
  ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_account_status();

CREATE OR REPLACE FUNCTION set_account_user_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_capacity IS NULL OR NEW.user_capacity = 0 THEN
    SELECT default_user_capacity INTO NEW.user_capacity
    FROM public.streaming_services
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_account_user_capacity ON public.accounts;
CREATE TRIGGER trigger_set_account_user_capacity
  BEFORE INSERT OR UPDATE OF service_id
  ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_account_user_capacity();

CREATE OR REPLACE FUNCTION deactivate_users_on_account_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
    UPDATE public.account_users
    SET
      status = 'inactive',
      deactivated_at = NOW(),
      scheduled_deletion_at = NOW() + INTERVAL '2 months',
      updated_at = NOW()
    WHERE account_id = NEW.id AND status = 'active';
  END IF;

  IF NEW.status = 'active' AND OLD.status = 'expired' THEN
    UPDATE public.account_users
    SET
      status = 'active',
      deactivated_at = NULL,
      scheduled_deletion_at = NULL,
      updated_at = NOW()
    WHERE account_id = NEW.id AND status = 'inactive';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deactivate_users_on_expiration ON public.accounts;
CREATE TRIGGER trigger_deactivate_users_on_expiration
  AFTER UPDATE OF status
  ON public.accounts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION deactivate_users_on_account_expiration();


-- =====================================================
-- PASO 4: SEGURIDAD (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete customers" ON customers FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view services" ON streaming_services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert services" ON streaming_services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update services" ON streaming_services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete services" ON streaming_services FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view accounts" ON accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert accounts" ON accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update accounts" ON accounts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete accounts" ON accounts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view account users" ON account_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert account users" ON account_users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update account users" ON account_users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete account users" ON account_users FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view notifications" ON notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update notifications" ON notifications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete notifications" ON notifications FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert payments" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payments" ON payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete payments" ON payments FOR DELETE USING (auth.role() = 'authenticated');


-- =====================================================
-- LISTO! La base de datos esta configurada correctamente.
-- =====================================================
