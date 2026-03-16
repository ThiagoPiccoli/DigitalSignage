# Fluxo de Login e Autorizacao

Este documento explica como o fluxo de autenticacao foi montado entre o backend em AdonisJS e o frontend em React, desde o login de um usuario comum ate o login de um admin.

## Visao Geral

O fluxo foi dividido em 4 responsabilidades:

1. O backend valida email e senha e gera o token.
2. O backend devolve para o frontend os dados da sessao, incluindo se o usuario e admin.
3. O frontend salva essa sessao no `localStorage`.
4. O frontend decide para qual dashboard enviar o usuario e quais rotas ele pode acessar.

## Arquivos Principais

### Backend

- `apiAdonis/app/controllers/session_controller.ts`
- `apiAdonis/start/routes.ts`
- `apiAdonis/app/middleware/admin_middleware.ts`
- `apiAdonis/app/models/user.ts`

### Frontend

- `react_frontend/src/pages/Login.tsx`
- `react_frontend/src/api.ts`
- `react_frontend/src/auth.ts`
- `react_frontend/src/App.tsx`
- `react_frontend/src/components/ProtectedRoute.tsx`
- `react_frontend/src/components/AdminRoute.tsx`
- `react_frontend/src/components/TopBar.tsx`

## Fluxo Completo

## 1. Usuario envia email e senha no frontend

Na tela de login, o formulario chama `handleLogin()` em `react_frontend/src/pages/Login.tsx`.

Esse metodo faz uma requisicao para:

```ts
POST / sessions;
```

Enviando:

```json
{
  "email": "usuario@exemplo.com",
  "password": "1234"
}
```

## 2. Backend valida as credenciais

No backend, a rota esta registrada em `apiAdonis/start/routes.ts`:

```ts
router.post('/sessions', [SessionController, 'store']);
```

O metodo `store()` em `apiAdonis/app/controllers/session_controller.ts` faz o seguinte:

1. Lê `email` e `password` do request.
2. Chama `User.verifyCredentials(email, password)`.
3. Se estiver correto, gera um access token com Adonis Auth.
4. Retorna os dados da sessao para o frontend.

Resposta atual:

```json
{
  "id": 2,
  "email": "tetezinha@hotmail.com",
  "username": "Fabiana ESTER",
  "isAdmin": false,
  "token": "oat_..."
}
```

O campo `isAdmin` e importante porque e ele que liga a permissao do backend com o comportamento do frontend.

## 3. Frontend salva a sessao

Quando o login retorna `200/201`, `react_frontend/src/pages/Login.tsx` faz:

```ts
storeSession(data);
```

Essa funcao esta em `react_frontend/src/auth.ts` e salva:

- `token` em `localStorage['token']`
- dados do usuario em `localStorage['sessionUser']`

Formato salvo:

```ts
sessionUser = {
  id,
  email,
  username,
  isAdmin,
};
```

Depois disso, o frontend decide o destino com:

```ts
getHomePath(data);
```

Regra atual:

```ts
isAdmin ? '/admin/dashboard' : '/dashboard';
```

## 4. Redirecionamento apos login

Ainda em `Login.tsx`, depois de salvar a sessao, o codigo faz:

```ts
navigate(getHomePath(data), { replace: true });
```

Isso significa:

- usuario comum vai para `/dashboard`
- admin vai para `/admin/dashboard`

Tambem existe um `useEffect` na tela de login. Se o usuario ja tiver token salvo e abrir `/login`, ele e redirecionado automaticamente para a tela correta.

## Diferenca Entre Usuario Comum e Admin

## Usuario Comum

Quando `isAdmin` vier como `false`:

- home dele e `/dashboard`
- pode entrar em paginas protegidas por token
- nao pode entrar em rotas exclusivas de admin
- se tentar acessar rota admin, o frontend devolve ele para a home correta

## Admin

Quando `isAdmin` vier como `true`:

- home dele e `/admin/dashboard`
- pode acessar dashboard admin
- pode acessar configuracoes
- pode acessar lista de usuarios
- pode acessar endpoints backend protegidos por middleware admin

## Protecao de Rotas no Frontend

## ProtectedRoute

Arquivo: `react_frontend/src/components/ProtectedRoute.tsx`

Responsabilidade:

- verificar se existe token
- se nao existir, redirecionar para `/login`

Ele protege rotas como:

- `/dashboard`
- `/perfil`

Regra:

```ts
if (!token) return <Navigate to="/login" replace />
```

## AdminRoute

Arquivo: `react_frontend/src/components/AdminRoute.tsx`

Responsabilidade:

