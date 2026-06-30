# Deploy do frontend na Vercel

Este guia prepara o frontend do DinCon para substituir a aplicação antiga com segurança.

## Configuração do projeto

No projeto da Vercel:

```text
Repository: dinconapp/App-DinCon
Branch: main
Framework: Next.js
Root Directory: planejamento-financeiro/frontend
Install Command: npm install
Build Command: npm run build
Output Directory: deixar padrão
```

Variável obrigatória:

```env
NEXT_PUBLIC_API_URL=https://app-dincon.onrender.com/api
```

Quando `api.dincon.com.br` estiver configurado:

```env
NEXT_PUBLIC_API_URL=https://api.dincon.com.br/api
```

Sempre que `NEXT_PUBLIC_API_URL` mudar, faça um novo deploy/redeploy. Variáveis `NEXT_PUBLIC_*` entram no build do Next.js.

## Build local

```bash
cd planejamento-financeiro/frontend
npm install
npm run build
```

A rota de checkout deve existir em:

```text
src/app/checkout/page.tsx
```

Ela é uma Client Component porque usa `window`, `localStorage`, `useSearchParams` e SDK do Mercado Pago.

## Como substituir a aplicação existente

1. Teste primeiro a URL nova da Vercel, por exemplo:

```text
https://app-din-con.vercel.app
```

2. Se a URL nova estiver correta, mova o domínio oficial.

3. No projeto antigo da Vercel:

```text
Settings > Domains
```

Remova:

```text
dincon.com.br
www.dincon.com.br
```

4. No projeto novo da Vercel:

```text
Domains > Add Existing
```

Adicione:

```text
dincon.com.br
www.dincon.com.br
```

5. Se a Vercel informar que o domínio já pertence a outro projeto, remova do projeto antigo e tente novamente.

6. Confirme que o DNS está válido na Vercel.

7. Faça Redeploy no projeto novo.

8. Teste:

```text
https://dincon.com.br
https://www.dincon.com.br
/login
/cadastro
/dashboard
```

## Por que a aplicação antiga pode continuar aparecendo

A Vercel não substitui automaticamente uma aplicação existente quando:

- o domínio ainda está vinculado a outro projeto;
- o deploy novo está com erro;
- o projeto novo tem uma URL `.vercel.app` diferente;
- `NEXT_PUBLIC_API_URL` aponta para placeholder como `https://api.example.com`;
- o Root Directory está errado;
- o deploy mais recente não está em estado `Ready` e `Production`.

Para substituir oficialmente, o domínio precisa estar no projeto correto e o deploy mais recente precisa estar `Ready/Production`.

## CORS no backend Render

Enquanto estiver usando a URL temporária da Vercel:

```env
CORS_ORIGINS=https://app-din-con.vercel.app,https://dincon.com.br,https://www.dincon.com.br
```

Depois do domínio final:

```env
CORS_ORIGINS=https://dincon.com.br,https://www.dincon.com.br
```

Se usar outra URL preview da Vercel em teste, adicione essa origem também no Render.

## URLs da API

O frontend deve chamar o backend apenas por:

```ts
process.env.NEXT_PUBLIC_API_URL
```

Não use hardcoded de `api.example.com`, `localhost`, `ngrok` ou domínios de outro produto em produção.
