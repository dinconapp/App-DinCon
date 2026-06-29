# planejamento-financeiro

Aplicacao web de planejamento financeiro pessoal com backend FastAPI, frontend Next.js e persistencia em MariaDB.

## Arquitetura

- `backend/app/domain`: entidades, contratos e servicos de dominio.
- `backend/app/application`: schemas e casos de uso.
- `backend/app/infrastructure`: modelos SQLAlchemy e repositorios.
- `backend/app/interfaces/api`: controllers REST FastAPI.
- `frontend/src/services`: cliente HTTP centralizado.
- `frontend/src/hooks`: estado e carregamento por dominio.
- `frontend/src/components`: componentes visuais reutilizaveis.

## Banco MariaDB

Crie o banco:

```sql
CREATE DATABASE planejamento_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Rode os scripts:

```bash
mysql -u root -p planejamento_financeiro < database/schema.sql
mysql -u root -p planejamento_financeiro < database/seed_categories.sql
mysql -u root -p planejamento_financeiro < database/savings.sql
mysql -u root -p planejamento_financeiro < database/billing_mercado_pago.sql
```

Opcional para ambiente de desenvolvimento:

```bash
mysql -u root -p planejamento_financeiro < database/seed_dev.sql
```

O seed de desenvolvimento cria apenas um usuario inicial. Nao cria transacoes falsas.

## Backend

Crie `backend/.env` com:

```env
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=planejamento_financeiro
DB_USER=root
DB_PASSWORD=root
```

Instale:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Rode:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```text
GET http://127.0.0.1:8000/api/health
```

## Frontend

Crie `frontend/.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Instale:

```bash
cd frontend
npm install
```

Rode:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Preparacao para producao em dincon.com.br

Dominio previsto:

```text
https://dincon.com.br
```

Frontend em producao:

```env
NEXT_PUBLIC_API_URL=https://dincon.com.br/api
```

Backend em producao:

```env
APP_ENV=production
APP_PUBLIC_URL=https://dincon.com.br
API_PUBLIC_URL=https://dincon.com.br
TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true
JWT_SECRET_KEY=trocar-por-um-segredo-forte
```

Webhooks publicos esperados:

```text
POST https://dincon.com.br/api/integrations/whatsapp/twilio/webhook
POST https://dincon.com.br/api/integrations/whatsapp/twilio/status
POST https://dincon.com.br/api/billing/webhooks/mercadopago
```

O backend ja aceita CORS para:

```text
https://dincon.com.br
https://www.dincon.com.br
```

Antes de subir, conferir DNS, HTTPS valido, variaveis reais de Twilio/OpenAI/Mercado Pago e banco MariaDB de producao.

Documentacao operacional:

- `docs/DEPLOY_PRODUCAO.md`: passo a passo de deploy com Docker/Nginx/TLS.
- `docs/OPERACAO.md`: logs, backup, restore, incidentes comuns e manutencao.
- `docs/ARQUITETURA.md`: visao geral tecnica do projeto.
- `docs/CHECKLIST_PRODUCAO.md`: checklist antes e depois de publicar.

## Integracao WhatsApp via Twilio

1. Crie uma conta Twilio e ative o WhatsApp Sandbox.
2. Configure o webhook do Sandbox:

```text
POST https://SEU_DOMINIO/api/integrations/whatsapp/twilio/webhook
```

3. Para desenvolvimento local, exponha o backend com ngrok ou cloudflared:

```bash
ngrok http 8000
```

4. Configure `backend/.env`:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_VALIDATE_SIGNATURE=false
APP_PUBLIC_URL=https://seu-ngrok.ngrok-free.app
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_TRANSCRIPTION_MODEL=whisper-1
WHATSAPP_AUDIO_STORAGE_DIR=storage/whatsapp/audio
WHATSAPP_KEEP_AUDIO_FILES=false
WHATSAPP_MAX_AUDIO_MB=15
```

Em producao, use `TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true`.

5. Rode o script SQL:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/whatsapp_integration.sql
```

6. Suba o backend:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

7. No sistema, acesse Perfil e vincule o numero WhatsApp.
8. Envie uma mensagem para o WhatsApp da aplicacao, por exemplo:

```text
gastei 35 reais no mercado hoje
```

9. Confirme com `1`, `sim` ou `confirmar`. Cancele com `3`, `cancelar` ou `nao`.

