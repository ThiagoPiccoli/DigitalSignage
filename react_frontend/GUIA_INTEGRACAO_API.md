# Guia de Integração Frontend ↔ Backend

> Guia para entender como o React se comunica com a API AdonisJS no projeto Mural Digital.

---

## 1. O Conceito Básico

O frontend (React) e o backend (AdonisJS) são **dois programas separados** rodando em portas diferentes:

```
React  →  http://localhost:3000   (o que o usuário vê)
Adonis →  http://localhost:3333   (a API que guarda os dados)
```

Quando o usuário clica em "Entrar" ou "Salvar", o React **envia uma requisição HTTP** para o Adonis, que processa e **devolve uma resposta** (JSON).

```
[React]  --→  POST /sessions  {"email":"...", "password":"..."}  --→  [Adonis]
[React]  ←--  201 Created     {"id":1, "token":"oat_abc123..."}  ←--  [Adonis]
```

---

## 2. Como Fazer uma Chamada à API (fetch)

O JavaScript tem uma função nativa chamada `fetch`. É ela que usamos para chamar a API.

### Exemplo mais simples possível:

```typescript
const resposta = await fetch('http://localhost:3333/sessions', {
  method: 'POST', // Método HTTP (GET, POST, PUT, DELETE)
  headers: { 'Content-Type': 'application/json' }, // Diz que estamos enviando JSON
  body: JSON.stringify({
    // O corpo da requisição (os dados)
    email: 'thiago@email.com',
    password: '123456',
  }),
});

const dados = await resposta.json(); // Converte a resposta do servidor para objeto JS
console.log(dados); // { id: 1, email: "...", token: "oat_abc123..." }
```

### Decompondo cada parte:

| Parte                   | O que faz                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `fetch(url, opções)`    | Envia a requisição HTTP                                                      |
| `method: 'POST'`        | Tipo da ação (POST = criar, GET = buscar, PUT = atualizar, DELETE = remover) |
| `headers`               | Metadados — aqui dizemos que enviamos JSON                                   |
| `body`                  | Os dados que queremos enviar (convertidos para texto JSON)                   |
| `await resposta.json()` | Lê a resposta do servidor e converte de volta para objeto JS                 |

---

## 3. Autenticação — Como o Backend Sabe Quem Está Logado

### O Fluxo de Login:

```
1. Usuário digita email + senha no React
2. React envia POST /sessions com email e senha
3. Adonis verifica se estão corretos
4. Se sim, Adonis cria um TOKEN e devolve
5. React SALVA esse token (no localStorage)
6. Em TODAS as próximas requisições, React envia esse token no header
```

### Passo a passo no código:

**Passo 1 — Login (pegar o token):**

```typescript
const resposta = await fetch('http://localhost:3333/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const dados = await resposta.json();

// SALVAR o token para usar depois
localStorage.setItem('token', dados.token);
```

**Passo 2 — Usar o token nas próximas chamadas:**

```typescript
const token = localStorage.getItem('token');

const resposta = await fetch('http://localhost:3333/html', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`, // ← AQUI está a mágica
  },
});
```

### O que é o `Authorization: Bearer`?

É um header (cabeçalho) HTTP padrão que diz ao servidor:

> "Ei, eu sou o usuário dono deste token. Me deixa passar!"

O middleware `auth_middleware.ts` do seu Adonis lê esse header, verifica se o token é válido, e se for, deixa a requisição continuar. Se não for, retorna erro 401 (não autorizado).

```
[React] --→ GET /html  (com header Authorization: Bearer oat_abc123)  --→ [Adonis]
                                                                            ↓
                                                              auth_middleware verifica token
                                                                            ↓
                                                              Token válido? → Sim → Continua
                                                              Token inválido? → Retorna 401
```

### E o Admin?

Quando uma rota tem `.use([middleware.auth(), middleware.admin()])`, o Adonis faz **duas verificações**:

1. `auth()` → O token é válido? (está logado?)
2. `admin()` → O `user.isAdmin` é `true`? (é administrador?)

Se qualquer uma falhar, a requisição é rejeitada.

---

## 4. Onde Guardar o Token

Usamos o **localStorage** do navegador:

```typescript
// Salvar
localStorage.setItem('token', 'oat_abc123...');

// Ler
const token = localStorage.getItem('token');

// Remover (logout)
localStorage.removeItem('token');
```

O `localStorage` persiste mesmo se o usuário fechar o navegador. Isso faz com que ele continue "logado" ao voltar.

---

## 5. Criando um Módulo `api.ts` — Evitar Repetição

Em vez de escrever `fetch(...)` com headers em todo lugar, criamos um arquivo helper:

```typescript
// src/api.ts

const BASE_URL = 'http://localhost:3333';

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const resposta = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Se o token expirou, redireciona para login
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  return resposta;
}
```

Agora qualquer chamada fica simples:

```typescript
import { api } from '../api';

// GET — buscar todos os avisos HTML
const res = await api('/html');
const avisos = await res.json();

// POST — criar um aviso
const res = await api('/html', {
  method: 'POST',
  body: JSON.stringify({
    filename: 'aviso.html',
    title: 'Meu Aviso',
    bodyHtml: '<p>Olá</p>',
  }),
});

// PUT — atualizar
const res = await api('/html/5', {
  method: 'PUT',
  body: JSON.stringify({ title: 'Novo Título' }),
});

