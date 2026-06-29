# Deploy sem VPS - Render + Vercel

Este guia é o modelo atual recomendado para produção do DinCon.

## Arquitetura

- Frontend: Vercel
- Backend: Render Web Service
- Banco: MariaDB/MySQL gerenciado
- Site: `https://dincon.com.br`
- API: `https://api.dincon.com.br`
- Base URL do frontend: `https://api.dincon.com.br/api`

Os arquivos de VPS com Docker Compose, Nginx e Certbot continuam no projeto apenas como referência de outro modelo de deploy.

## 1. Banco gerenciado

Crie um banco MariaDB/MySQL em um provedor gerenciado e anote:

- host
- porta
- nome do banco
- usuário
- senha

Variáveis usadas pelo backend:

```env
DB_HOST=
DB_PORT=3306
DB_NAME=planejamento_financeiro
DB_USER=
DB_PASSWORD=
```

Se o provedor entregar uma URL completa, você pode usar:

```env
DATABASE_URL=mysql+pymysql://USUARIO:SENHA@HOST:3306/planejamento_financeiro?charset=utf8mb4
```

`DATABASE_URL` tem prioridade sobre `DB_*`.

## 2. Aplicar SQL

Use o guia:

```text
scripts/apply_remote_mysql_sql.md
```

Ordem principal:

1. `database/schema.sql`
2. `database/seed_categories.sql`
3. `database/migration_income_category_optional.sql`
4. `database/user_contact_fields.sql`
5. `database/whatsapp_integration.sql`
6. `database/whatsapp_audio.sql`
7. `database/savings.sql`
8. `database/billing_mercado_pago.sql`
9. `database/email_verify_auth.sql`

Valide:

```sql
SHOW TABLES;
```

## 3. Backend no Render

Crie um Web Service no Render apontando para este repositório.

Configuração:

```text
Root Directory: planejamento-financeiro/backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /api/health
```

Se usar `render.yaml`, ele já está na raiz do repositório com essa configuração.

Configure as variáveis do arquivo:

```text
backend/.env.render.example
```

Principais:

```env
APP_ENV=production
API_PUBLIC_URL=https://api.dincon.com.br
APP_PUBLIC_URL=https://dincon.com.br
CORS_ORIGINS=https://dincon.com.br,https://www.dincon.com.br

DB_HOST=
DB_PORT=3306
DB_NAME=planejamento_financeiro
DB_USER=
DB_PASSWORD=

JWT_SECRET_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_VERIFY_CHANNEL=sms
TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true

OPENAI_API_KEY=
WHATSAPP_AUDIO_STORAGE_DIR=/tmp/dincon/whatsapp/audio

PAYMENTS_PROVIDER=mercadopago
PAYMENTS_MOCK_MODE=false
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
```

Em Render, armazenamento local é efêmero. O áudio do WhatsApp deve usar `/tmp/dincon/whatsapp/audio` e ser removido após transcrição.

## 4. Frontend na Vercel

Importe o repositório na Vercel.

Configuração:

```text
Root Directory: planejamento-financeiro/frontend
Framework Preset: Next.js
```

Variável obrigatória:

```env
NEXT_PUBLIC_API_URL=https://api.dincon.com.br/api
```

O arquivo de exemplo está em:

```text
frontend/.env.vercel.example
```

## 5. Domínios

Na Vercel:

- `dincon.com.br`
- `www.dincon.com.br`

No Render:

- `api.dincon.com.br`

Configure os registros DNS conforme instruções do Vercel e do Render. O frontend não deve apontar para `dincon.com.br/api`; em produção ele chama `https://api.dincon.com.br/api`.

## 6. Webhooks

Twilio WhatsApp:

```text
POST https://api.dincon.com.br/api/integrations/whatsapp/twilio/webhook
```

Twilio status callback:

```text
POST https://api.dincon.com.br/api/integrations/whatsapp/twilio/status
```

Mercado Pago:

```text
POST https://api.dincon.com.br/api/billing/webhooks/mercadopago
```

## 7. Teste local antes do deploy

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Windows:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Valide:

- `http://127.0.0.1:8000/api/health`
- frontend chamando a API via `NEXT_PUBLIC_API_URL`
- login
- dashboard
- lançamento manual

## 8. Checklist pós-deploy

- `https://api.dincon.com.br/api/health` retorna 200.
- `https://dincon.com.br` abre.
- cadastro envia SMS.
- verificação SMS ativa conta.
- login funciona.
- dashboard carrega.
- Fluxo de Caixa carrega.
- lançamento manual funciona.
- WhatsApp texto cria rascunho.
- WhatsApp áudio não retorna 500.
- Mercado Pago cria checkout.
- webhook Mercado Pago responde 200.
- logs Render sem erro crítico.
- logs Vercel sem erro crítico.