Categorias retornadas pela IA sao resolvidas automaticamente no backend. Se a IA retornar uma categoria que ainda nao existe, o sistema cria a categoria com o mesmo tipo do lancamento (`income` ou `expense`) e usa essa categoria no rascunho.

## Registro financeiro por audio no WhatsApp

O usuario tambem pode enviar audio para o numero WhatsApp da Twilio. O fluxo usa o mesmo webhook de texto:

1. Twilio envia `NumMedia`, `MediaUrl0` e `MediaContentType0` para `/api/integrations/whatsapp/twilio/webhook`.
2. O backend identifica midias de audio como `audio/ogg`, `audio/mpeg`, `audio/mp4`, `audio/aac`, `audio/amr`, `audio/webm`, `audio/wav` ou `application/ogg`.
3. O backend baixa a midia com Basic Auth usando `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN`.
4. O arquivo temporario e salvo em `WHATSAPP_AUDIO_STORAGE_DIR`.
5. A OpenAI transcreve o audio usando `OPENAI_TRANSCRIPTION_MODEL`.
6. A transcricao e salva em `whatsapp_messages.transcription`.
7. A transcricao segue para o mesmo interpretador financeiro usado por texto.
8. O usuario confirma com `1`, `sim` ou `confirmar`.

Variaveis:

```env
OPENAI_API_KEY=...
OPENAI_TRANSCRIPTION_MODEL=whisper-1
WHATSAPP_AUDIO_STORAGE_DIR=storage/whatsapp/audio
WHATSAPP_KEEP_AUDIO_FILES=false
WHATSAPP_MAX_AUDIO_MB=15
```

Para bases antigas, rode:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/whatsapp_audio.sql
```

Teste com `MediaUrl0` fake. O esperado e retornar TwiML amigavel, sem HTTP 500:

```cmd
curl -X POST "http://127.0.0.1:8000/api/integrations/whatsapp/twilio/webhook" ^
-H "Content-Type: application/x-www-form-urlencoded" ^
-d "MessageSid=SMTESTAUDIO123" ^
-d "From=whatsapp:+5511932256211" ^
-d "To=whatsapp:+14155238886" ^
-d "Body=" ^
-d "NumMedia=1" ^
-d "MediaUrl0=https://example.com/audio.ogg" ^
-d "MediaContentType0=audio/ogg"
```

Consultas uteis:

```sql
SELECT id, message_type, body, media_url, media_content_type, transcription, created_at
FROM whatsapp_messages
ORDER BY created_at DESC
LIMIT 10;

SELECT id, status, kind, title, amount, original_text, created_at
FROM whatsapp_transaction_drafts
ORDER BY created_at DESC
LIMIT 10;
```

## Cofrinho

A tela Cofrinho permite cadastrar investimentos e visualizar dashboard/projecao propria em `/cofrinho`.

Para ambientes existentes, rode:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/savings.sql
```

Tipos de rendimento:

- `Sem rendimento`: saldo cresce apenas com aportes.
- `Juros simples`: calcula juros mensais sobre o valor inicial.
- `Juros compostos`: aplica rendimento mensal sobre o saldo anterior e depois soma o aporte mensal.

Taxas:

- Taxa mensal: `1.00` representa 1% ao mes.
- Taxa anual: `12.00` representa 12% ao ano e e convertida para taxa mensal equivalente no backend.

## Gateway de Pagamento Mercado Pago

O backend possui integracao de billing baseada no fluxo do Financeia, adaptada para o DinCon:

- Planos padrao: `free`, `pro`, `premium`.
- Checkout Pix via Mercado Pago.
- Checkout cartao via token do Mercado Pago.
- Historico de pagamentos por usuario.
- Assinatura ativada automaticamente quando pagamento de cartao e aprovado ou quando webhook confirma pagamento.
- Webhook Mercado Pago em `/api/billing/webhooks/mercadopago`.
- Modo mock para desenvolvimento local sem chamar a API real.

