# DigitalSignage API — Rotas

Base URL: `http://<host>:<port>`  
Autenticação: Bearer Token (Access Token gerado em `/sessions`)

> Legenda — **Auth**: requer token | **Admin**: requer token + papel admin

---

## Sessão

| Método   | Rota           | Auth | Descrição                                                   |
| -------- | -------------- | ---- | ----------------------------------------------------------- |
| `POST`   | `/sessions`    | Não  | Login. Retorna id, email, username e token (válido por 2 h) |
| `GET`    | `/sessions/me` | Sim  | Retorna o usuário autenticado atual                         |
| `DELETE` | `/sessions`    | Sim  | Logout — revoga o token atual                               |

### POST /sessions

**Body:**

```json
{ "email": "string", "password": "string" }
```

**Resposta 201:**

```json
{ "id": 1, "email": "...", "username": "...", "token": "..." }
```

---

## Usuários

| Método   | Rota         | Auth | Admin | Descrição                                            |
| -------- | ------------ | ---- | ----- | ---------------------------------------------------- |
| `POST`   | `/users`     | Sim  | Sim   | Cria um novo usuário                                 |
| `GET`    | `/users`     | Sim  | Sim   | Lista todos os usuários                              |
| `GET`    | `/users/:id` | Sim  | Não   | Retorna dados de um usuário                          |
| `PUT`    | `/users/:id` | Sim  | Não   | Atualiza email/username (próprio usuário via policy) |
| `DELETE` | `/users/:id` | Sim  | Sim   | Remove um usuário                                    |

### POST /users

**Body:**

```json
{ "email": "string", "password": "string", "username": "string", "isAdmin": false }
```

**Resposta 201:** `{ "user": { ... } }`

### PUT /users/:id

**Body (parcial):**

```json
{ "email": "string", "username": "string" }
```

**Resposta 200:** `{ "user": { ... } }`

---

## Senhas

| Método | Rota                         | Auth | Admin | Descrição                              |
| ------ | ---------------------------- | ---- | ----- | -------------------------------------- |
| `POST` | `/change-password/:id`       | Sim  | Não   | Usuário altera a própria senha         |
| `PUT`  | `/change-password/admin/:id` | Sim  | Sim   | Admin altera senha de qualquer usuário |

### POST /change-password/:id

**Body:**

```json
{ "oldPassword": "string", "newPassword": "string", "confirmPassword": "string" }
```

**Resposta 200:** `{ "message": "Password changed successfully" }`

### PUT /change-password/admin/:id

**Body:**

```json
{ "newPassword": "string" }
```

**Resposta 200:** `{ "message": "User password has been changed by admin" }`

---

## Admin — Estado e Rede

| Método | Rota              | Auth | Admin | Descrição                                                      |
| ------ | ----------------- | ---- | ----- | -------------------------------------------------------------- |
| `GET`  | `/admin/state`    | Sim  | Sim   | Estado global: usuários, players, html players e usuário atual |
| `GET`  | `/admin/local-ip` | Sim  | Sim   | Lista IPs IPv4 locais do servidor                              |

### GET /admin/state

**Resposta 200:**

```json
{
  "players": [...],
  "htmlPlayers": [...],
  "currentUser": { ... },
  "users": [{ "id": 1, "email": "...", "username": "...", "isAdmin": false }]
}
```

### GET /admin/local-ip

**Resposta 200:**

```json
{ "ips": ["192.168.x.x"] }
```

---

## Player (Mídia — Imagens e Vídeos)

| Método   | Rota          | Auth | Descrição                                      |
| -------- | ------------- | ---- | ---------------------------------------------- |
| `POST`   | `/player`     | Sim  | Upload de mídia (imagem ou vídeo, até 500 MB)  |
| `GET`    | `/player`     | Sim  | Lista todos os players                         |
| `GET`    | `/player/:id` | Sim  | Retorna um player específico                   |
| `PUT`    | `/player/:id` | Sim  | Atualiza metadados (título, duração, schedule) |
| `DELETE` | `/player/:id` | Sim  | Remove player e arquivo do disco               |

### POST /player

**Content-Type:** `multipart/form-data`

| Campo        | Tipo   | Obrigatório | Descrição                                                              |
| ------------ | ------ | ----------- | ---------------------------------------------------------------------- |
| `file`       | file   | Sim         | Extensões aceitas: png, jpg, jpeg, gif, webp, bmp, svg, mp4, webm, ogg |
| `title`      | string | Não         | Nome exibido (padrão: nome do arquivo)                                 |
| `durationMs` | number | Não         | Duração em ms para imagens (padrão: 10000)                             |
| `schedule`   | JSON   | Não         | Objeto de agendamento (ver estrutura abaixo)                           |

**Estrutura de schedule:**

