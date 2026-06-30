# Checklist frontend Vercel

## Antes do deploy

- [ ] `npm install` executa sem erro.
- [ ] `npm run build` executa sem erro.
- [ ] `/checkout` existe e builda.
- [ ] `NEXT_PUBLIC_API_URL` não está como `api.example.com`.
- [ ] Não há `localhost`/`ngrok` hardcoded em produção.
- [ ] Root Directory está como `planejamento-financeiro/frontend`.
- [ ] Next.js está em versão segura.
- [ ] `package-lock.json` atualizado.
- [ ] `tsconfig.json` revisado.

## Na Vercel

- [ ] Projeto conectado ao repositório `dinconapp/App-DinCon`.
- [ ] Branch `main` configurada.
- [ ] Root Directory `planejamento-financeiro/frontend`.
- [ ] `NEXT_PUBLIC_API_URL` configurada.
- [ ] Deploy mais recente está `Ready`.
- [ ] Deploy mais recente é `Production`.
- [ ] Domínio oficial foi adicionado ao projeto novo.
- [ ] Domínio oficial foi removido do projeto antigo.
- [ ] `https://dincon.com.br` abre o frontend novo.
- [ ] `https://www.dincon.com.br` abre o frontend novo.

## Teste funcional

- [ ] `/login` abre.
- [ ] `/cadastro` abre.
- [ ] `/esqueci-senha` abre.
- [ ] `/dashboard` abre após login.
- [ ] Frontend chama Render sem erro de CORS.
- [ ] Cadastro envia SMS.
- [ ] Login funciona.
- [ ] Dashboard carrega dados.
- [ ] Lançamentos carrega.
- [ ] Fluxo de Caixa carrega.
- [ ] Perfil carrega.
