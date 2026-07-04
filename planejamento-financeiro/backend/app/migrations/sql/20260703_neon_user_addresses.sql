BEGIN;

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  zip_code VARCHAR(20),
  address_number VARCHAR(30),
  residence_type VARCHAR(30),
  street_name VARCHAR(180),
  neighborhood VARCHAR(120),
  city VARCHAR(120),
  federal_unit VARCHAR(2),
  complement VARCHAR(120),
  created_at TIMESTAMP NULL DEFAULT NOW(),
  updated_at TIMESTAMP NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses (user_id);

INSERT INTO public.user_addresses (
  id,
  user_id,
  zip_code,
  address_number,
  residence_type,
  street_name,
  neighborhood,
  city,
  federal_unit,
  complement,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.id,
  u.zip_code,
  u.address_number,
  u.residence_type,
  u.street_name,
  u.neighborhood,
  u.city,
  u.federal_unit,
  u.complement,
  u.created_at,
  u.updated_at
FROM public.users u
WHERE
  u.zip_code IS NOT NULL
  OR u.address_number IS NOT NULL
  OR u.residence_type IS NOT NULL
  OR u.street_name IS NOT NULL
  OR u.neighborhood IS NOT NULL
  OR u.city IS NOT NULL
  OR u.federal_unit IS NOT NULL
  OR u.complement IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  zip_code = EXCLUDED.zip_code,
  address_number = EXCLUDED.address_number,
  residence_type = EXCLUDED.residence_type,
  street_name = EXCLUDED.street_name,
  neighborhood = EXCLUDED.neighborhood,
  city = EXCLUDED.city,
  federal_unit = EXCLUDED.federal_unit,
  complement = EXCLUDED.complement,
  updated_at = NOW();

ALTER TABLE public.users
  DROP COLUMN IF EXISTS complement,
  DROP COLUMN IF EXISTS federal_unit,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS street_name,
  DROP COLUMN IF EXISTS residence_type,
  DROP COLUMN IF EXISTS address_number,
  DROP COLUMN IF EXISTS zip_code;

COMMENT ON TABLE public.user_addresses IS 'Enderecos dos usuarios em tabela separada.';
COMMENT ON COLUMN public.user_addresses.zip_code IS 'CEP do usuario, preferencialmente no formato 00000-000.';
COMMENT ON COLUMN public.user_addresses.address_number IS 'Numero do endereco do usuario.';
COMMENT ON COLUMN public.user_addresses.residence_type IS 'Tipo de residencia: house/apartment.';
COMMENT ON COLUMN public.user_addresses.street_name IS 'Rua do usuario.';
COMMENT ON COLUMN public.user_addresses.neighborhood IS 'Bairro do usuario.';
COMMENT ON COLUMN public.user_addresses.city IS 'Cidade do usuario.';
COMMENT ON COLUMN public.user_addresses.federal_unit IS 'UF do usuario.';
COMMENT ON COLUMN public.user_addresses.complement IS 'Complemento do endereco do usuario.';

COMMIT;

-- If you want to align Alembic after running this script manually, verify the current
-- revision first and only then consider updating app.alembic_version externally.