```json
{
  "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  "start": "00:00",
  "end": "23:59",
  "tz": "America/Sao_Paulo"
}
```

**Resposta 201:**

```json
{ "ok": true, "file": "filename.ext", "player": { ... } }
```

### PUT /player/:id

**Body:**

```json
{ "title": "string", "durationMs": 10000, "schedule": { ... } }
```

**Resposta 200:** objeto do player atualizado.

---

## HTML Player (Avisos em HTML)

| Método   | Rota                  | Auth | Descrição                                 |
| -------- | --------------------- | ---- | ----------------------------------------- |
| `POST`   | `/html`               | Sim  | Cria aviso HTML customizado               |
| `POST`   | `/html/deadline`      | Sim  | Cria aviso HTML com contagem regressiva   |
| `POST`   | `/html/duplicate/:id` | Sim  | Duplica um HTML player existente          |
| `GET`    | `/html`               | Sim  | Lista todos os HTML players               |
| `GET`    | `/html/:id`           | Sim  | Retorna um HTML player específico         |
| `PUT`    | `/html/:id`           | Sim  | Atualiza conteúdo e estilo do HTML player |
| `DELETE` | `/html/:id`           | Sim  | Remove HTML player e arquivo do disco     |

### POST /html

**Body:**

```json
{
  "filename": "aviso.html",
  "title": "Título do Aviso",
  "bodyHtml": "<p>Conteúdo HTML</p>",
  "bgColor": "#000000",
  "textColor": "#ffffff",
  "fontFamily": "system-ui, sans-serif",
  "fontSizePx": 48,
  "textAlign": "center",
  "paddingPx": 24,
  "maxWidthPx": 1200
}
```

**Resposta 201:**

```json
{ "ok": true, "file": "aviso.html", "player": { ... } }
```

### POST /html/deadline

**Body:**

```json
{
  "title": "Prazo do Projeto",
  "deadlineISO": "2026-03-15T18:00:00-03:00",
  "filename": "prazo.html",
  "bgColor": "#000000",
  "textColor": "#ffffff",
  "accentColor": "#22c55e",
  "fontFamily": "system-ui, sans-serif"
}
```

`title` e `deadlineISO` são obrigatórios.  
**Resposta 201:** `{ "ok": true, "file": "prazo.html", "player": { ... } }`

### POST /html/duplicate/:id

Duplica o HTML player com o id informado, criando novo arquivo e novo registro.  
**Resposta 201:** `{ "ok": true, "file": "...-copia-<timestamp>.html", "player": { ... } }`

### PUT /html/:id

Aceita os mesmos campos de `POST /html` (todos opcionais). Regenera o arquivo HTML no disco.  
**Resposta 200:** `{ "ok": true, "player": { ... } }`

---

## Manifest (Configurações Globais do Player)

| Método | Rota        | Auth | Descrição                               |
| ------ | ----------- | ---- | --------------------------------------- |
| `POST` | `/defaults` | Sim  | Define configurações padrão do manifest |
| `GET`  | `/manifest` | Não  | Retorna o manifest atual (público)      |

### POST /defaults

**Body (todos opcionais):**

```json
{
  "imageDurationMs": 10000,
  "htmlDurationMs": 15000,
  "fitMode": "fit",
  "bgColor": "#000000",
  "mute": true,
  "volume": 1.0,
  "schedule": {
    "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    "start": "00:00",
    "end": "23:59",
    "tz": "America/Sao_Paulo"
  }
}
```

**Resposta 200:** `{ "ok": true, "defaults": { ... } }`

### GET /manifest

Retorna o arquivo `media.json` com os defaults globais e overrides por arquivo.  
**Resposta 200:**

```json
{
  "defaults": { "imageDurationMs": 10000, "htmlDurationMs": 15000, ... },
  "overrides": []
}
```

---

## Modelos de Dados

### Player

```
id            integer  PK
fileType      string   "image" | "video"
title         string
fileUrl       string   URL pública do arquivo
durationMs    integer  Duração em milissegundos
schedule      JSON     Objeto de agendamento
lastModified  integer  ID do usuário que modificou por último
createdAt     datetime
updatedAt     datetime
```

### HtmlPlayer

```
id            integer  PK
fileType      string   "html"
title         string
htmlUrl       string   URL pública do arquivo HTML
bodyHtml      string   HTML do corpo do aviso
bgColor       string
textColor     string
fontFamily    string
fontSizePx    integer
textAlign     string
paddingPx     integer
maxWidthPx    integer
lastModified  integer  ID do usuário que modificou por último
createdAt     datetime
updatedAt     datetime
```

### User

```
id        integer  PK
email     string   único
username  string   único
password  string   hash bcrypt
isAdmin   boolean
createdAt datetime
updatedAt datetime
```
