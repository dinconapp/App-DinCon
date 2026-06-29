# Deploy de produção - DinCon

Domínio alvo:

```text
https://dincon.com.br
```

Este guia assume deploy em um servidor Linux com Docker, Docker Compose, DNS apontando para o servidor e MariaDB em container. Se o banco for gerenciado fora do servidor, ajuste `DB_HOST`, `DB_USER` e `DB_PASSWORD`.

## 1. Pré-requisitos

- Servidor Linux com acesso SSH.
- Docker e Docker Compose instalados.
- DNS configurado:
  - `dincon.com.br` apontando para o IP do servidor.
  - `www.dincon.com.br` apontando para o IP do servidor.
- Portas abertas:
  - `80/tcp`
  - `443/tcp`
- Credenciais reais:
  - Twilio Account SID/Auth Token.
  - Twilio Verify Service SID.
  - OpenAI API key.
  - Mercado Pago access token/public key.
  - JWT secret forte.
  - Senha do MariaDB.

## 2. Arquivos de ambiente

Backend:

```bash
cp backend/.env.production.example backend/.env.production
```

Edite `backend/.env.production` e preencha os segredos.

Frontend:

```bash
cp frontend/.env.production.example frontend/.env.production
```

O valor esperado é:

```env
NEXT_PUBLIC_API_URL=https://dincon.com.br/api
```

Variáveis usadas pelo Compose:

Crie `.env` na raiz do projeto:

```bash
cp .env.compose.example .env
```

Depois edite `.env` e troque as senhas.

## 3. Primeira subida sem HTTPS

Na primeira execução, o certificado ainda não existe. Use a configuração HTTP temporária:

```bash
cp deploy/nginx/dincon-http-only.conf deploy/nginx/dincon.conf
docker compose -f docker-compose.prod.yml up -d --build
```

Valide:

```bash
curl http://dincon.com.br/api/health
```

## 4. Emitir certificado TLS

Crie as pastas:

```bash
mkdir -p deploy/certbot/www deploy/certbot/conf
```

Emita com Certbot via container:

```bash
docker run --rm \
  -v "$(pwd)/deploy/certbot/www:/var/www/certbot" \
  -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@dincon.com.br \
  --agree-tos \
  --no-eff-email \
  -d dincon.com.br \
  -d www.dincon.com.br
```

Depois aplique a configuração HTTPS:

```bash
cp deploy/nginx/dincon-ssl.conf deploy/nginx/dincon.conf
docker compose -f docker-compose.prod.yml restart nginx
```

Valide:

```bash
curl https://dincon.com.br/api/health
```

## 5. Rodar scripts SQL

Se o banco estiver vazio, rode na ordem:

```bash
docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/schema.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/seed_categories.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/whatsapp_integration.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/whatsapp_audio.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/savings.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/billing_mercado_pago.sql

docker compose -f docker-compose.prod.yml exec -T mariadb \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" planejamento_financeiro < database/email_verify_auth.sql
```

Em banco existente, rode apenas scripts ainda não aplicados.

## 6. Webhooks de produção

Twilio WhatsApp:

```text
POST https://dincon.com.br/api/integrations/whatsapp/twilio/webhook
```

Twilio status callback:

```text
POST https://dincon.com.br/api/integrations/whatsapp/twilio/status
```

Mercado Pago:

```text
POST https://dincon.com.br/api/billing/webhooks/mercadopago
```

Em produção:

```env
TWILIO_WEBHOOK_VALIDATE_SIGNATURE=true
PAYMENTS_MOCK_MODE=false
```

## 7. Comandos úteis

Subir:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ver logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

Reiniciar:

```bash
docker compose -f docker-compose.prod.yml restart
```

Parar:

```bash
docker compose -f docker-compose.prod.yml down
```

## 8. Renovação TLS

Agende no cron:

```bash
0 3 * * * cd /caminho/do/projeto && docker run --rm -v "$(pwd)/deploy/certbot/www:/var/www/certbot" -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" certbot/certbot renew --webroot --webroot-path=/var/www/certbot && docker compose -f docker-compose.prod.yml restart nginx
```

## 9. Checklist pós-deploy

- `https://dincon.com.br` abre.
- `https://dincon.com.br/api/health` retorna `200`.
- Cadastro envia SMS.
- Login funciona.
- Dashboard carrega.
- Fluxo de Caixa carrega.
- Lançamentos salva e exclui.
- Cofrinho cria investimento.
- Perfil salva dados.
- WhatsApp vincula número.
- Webhook Twilio texto cria rascunho.
- Webhook Twilio áudio não retorna 500.
- Mercado Pago cria checkout.
