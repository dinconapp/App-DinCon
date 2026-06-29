# Checklist de produção - DinCon

## Antes do deploy

- [ ] DNS `dincon.com.br` aponta para o servidor.
- [ ] DNS `www.dincon.com.br` aponta para o servidor.
- [ ] Portas `80` e `443` liberadas.
- [ ] Docker instalado.
- [ ] Docker Compose instalado.
- [ ] `backend/.env.production` criado.
- [ ] `.env` da raiz criado para o Compose.
- [ ] `JWT_SECRET_KEY` forte configurado.
- [ ] Senha do MariaDB configurada.
- [ ] Twilio WhatsApp configurado.
- [ ] Twilio Verify SMS configurado.
- [ ] OpenAI API key configurada.
- [ ] Mercado Pago configurado.
- [ ] Backups definidos.

## Banco

- [ ] `schema.sql` aplicado.
- [ ] `seed_categories.sql` aplicado.
- [ ] `whatsapp_integration.sql` aplicado.
- [ ] `whatsapp_audio.sql` aplicado.
- [ ] `savings.sql` aplicado.
- [ ] `billing_mercado_pago.sql` aplicado.
- [ ] `email_verify_auth.sql` aplicado.

## Webhooks

- [ ] Twilio WhatsApp aponta para `https://dincon.com.br/api/integrations/whatsapp/twilio/webhook`.
- [ ] Twilio status aponta para `https://dincon.com.br/api/integrations/whatsapp/twilio/status`.
- [ ] Mercado Pago aponta para `https://dincon.com.br/api/billing/webhooks/mercadopago`.
- [ ] `TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true`.
- [ ] `PAYMENTS_MOCK_MODE=false`.

## Validação funcional

- [ ] `/api/health` retorna 200.
- [ ] Landing page abre.
- [ ] Cadastro envia SMS.
- [ ] Verificação SMS ativa conta.
- [ ] Login funciona.
- [ ] Dashboard carrega.
- [ ] Fluxo de Caixa carrega.
- [ ] Receita prevista salva.
- [ ] Conta fixa salva.
- [ ] Lançamento salva, edita e remove.
- [ ] Conta marca como paga e volta para pendente.
- [ ] Receita marca como recebida e volta para prevista.
- [ ] Cofrinho cria, edita e remove investimento.
- [ ] Perfil atualiza dados.
- [ ] WhatsApp vincula número.
- [ ] WhatsApp texto cria rascunho.
- [ ] WhatsApp áudio não retorna 500.
- [ ] Mercado Pago cria checkout.

## Pós-deploy

- [ ] Renovação TLS agendada.
- [ ] Rotina de backup testada.
- [ ] Logs acompanhados nas primeiras 24h.
- [ ] Credenciais não estão versionadas.