// DELETE — excluir
const res = await api('/html/5', { method: 'DELETE' });
```

---

## 6. Fluxo Completo de Cada Tela

### Login (`POST /sessions`)

```
1. Usuário digita email + senha
2. React chama POST /sessions
3. Se OK → Salva token no localStorage → Redireciona para /dashboard
4. Se erro → Mostra mensagem "Email ou senha inválidos"
```

### Dashboard (múltiplas rotas)

```
1. Ao abrir a tela → React chama GET /player + GET /html
2. Monta a tabela com os dados reais (em vez de MOCK_ROWS)
3. Criar aviso → POST /html
4. Criar contador → POST /html/deadline
5. Upload vídeo/imagem → POST /player (com FormData, não JSON)
6. Editar → PUT /html/:id ou PUT /player/:id
7. Excluir → DELETE /html/:id ou DELETE /player/:id
```

### Perfil (`GET /sessions/me`, `PUT /users/:id`, `POST /change-password/:id`)

```
1. Ao abrir → GET /sessions/me (pega dados do usuário logado)
2. Editar dados → PUT /users/:id
3. Trocar senha → POST /change-password/:id
```

### Usuários - Admin (`GET/POST/DELETE /users`, `PUT /change-password/admin/:id`)

```
1. Ao abrir → GET /users (lista todos)
2. Criar → POST /users
3. Excluir → DELETE /users/:id
4. Resetar senha → PUT /change-password/admin/:id
```

### Configurações - Admin (`GET /manifest`, `POST /defaults`, `GET /admin/local-ip`)

```
1. Ao abrir → GET /manifest + GET /admin/local-ip
2. Salvar → POST /defaults
```

---

## 7. Upload de Arquivos — Caso Especial

Para enviar arquivos (vídeo, imagem), usamos **FormData** em vez de JSON:

```typescript
const formData = new FormData();
formData.append('file', arquivoSelecionado); // O arquivo real
formData.append('title', 'Meu Vídeo');
formData.append('durationMs', '10000');

const token = localStorage.getItem('token');

const res = await fetch('http://localhost:3333/player', {
  method: 'POST',
  headers: {
    // NÃO colocar Content-Type aqui! O browser define automaticamente para FormData
    Authorization: `Bearer ${token}`,
  },
  body: formData, // Envia o FormData diretamente, sem JSON.stringify
});
```

> **Importante:** Quando usa FormData, NÃO coloque `Content-Type: application/json`. O navegador coloca o tipo correto (`multipart/form-data`) automaticamente.

---

## 8. Tratamento de Erros

Sempre verifique se a resposta foi OK:

```typescript
const res = await api('/html', {
  method: 'POST',
  body: JSON.stringify({ title: 'Aviso', bodyHtml: '<p>Texto</p>' }),
});

if (res.ok) {
  // Sucesso! (status 200-299)
  const dados = await res.json();
  console.log('Criado:', dados);
} else {
  // Erro do servidor
  const erro = await res.json();
  console.error('Erro:', erro);
  // Mostrar mensagem para o usuário
}
```

Códigos HTTP comuns:

| Código | Significado      | Quando acontece                            |
| ------ | ---------------- | ------------------------------------------ |
| 200    | OK               | Operação deu certo                         |
| 201    | Created          | Recurso criado com sucesso                 |
| 400    | Bad Request      | Dados inválidos (ex: campo faltando)       |
| 401    | Unauthorized     | Token inválido ou ausente                  |
| 403    | Forbidden        | Não é admin (tentou acessar rota de admin) |
| 404    | Not Found        | Recurso não existe (id errado)             |
| 422    | Validation Error | Dados não passaram na validação            |

---

## 9. Protegendo Rotas no React

Além da API verificar o token, o React também deve impedir que o usuário acesse telas sem estar logado:

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

Uso no App.tsx:

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

Isso faz com que se alguém digitar `/dashboard` na URL sem estar logado, seja redirecionado para `/login`.

---

## 10. Resumo Visual do Fluxo

```
┌─────────────┐                           ┌──────────────┐
│   REACT     │                           │   ADONIS     │
│  (Frontend) │                           │  (Backend)   │
├─────────────┤                           ├──────────────┤
│             │  POST /sessions           │              │
│  Login.tsx  │ ─────────────────────────→│ SessionCtrl  │
│             │ ←─────────────────────────│ → token      │
│             │  { token: "oat_..." }     │              │
│             │                           │              │
│  Salva no   │                           │              │
│  localStorage                           │              │
│             │                           │              │
│             │  GET /html                │              │
│ Dashboard   │  Authorization: Bearer... │              │
│   .tsx      │ ─────────────────────────→│ auth_middleware
│             │                           │  ↓ token OK  │
│             │                           │ HtmlCtrl     │
│             │ ←─────────────────────────│ → [{...}]    │
│             │  [{ id:1, title:... }]    │              │
│             │                           │              │
│             │  DELETE /users/3          │              │
│ Usuarios    │  Authorization: Bearer... │              │
│   .tsx      │ ─────────────────────────→│ auth_middleware
│             │                           │  ↓ token OK  │
│             │                           │ admin_middleware
│             │                           │  ↓ isAdmin?  │
│             │                           │ UsersCtrl    │
│             │ ←─────────────────────────│ → 204 OK     │
└─────────────┘                           └──────────────┘
```

---

## 11. Ordem Sugerida de Implementação

1. **Criar `src/api.ts`** — o helper de chamadas
2. **Login** — é a base de tudo (sem token, nada funciona)
3. **Dashboard** — a tela principal
4. **Perfil** — dados do usuário logado
5. **Configurações** — settings do manifest
6. **Usuários** — gestão de usuários (admin)
7. **ProtectedRoute** — proteger rotas
8. **TopBar** — logout (DELETE /sessions) + nome dinâmico

---

Quando estiver pronto para começar a implementação, podemos ir tela por tela!