Rode a migration:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/billing_mercado_pago.sql
```

Configure `backend/.env`:

```env
API_PUBLIC_URL=https://seu-backend-publico
PAYMENTS_PROVIDER=mercadopago
PAYMENTS_MOCK_MODE=false
PAYMENTS_DEFAULT_STATEMENT_DESCRIPTOR=DINCON
MERCADO_PAGO_API_BASE_URL=https://api.mercadopago.com
MERCADO_PAGO_ACCESS_TOKEN=...
MERCADO_PAGO_PUBLIC_KEY=...
MERCADO_PAGO_WEBHOOK_SECRET=
```

Para desenvolvimento local, use:

```env
PAYMENTS_MOCK_MODE=true
```

No Mercado Pago, configure o webhook para:

```text
POST https://SEU_BACKEND/api/billing/webhooks/mercadopago
```

## Autenticacao com Twilio Verify por SMS

O cadastro e a recuperacao de senha usam Twilio Verify por SMS antes de liberar acesso ao sistema.

1. Crie um servico no Twilio Console: Verify > Services > Create Service.
2. Configure o canal SMS no Verify.
3. Copie o Verify Service SID.
4. Configure `backend/.env`:

```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
TWILIO_VERIFY_SMS_CHANNEL=sms
JWT_SECRET_KEY=trocar-em-producao
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

5. Rode a migration:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p planejamento_financeiro < database/email_verify_auth.sql
```

6. Suba backend e frontend, crie uma conta, informe o codigo recebido por SMS e faca login.

Testes rapidos via curl:

```cmd
curl -X POST "http://127.0.0.1:8000/api/auth/register" ^
-H "Content-Type: application/json" ^
-d "{\"name\":\"Henrique\",\"email\":\"henrique@email.com\",\"phone\":\"+5511999999999\",\"password\":\"senha123\"}"

curl -X POST "http://127.0.0.1:8000/api/auth/verify-email" ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"henrique@email.com\",\"code\":\"123456\"}"

curl -X POST "http://127.0.0.1:8000/api/auth/resend-email-code" ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"henrique@email.com\"}"

curl -X POST "http://127.0.0.1:8000/api/auth/login" ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"henrique@email.com\",\"password\":\"senha123\"}"

curl -X POST "http://127.0.0.1:8000/api/auth/password-reset/start" ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"henrique@email.com\"}"

curl -X POST "http://127.0.0.1:8000/api/auth/password-reset/confirm" ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"henrique@email.com\",\"code\":\"123456\",\"password\":\"novaSenha123\"}"

curl "http://127.0.0.1:8000/api/auth/me" ^
-H "Authorization: Bearer SEU_TOKEN"
```

Validacoes no banco:

```sql
SELECT id, name, email, active, email_verified, verification_status, verified_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

SELECT id, user_id, email, channel, status, error_code, created_at
FROM email_verification_attempts
ORDER BY created_at DESC
LIMIT 10;
```

## Endpoints principais

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-email-code`
- `POST /api/auth/login`
- `POST /api/auth/password-reset/start`
- `POST /api/auth/password-reset/confirm`
- `GET /api/auth/me`
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `GET /api/categories?type=income|expense`
- `GET /api/budgets?user_id={id}`
- `POST /api/budgets`
- `PUT /api/budgets/{id}`
- `DELETE /api/budgets/{id}`
- `GET /api/transactions?user_id={id}&month_key=YYYY-MM`
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- `GET /api/bills?user_id={id}&month_key=YYYY-MM`
- `POST /api/bills/{budget_id}/pay`
- `POST /api/bills/{budget_id}/unpay`
- `GET /api/dashboard?user_id={id}&month_key=YYYY-MM`
- `GET /api/projections/balance?user_id={id}&months=12`
- `GET /api/billing/plans`
- `GET /api/billing/config`
- `GET /api/billing/me?user_id={id}`
- `POST /api/billing/checkout/pix`
- `POST /api/billing/checkout/card`
- `GET /api/billing/payments/{payment_id}?user_id={id}`
- `POST /api/billing/webhooks/mercadopago`
- `GET /api/savings/investments?user_id={id}`
- `POST /api/savings/investments`
- `PUT /api/savings/investments/{id}`
- `DELETE /api/savings/investments/{id}`
- `GET /api/savings/dashboard?user_id={id}&months=12`
- `GET /api/savings/projection?user_id={id}&months=12`
- `GET /api/savings/investments/{id}/projection?months=12`
- `POST /api/integrations/whatsapp/twilio/webhook`
- `POST /api/integrations/whatsapp/twilio/status`
- `GET /api/integrations/whatsapp/accounts?user_id={id}`
- `POST /api/integrations/whatsapp/accounts`
- `DELETE /api/integrations/whatsapp/accounts/{id}`
- `GET /api/integrations/whatsapp/drafts?user_id={id}&status=pending_confirmation`

## Observacoes

O frontend nao possui arrays de dados financeiros como fonte principal. Categorias, planejamento, transacoes, contas, dashboard, perfil e projecao sao carregados da API e persistidos no MariaDB.
