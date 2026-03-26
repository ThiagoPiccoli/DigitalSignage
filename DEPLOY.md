# 🚀 Deploy do DigitalSignage — Guia Completo

Este guia explica **passo a passo** como colocar a aplicação DigitalSignage em produção usando:

| Componente             | Serviço    | Por quê?                                                                                              |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| **Frontend** (React)   | **Vercel** | Hospedagem gratuita para sites estáticos, CDN global, deploy automático via Git                       |
| **Backend** (AdonisJS) | **Fly.io** | Suporta Docker, volumes persistentes (necessário para SQLite + arquivos de mídia), free tier generoso |

> **Preciso separar em dois repositórios?**
> **Não!** Tanto a Vercel quanto o Fly.io suportam monorepos. Você configura qual pasta cada serviço deve usar. Tudo fica no mesmo repositório GitHub.

---

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com) (login com GitHub)
- Conta no [Fly.io](https://fly.io) (login com GitHub)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado (para testar localmente)
- [flyctl CLI](https://fly.io/docs/flyctl/install/) instalado
- Node.js 22+

---

## 📁 O que foi alterado no código

Antes do deploy, as seguintes alterações foram feitas para suportar produção:

### 1. `react_frontend/src/api.ts`

```ts
// ANTES — hardcoded localhost
const BASE_URL = `http://${window.location.hostname}:3333`;

// DEPOIS — usa variável de ambiente, com fallback para dev local
const BASE_URL =
  process.env.REACT_APP_API_URL || `http://${window.location.hostname}:3333`;
```

> O React (CRA) só expõe variáveis que começam com `REACT_APP_`. Na Vercel, você vai definir `REACT_APP_API_URL` apontando para o backend no Fly.io.

### 2. `apiAdonis/config/cors.ts`

Agora lê `FRONTEND_URL` do `.env` para permitir apenas o domínio do frontend em produção. Em desenvolvimento (sem a variável), aceita qualquer origem.

### 3. `apiAdonis/config/mail.ts`

As credenciais SMTP estavam hardcoded. Agora lêem de `env.get('SMTP_HOST')`, etc. — seguro para produção.

### 4. `apiAdonis/config/database.ts`

Suporta `DB_PATH` para apontar o SQLite para o volume persistente do Fly.io.

### 5. `apiAdonis/app/services/media_service.ts`

Suporta `MEDIA_PATH` para salvar mídia no volume persistente do Fly.io.

---

## Parte 1 — Subir o código para o GitHub

### 1.1. Criar o repositório no GitHub

1. Vá em https://github.com/new
2. Nome: `DigitalSignage` (ou o que preferir)
3. **Privado** ou **Público** — você escolhe
4. **NÃO** marque "Add a README" (já temos)
5. Clique em **Create repository**

### 1.2. Fazer o push inicial

```bash
cd ~/Documents/"Trabalho Conclusão de Curso"/DigitalSignage

# Se ainda não inicializou o git:
git init
git branch -M main

# Adicionar o remote (troque SEU_USUARIO pelo seu user do GitHub)
git remote add origin https://github.com/SEU_USUARIO/DigitalSignage.git

# Verificar que .env NÃO será comitado
cat apiAdonis/.gitignore | grep .env    # deve aparecer .env

# Fazer o commit e push
git add .
git commit -m "Preparar para deploy"
git push -u origin main
```

> ⚠️ **IMPORTANTE**: Nunca comite o arquivo `.env` — ele contém segredos (APP_KEY, credenciais SMTP). Confira que está no `.gitignore`.

---

## Parte 2 — Deploy do Backend no Fly.io

### 2.1. Instalar o flyctl

```bash
# macOS
brew install flyctl

# Ou via curl (Linux/macOS)
curl -L https://fly.io/install.sh | sh
```

### 2.2. Login no Fly.io

```bash
fly auth login
```

Isso abre o navegador para autenticar.

### 2.3. Criar a aplicação no Fly.io

```bash
cd ~/Documents/"Trabalho Conclusão de Curso"/DigitalSignage/apiAdonis

# Criar o app (o fly.toml já existe, então ele vai detectar)
fly apps create digitalsignage-api --machines
```

> Se o nome `digitalsignage-api` já estiver em uso, escolha outro e atualize o `app` no `fly.toml`.

### 2.4. Criar o volume persistente

O SQLite e os arquivos de mídia precisam de armazenamento que **sobrevive a redeploys**:

```bash
fly volumes create digitalsignage_data --region gru --size 1
```

- `--region gru` = São Paulo (menor latência para o Brasil)
- `--size 1` = 1 GB (free tier inclui até 3 GB)

> O volume é montado em `/app/data` conforme definido no `fly.toml`.

### 2.5. Configurar os segredos (variáveis de ambiente)

```bash
# Gerar um APP_KEY seguro
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Definir os segredos no Fly.io
fly secrets set \
  APP_KEY="COLE_O_APP_KEY_GERADO_AQUI" \
  SMTP_HOST="sandbox.smtp.mailtrap.io" \
  SMTP_PORT="2525" \
  SMTP_USERNAME="seu_usuario_mailtrap" \
  SMTP_PASSWORD="sua_senha_mailtrap" \
  FRONTEND_URL="https://digitalsignage.vercel.app" \
  DB_PATH="/app/data/db.sqlite3" \
  MEDIA_PATH="/app/data/media"
```

> **Nota**: O `FRONTEND_URL` será a URL que a Vercel vai te dar. Se ainda não sabe, defina depois com `fly secrets set FRONTEND_URL=https://sua-url.vercel.app`.

### 2.6. Fazer o deploy

```bash
cd ~/Documents/"Trabalho Conclusão de Curso"/DigitalSignage/apiAdonis

fly deploy
```

O Fly.io vai:

1. Buildar a imagem Docker usando o `Dockerfile`
2. Fazer push para o registro deles
3. Criar a máquina e montar o volume
4. Iniciar o app

### 2.7. Rodar as migrations

Após o primeiro deploy, é preciso criar as tabelas no banco:

```bash
fly ssh console -C "node ace migration:run --force"
```

### 2.8. Criar o usuário admin (seed)

```bash
fly ssh console -C "node ace db:seed"
```

### 2.9. Verificar se está rodando

```bash
fly status
fly logs
```

Acesse no navegador: `https://digitalsignage-api.fly.dev/manifest`

Se retornar JSON, o backend está no ar! 🎉

---

## Parte 3 — Deploy do Frontend na Vercel

### 3.1. Conectar o repositório

1. Acesse https://vercel.com/new
2. Clique em **Import Git Repository**
3. Selecione o repositório `DigitalSignage`
4. **Configure o projeto:**

| Campo                | Valor                                             |
| -------------------- | ------------------------------------------------- |
| **Framework Preset** | Create React App                                  |
| **Root Directory**   | `react_frontend` (clique em **Edit** e selecione) |
| **Build Command**    | `npm run build`                                   |
| **Output Directory** | `build`                                           |

### 3.2. Definir a variável de ambiente

Na tela de configuração (antes de clicar Deploy), adicione:

| Key                 | Value                                |
| ------------------- | ------------------------------------ |
| `REACT_APP_API_URL` | `https://digitalsignage-api.fly.dev` |

> Use a URL real do seu backend no Fly.io (veja com `fly status`).

### 3.3. Clicar em Deploy

A Vercel vai:

1. Detectar que é um projeto CRA
2. Rodar `npm run build` dentro de `react_frontend/`
3. Hospedar os arquivos estáticos no CDN global

### 3.4. Configurar o roteamento SPA

Como o React usa react-router-dom, você precisa redirecionar todas as rotas para o `index.html`. Crie um arquivo:

**`react_frontend/vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> Esse arquivo já será comitado e a Vercel vai detectar automaticamente.

### 3.5. Atualizar o FRONTEND_URL no Fly.io

Depois que a Vercel te der a URL (ex: `https://digitalsignage-abc.vercel.app`):

```bash
fly secrets set FRONTEND_URL="https://digitalsignage-abc.vercel.app"
```

---

## Parte 4 — Testar tudo localmente com Docker

### 4.1. Buildar e rodar o backend

```bash
cd ~/Documents/"Trabalho Conclusão de Curso"/DigitalSignage/apiAdonis

# Buildar a imagem
docker build -t digitalsignage-api .

# Rodar o container
docker run -it --rm \
  -p 3333:3333 \
  -v digitalsignage_data:/app/data \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  -e PORT=3333 \
  -e TZ=UTC \
  -e LOG_LEVEL=info \
  -e APP_KEY=RJcydngWGHC_0r92c4HqoOLr5qgiReNL \
  -e SMTP_HOST=sandbox.smtp.mailtrap.io \
  -e SMTP_PORT=2525 \
  -e SMTP_USERNAME=3aa43ff05dd103 \
  -e SMTP_PASSWORD=cfc5bea25bed5a \
  -e DB_PATH=/app/data/db.sqlite3 \
  -e MEDIA_PATH=/app/data/media \
  digitalsignage-api
```

### 4.2. Rodar as migrations no container

```bash
# Em outro terminal
docker exec -it $(docker ps -q --filter ancestor=digitalsignage-api) \
  node ace migration:run --force
```

### 4.3. Testar

Acesse http://localhost:3333/manifest — deve retornar JSON.

---

## Parte 5 — docker-compose (para dev local completo)

Se quiser rodar tudo junto (back + front) com um único comando:

Crie na raiz do projeto:

**`docker-compose.yml`**

```yaml
services:
  api:
    build: ./apiAdonis
    ports:
      - '3333:3333'
    volumes:
      - api_data:/app/data
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: '3333'
      TZ: UTC
      LOG_LEVEL: info
      APP_KEY: ${APP_KEY:-RJcydngWGHC_0r92c4HqoOLr5qgiReNL}
      SMTP_HOST: ${SMTP_HOST:-sandbox.smtp.mailtrap.io}
      SMTP_PORT: ${SMTP_PORT:-2525}
      SMTP_USERNAME: ${SMTP_USERNAME:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      DB_PATH: /app/data/db.sqlite3
      MEDIA_PATH: /app/data/media

  frontend:
    build:
      context: ./react_frontend
      dockerfile: Dockerfile
    ports:
      - '3000:80'
    depends_on:
      - api

volumes:
  api_data:
```

> **Nota**: O Dockerfile para o frontend (abaixo) é opcional — só necessário se quiser rodar tudo com docker-compose. Para deploy, a Vercel cuida do build.

---

## Parte 6 — Deploys automáticos (CI/CD)

### Vercel — Automático

Cada `git push` na branch `main` dispara um novo deploy na Vercel automaticamente. Nada a configurar.

### Fly.io — Automático via GitHub Actions

Crie o arquivo `.github/workflows/fly-deploy.yml`:

```yaml
name: Deploy backend to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'apiAdonis/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - run: flyctl deploy --remote-only
        working-directory: apiAdonis
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Para configurar:

1. Gere um token no Fly.io:

   ```bash
   fly tokens create deploy -x 999999h
   ```

2. No GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `FLY_API_TOKEN`
   - Value: o token gerado acima

Agora, toda vez que fizer push em `main` com alterações na pasta `apiAdonis/`, o deploy roda automaticamente.

---

## 📊 Resumo da arquitetura

```
┌──────────────────────┐         ┌─────────────────────────┐
│                      │  HTTPS  │                         │
│   Vercel (Frontend)  │────────▶│   Fly.io (Backend API)  │
│   react_frontend/    │         │   apiAdonis/            │
│                      │         │                         │
│   - React SPA        │         │   - AdonisJS            │
│   - CDN global       │         │   - SQLite (volume)     │
│   - Deploy via Git   │         │   - Media files (volume)│
│                      │         │   - Docker container    │
└──────────────────────┘         └─────────────────────────┘
        ▲                                    ▲
        │                                    │
    Usuário abre                        API requests
    o site                              (fetch/XHR)
```

---

## 🔧 Comandos úteis

| Ação                   | Comando                                               |
| ---------------------- | ----------------------------------------------------- |
| Ver status do deploy   | `fly status`                                          |
| Ver logs em tempo real | `fly logs`                                            |
| Acessar o console SSH  | `fly ssh console`                                     |
| Rodar migrations       | `fly ssh console -C "node ace migration:run --force"` |
| Ver segredos definidos | `fly secrets list`                                    |
| Alterar segredo        | `fly secrets set CHAVE=valor`                         |
| Escalar (mais RAM/CPU) | `fly scale vm shared-cpu-1x --memory 512`             |
| Redeploy manual        | `fly deploy` (na pasta apiAdonis/)                    |
| Ver URL do backend     | `fly info` ou `fly status`                            |

---

## 💵 Custos

### Fly.io (Free Tier)

- **3 shared-cpu-1x** machines com 256MB RAM
- **3 GB** de volumes persistentes
- **160 GB** de transferência/mês
- Perfeito para um TCC/projeto pessoal

### Vercel (Free Tier)

- **100 GB** de banda/mês
- Builds ilimitados
- HTTPS automático
- Perfeito para SPA

---

## ⚠️ Problemas comuns

### "CORS error" no navegador

→ Verifique se `FRONTEND_URL` no Fly.io está correto:

```bash
fly secrets set FRONTEND_URL="https://sua-url-real.vercel.app"
```

### "502 Bad Gateway" no Fly.io

→ Veja os logs:

```bash
fly logs
```

Geralmente é falta de variável de ambiente ou migration não rodada.

### "Cannot find module" após deploy

→ A build pode ter falhado silenciosamente. Tente:

```bash
fly deploy --verbose
```

### SQLite "database is locked"

→ Isso acontece se você escalar para mais de 1 máquina. Com SQLite, mantenha **apenas 1 máquina**:

```bash
fly scale count 1
```

### Arquivos de mídia sumiram após redeploy

→ Verifique se `MEDIA_PATH=/app/data/media` está definido e o volume está montado. Arquivos no volume persistem entre deploys. Arquivos fora do volume são perdidos.

---

## 🔄 Workflow de desenvolvimento

1. Desenvolva localmente (`npm run dev` no backend, `npm start` no frontend)
2. Faça commit e push para `main`
3. A Vercel faz deploy automático do frontend
4. O GitHub Actions faz deploy automático do backend (se configurou a Action)
5. Ou faça deploy manual com `fly deploy`

Pronto! Sua aplicação DigitalSignage está no ar! 🎉
