# Mural Digital - Frontend TODO

## API Endpoint Coverage

### Authentication & Sessions

| API Endpoint                                                | Frontend Status                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `POST /sessions` (login with email+password, returns token) | Login page is **visual only** - no API call, no state      |
| `GET /sessions/me` (get current user)                       | **Not implemented**                                        |
| `DELETE /sessions` (logout, revoke token)                   | "Sair" button just navigates to `/login` - **no API call** |

### User Management (admin)

| API Endpoint                                  | Frontend Status  |
| --------------------------------------------- | ---------------- |
| `POST /users` (create user, admin only)       | **No UI exists** |
| `GET /users` (list all users, admin only)     | **No UI exists** |
| `GET /users/:id` (show user)                  | **No UI exists** |
| `PUT /users/:id` (update email/username)      | **No UI exists** |
| `DELETE /users/:id` (delete user, admin only) | **No UI exists** |

### Password Management

| API Endpoint                                             | Frontend Status  |
| -------------------------------------------------------- | ---------------- |
| `POST /change-password/:id` (user changes own password)  | **No UI exists** |
| `PUT /change-password/admin/:id` (admin resets password) | **No UI exists** |

### Media Player (Video/Image uploads)

| API Endpoint                                       | Frontend Status                                                |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `POST /player` (upload video/image file)           | "Video" and "Imagem" buttons are **placeholders** (no handler) |
| `GET /player` (list all media)                     | **Not implemented** - table uses hardcoded `MOCK_ROWS`         |
| `GET /player/:id` (show single media)              | **Not implemented**                                            |
| `PUT /player/:id` (update title/duration/schedule) | Edit dialog **only logs to console**                           |
| `DELETE /player/:id` (delete media + file)         | Delete dialog **only logs to console**                         |

### HTML Player (HTML notices)

| API Endpoint                                           | Frontend Status                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /html` (create HTML notice with styling options) | HtmlDialog exists but **only has nome/aviso fields** - missing bgColor, textColor, fontFamily, fontSizePx, textAlign, paddingPx, maxWidthPx |
| `POST /html/deadline` (create countdown timer)         | **No UI exists**                                                                                                                            |
| `POST /html/duplicate/:id` (duplicate an HTML notice)  | **No UI exists**                                                                                                                            |
| `PUT /html/:id` (update HTML notice)                   | **Not implemented**                                                                                                                         |
| `GET /html` (list all HTML notices)                    | **Not implemented**                                                                                                                         |
| `GET /html/:id` (show single HTML notice)              | **Not implemented**                                                                                                                         |
| `DELETE /html/:id` (delete HTML notice + file)         | **Not implemented**                                                                                                                         |

### Manifest / Settings

| API Endpoint                                                                                | Frontend Status     |
| ------------------------------------------------------------------------------------------- | ------------------- |
| `POST /defaults` (set global defaults: durations, fitMode, bgColor, mute, volume, schedule) | **No UI exists**    |
| `GET /manifest` (get manifest)                                                              | **Not implemented** |

### Admin Utilities

| API Endpoint                                                             | Frontend Status                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `GET /admin/state` (full dashboard state: players + htmlPlayers + users) | **Not used** - should be the data source for Dashboard |
| `GET /admin/local-ip` (get server LAN IPs)                               | **No UI exists**                                       |

---

## What Still Needs to Be Built

1. **API service layer** - Create an `api.ts` with axios/fetch, base URL config, and token management. Zero API calls exist today.

2. **Authentication flow** - Wire login form to `POST /sessions`, store the token, create an auth context/provider, add route guards so `/dashboard` requires auth.

3. **Logout** - Call `DELETE /sessions` and clear the token on "Sair".

4. **Dashboard data loading** - Replace `MOCK_ROWS` with a real call to `GET /admin/state` (or separate calls to `GET /player` + `GET /html`).

5. **Media upload (Video/Image)** - Build an upload dialog that calls `POST /player` with a file + optional title/duration/schedule. Wire the "Video" and "Imagem" popper buttons.

6. **HTML notice creation** - Expand `HtmlDialog` significantly: the API supports `bgColor`, `textColor`, `fontFamily`, `fontSizePx`, `textAlign`, `paddingPx`, `maxWidthPx`. The current dialog only has `nome` and `aviso`.

7. **Deadline/countdown creation** - Build a dialog for `POST /html/deadline` (title, deadlineISO, colors).

8. **Duplicate HTML** - Add a "Duplicar" button/action per HTML row calling `POST /html/duplicate/:id`.

9. **Edit media** - Wire `EditDialog` to call `PUT /player/:id` or `PUT /html/:id` depending on type.

10. **Delete media** - Wire `DeleteDialog` to call `DELETE /player/:id` or `DELETE /html/:id`.

11. **User management page (admin)** - A full CRUD page for `POST/GET/PUT/DELETE /users`, plus admin password reset.

12. **Profile/Settings page** - Wire "Perfil" to show user info (`GET /users/:id`), allow updating email/username (`PUT /users/:id`), and changing password (`POST /change-password/:id`).

13. **"Configuracoes" (Settings) page** - UI for `POST /defaults` to configure global player defaults (image duration, HTML duration, fit mode, mute, volume, schedule).

14. **Server IP display** - Use `GET /admin/local-ip` somewhere (useful for connecting digital signage screens to the server).