- verificar se existe token
- verificar se `sessionUser.isAdmin` e verdadeiro

Comportamento:

- sem token: volta para `/login`
- com token mas sem admin: redireciona para `/dashboard`
- com token e admin: libera acesso

Ele protege rotas como:

- `/admin/dashboard`
- `/configuracoes`
- `/usuarios`

## Ligacao Entre Frontend e Backend

Essa ligacao acontece por 3 dados principais:

1. `token`
2. `sessionUser`
3. `isAdmin`

### Token

O backend gera o token no login.

O frontend guarda esse token e passa automaticamente em todas as requisicoes pelo helper `api()` em `react_frontend/src/api.ts`:

```ts
Authorization: Bearer<token>;
```

### sessionUser

O backend tambem devolve `id`, `email`, `username` e `isAdmin`.

O frontend guarda isso para tomar decisoes de interface e roteamento sem precisar consultar o backend a cada troca de tela.

### isAdmin

Esse campo e o elo entre permissao e navegacao.

No backend:

- decide se o middleware admin libera a rota

No frontend:

- decide qual dashboard abrir
- decide se a rota admin pode ser acessada
- decide para qual pagina o usuario volta quando tenta acessar algo que nao pode

## Middleware Admin no Backend

Arquivo: `apiAdonis/app/middleware/admin_middleware.ts`

Esse middleware roda nas rotas admin e verifica:

```ts
if (!user || !user.isAdmin) {
  return response.forbidden({
    message: 'Access denied. Admin privileges required.',
  });
}
```

Ou seja, mesmo que alguem tente forcar a navegacao no frontend, o backend continua protegendo as rotas sensiveis.

## Rotas Importantes do Backend

### Sessao

- `POST /sessions`: faz login
- `GET /sessions/me`: devolve usuario autenticado
- `DELETE /sessions`: encerra sessao

### Usuario autenticado

- `GET /users/:id`
- `PUT /users/:id`
- `POST /change-password/:id`

### Admin

- `GET /users`
- `POST /users`
- `DELETE /users/:id`
- `PUT /change-password/admin/:id`
- `GET /admin/state`
- `GET /admin/local-ip`

## O Que Acontece Quando a Sessao Expira

O helper `api()` no frontend intercepta respostas `401`.

Quando isso acontece, ele:

1. limpa `token`
2. limpa `sessionUser`
3. manda o usuario para `/login`

Trecho atual:

```ts
if (res.status === 401) {
  clearSession();
  window.location.href = '/login';
  throw new Error('Sessao expirada');
}
```

## Fluxo Resumido de Usuario Comum

1. Abre `/login`
2. Envia email e senha
3. Backend valida credenciais em `POST /sessions`
4. Backend retorna `token` + `isAdmin: false`
5. Frontend salva sessao no `localStorage`
6. Frontend navega para `/dashboard`
7. ProtectedRoute permite acesso porque existe token

## Fluxo Resumido de Admin

1. Abre `/login`
2. Envia email e senha
3. Backend valida credenciais em `POST /sessions`
4. Backend retorna `token` + `isAdmin: true`
5. Frontend salva sessao no `localStorage`
6. Frontend navega para `/admin/dashboard`
7. AdminRoute permite acesso porque existe token e `isAdmin` e verdadeiro

## Possiveis Pontos de Erro

Se o login nao funcionar como esperado, os pontos mais comuns sao:

1. O backend retorna `isAdmin` no formato errado.
2. O frontend salva token mas nao salva `sessionUser`.
3. Existe dado antigo no `localStorage`.
4. O usuario tenta abrir rota admin sendo usuario comum.
5. O token expirou e o `api()` limpou a sessao.

## Como Verificar Rapidamente no Navegador

No `localStorage`, depois do login, devem existir duas chaves:

### `token`

Exemplo:

```txt
oat_xxx...
```

### `sessionUser`

Exemplo de usuario comum:

```json
{
  "id": 2,
  "email": "tetezinha@hotmail.com",
  "username": "Fabiana ESTER",
  "isAdmin": false
}
```

Exemplo de admin:

```json
{
  "id": 1,
  "email": "admin@dominio.com",
  "username": "Administrador",
  "isAdmin": true
}
```

## Conclusao

O backend e o frontend estao conectados por uma sessao simples baseada em token e em um espelho local do usuario autenticado.

O backend continua sendo a fonte real da permissao.
O frontend usa essa permissao para controlar navegacao, dashboard inicial e acesso visual as paginas.

Em resumo:

- backend autentica
- backend informa se e admin
- frontend salva sessao
- frontend redireciona para a home correta
- frontend protege rotas
- backend protege as rotas sensiveis novamente
