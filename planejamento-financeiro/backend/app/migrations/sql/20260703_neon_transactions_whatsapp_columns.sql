BEGIN;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source VARCHAR(40),
  ADD COLUMN IF NOT EXISTS whatsapp_account_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS whatsapp_alias VARCHAR(120),
  ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(120);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transactions_whatsapp_account_id'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT fk_transactions_whatsapp_account_id
      FOREIGN KEY (whatsapp_account_id)
      REFERENCES public.whatsapp_accounts(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_transactions_whatsapp_account_id
  ON public.transactions (whatsapp_account_id);

COMMENT ON COLUMN public.transactions.source IS 'Origem da transacao, como manual, whatsapp ou importada.';
COMMENT ON COLUMN public.transactions.whatsapp_account_id IS 'Conta WhatsApp vinculada a transacao, quando aplicavel.';
COMMENT ON COLUMN public.transactions.whatsapp_alias IS 'Apelido do WhatsApp vinculado a transacao.';
COMMENT ON COLUMN public.transactions.provider_message_id IS 'Identificador da mensagem no provedor.';

COMMIT;
