# Checklist Render + Vercel

## Antes do deploy

- [ ] Banco PostgreSQL gerenciado criado.
- [ ] SQLs aplicados no banco gerenciado.
- [ ] `\dt` validado no PostgreSQL.
- [ ] Backend criado no Render.
- [ ] Root Directory do Render: `planejamento-financeiro/backend`.
- [ ] Build Command do Render: `pip install -r requirements.txt`.
- [ ] Start Command do Render: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Health Check Path do Render: `/api/health`.
- [ ] Variáveis do Render configuradas com base em `backend/.env.render.example`.
- [ ] `CORS_ORIGINS=https://dincon.com.br,https://www.dincon.com.br`.
- [ ] `WHATSAPP_AUDIO_STORAGE_DIR=/tmp/dincon/whatsapp/audio`.
- [ ] `JWT_SECRET_KEY` forte configurado.
- [ ] Twilio Account SID/Auth Token configurados.
- [ ] Twilio Verify Service SID configurado.
- [ ] Twilio token rotacionado se já foi exposto fora do painel.
- [ ] OpenAI API key configurada.
- [ ] Mercado Pago token real configurado.
- [ ] `PAYMENTS_MOCK_MODE=false`.
- [ ] Frontend criado na Vercel.
- [ ] Root Directory da Vercel: `planejamento-financeiro/frontend`.
- [ ] Variável Vercel `NEXT_PUBLIC_API_URL=https://api.dincon.com.br/api`.
- [ ] Domínio `dincon.com.br` adicionado na Vercel.
- [ ] Domínio `www.dincon.com.br` adicionado na Vercel.
- [ ] Subdomínio `api.dincon.com.br` adicionado no Render.

## Webhooks

- [ ] Twilio WhatsApp: `https://api.dincon.com.br/api/integrations/whatsapp/twilio/webhook`.
- [ ] Twilio Status: `https://api.dincon.com.br/api/integrations/whatsapp/twilio/status`.
- [ ] Mercado Pago: `https://api.dincon.com.br/api/billing/webhooks/mercadopago`.

## Pós-deploy

- [ ] `https://api.dincon.com.br/api/health` retorna 200.
- [ ] `https://api.dincon.com.br/api/health/db` conecta no banco.
- [ ] `https://dincon.com.br` abre.
- [ ] Cadastro envia SMS.
- [ ] Verificação SMS ativa conta.
- [ ] Login funciona.
- [ ] Dashboard carrega.
- [ ] Fluxo de Caixa carrega.
- [ ] Lançamento manual funciona.
- [ ] Exclusão de lançamento funciona.
- [ ] WhatsApp texto cria rascunho.
- [ ] WhatsApp áudio não retorna 500.
- [ ] Mercado Pago cria checkout.
- [ ] Webhook Mercado Pago responde 200.
- [ ] Logs Render sem erro crítico.
- [ ] Logs Vercel sem erro crítico.
