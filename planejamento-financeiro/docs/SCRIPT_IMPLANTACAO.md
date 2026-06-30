# Script de implantação - DinCon

Este projeto possui um script para hospedar a aplicação completa em uma VPS Linux usando Docker Compose:

- Frontend Next.js
- Backend FastAPI
- Banco PostgreSQL
- Nginx como proxy
- Certificado TLS com Certbot

Arquivo:

```bash
deploy/deploy_dincon_prod.sh
```

## Pré-requisitos do servidor

- Linux com acesso SSH.
- Docker instalado.
- Docker Compose disponível via `docker compose`.
- DNS apontando para o IP do servidor:
  - `dincon.com.br`
  - `www.dincon.com.br`
- Portas abertas:
  - `80/tcp`
  - `443/tcp`

## Primeira implantação

Entre na pasta do projeto no servidor:

```bash
cd planejamento-financeiro
```

Permita execução do script:

```bash
chmod +x deploy/deploy_dincon_prod.sh
```

Prepare os arquivos de ambiente:

```bash
./deploy/deploy_dincon_prod.sh prepare
```

Depois edite:

```text
.env
backend/.env.production
frontend/.env.production
```

Suba primeiro em HTTP, porque o certificado ainda não existe:

```bash
./deploy/deploy_dincon_prod.sh up-http
```

Valide:

```bash
curl http://dincon.com.br/api/health
```

Emita e aplique o SSL:

```bash
./deploy/deploy_dincon_prod.sh ssl
```

Valide:

```bash
curl https://dincon.com.br/api/health
```

Inicialize o banco:

```bash
./deploy/deploy_dincon_prod.sh init-db
```

Importante: `init-db` aplica os scripts SQL principais. Em banco já existente, use `apply-sql` apenas para a migration pendente.

## Aplicar um SQL específico

```bash
./deploy/deploy_dincon_prod.sh apply-sql database/savings.sql
```

## Subir ou atualizar a aplicação

```bash
./deploy/deploy_dincon_prod.sh up
```

## Ver status

```bash
./deploy/deploy_dincon_prod.sh status
```

## Ver logs

```bash
./deploy/deploy_dincon_prod.sh logs backend
./deploy/deploy_dincon_prod.sh logs frontend
./deploy/deploy_dincon_prod.sh logs nginx
./deploy/deploy_dincon_prod.sh logs postgres
```

## Backup do banco

```bash
./deploy/deploy_dincon_prod.sh backup-db
```

O backup será salvo em:

```text
deploy/backups/
```

## Renovar certificado

```bash
./deploy/deploy_dincon_prod.sh renew-ssl
```

Sugestão de cron:

```bash
0 3 * * * cd /caminho/para/planejamento-financeiro && ./deploy/deploy_dincon_prod.sh renew-ssl
```

## Parar a aplicação

```bash
./deploy/deploy_dincon_prod.sh down
```

## Variáveis externas opcionais

Você pode sobrescrever domínio e e-mail ao executar:

```bash
DOMAIN=dincon.com.br WWW_DOMAIN=www.dincon.com.br CERTBOT_EMAIL=admin@dincon.com.br ./deploy/deploy_dincon_prod.sh ssl
```
