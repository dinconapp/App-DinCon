# Operação e manutenção - DinCon

## Serviços

- `nginx`: entrada pública HTTP/HTTPS e proxy para frontend/backend.
- `frontend`: Next.js em modo standalone.
- `backend`: FastAPI/Uvicorn.
- `mariadb`: banco de dados.

## URLs principais

- Aplicação: `https://dincon.com.br`
- API health: `https://dincon.com.br/api/health`
- WhatsApp webhook: `https://dincon.com.br/api/integrations/whatsapp/twilio/webhook`
- Mercado Pago webhook: `https://dincon.com.br/api/billing/webhooks/mercadopago`

## Logs

Backend:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Frontend:

```bash
docker compose -f docker-compose.prod.yml logs -f frontend
```

Nginx:

```bash
docker compose -f docker-compose.prod.yml logs -f nginx
```

Banco:

```bash
docker compose -f docker-compose.prod.yml logs -f mariadb
```

## Backup do banco

Backup:

```bash
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro > backups/dincon_$(date +%Y%m%d_%H%M%S).sql
```

Restore:

```bash
docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < backups/ARQUIVO.sql
```

## Atualização de versão

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f backend
```

Depois valide:

```bash
curl https://dincon.com.br/api/health
```

## Incidentes comuns

### Frontend abre, mas dados não carregam

Verifique:

- `NEXT_PUBLIC_API_URL=https://dincon.com.br/api` no build do frontend.
- CORS do backend.
- Logs do backend.

### SMS não chega

Verifique:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- Canal SMS ativo no Verify.
- Logs `twilio.verify.sms`.

### WhatsApp não responde

Verifique:

- Webhook configurado na Twilio.
- URL pública HTTPS.
- `TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true`.
- Assinatura Twilio válida.
- Número vinculado no Perfil.

### Áudio do WhatsApp falha

Verifique:

- `OPENAI_API_KEY`.
- `OPENAI_TRANSCRIPTION_MODEL`.
- Permissão de escrita em `backend_storage`.
- Limite `WHATSAPP_MAX_AUDIO_MB`.

### Mercado Pago não confirma pagamento

Verifique:

- `MERCADO_PAGO_ACCESS_TOKEN`.
- URL do webhook no Mercado Pago.
- Logs do backend em `/api/billing/webhooks/mercadopago`.
- `PAYMENTS_MOCK_MODE=false`.

## Segurança operacional

- Nunca versionar `.env.production`.
- Trocar `JWT_SECRET_KEY` antes do primeiro deploy.
- Usar senhas fortes para MariaDB.
- Manter `TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true`.
- Manter HTTPS válido.
- Restringir acesso SSH ao servidor.
- Fazer backup antes de rodar SQL novo.
