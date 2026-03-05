```markdown
# Digital Signage (React + AdonisJS)

A digital signage application built with **React** (frontend) and **AdonisJS** (backend API).
It plays **images, videos, and HTML notices** from a local folder, lets you **manage media and settings via an admin panel**, and supports **multi-user authentication** with secure password hashing.

> Optimized for kiosk/TV displays: fullscreen playback, configurable schedules, and media management.

---

## ✨ Main Features

- **Media playback**
  - Images with configurable display duration (default 10s)
  - Videos play to completion
  - HTML notices (created/edited from Admin) rendered in the Player
  - Fit modes: `fit | cover | fill | zoom`
  - Schedule per item (days + time window) or global defaults
- **Admin panel**
  - Upload / update / delete media files
  - Edit **global defaults** (duration, fit mode, mute, volume, schedule)
  - Create **HTML notices** with live preview or countdown deadlines
  - Duplicate existing HTML content
  - **User management** (admins): create/remove users, reset passwords
  - Any logged-in user can change **own password**
- **Authentication**
  - Secure password hashing (bcrypt/argon2)
  - Session-based authentication with AdonisJS Auth
  - Role-based access control (admin/user)
- **Player**
  - Clean fullscreen display
  - Auto-refresh of manifest
  - Timezone-aware scheduling (default: America/Sao_Paulo)
- **RESTful API**
  - Built with AdonisJS for robust backend
  - File upload handling
  - Middleware for authentication and admin authorization

---

## 🧱 Project Structure
```

DigitalSignage/
├─ apiAdonis/ # AdonisJS backend
│ ├─ app/
│ │ ├─ controllers/
│ │ │ ├─ users_controller.ts
│ │ │ ├─ session_controller.ts
│ │ │ ├─ passwords_controller.ts
│ │ │ ├─ player_controller.ts
│ │ │ ├─ html_controller.ts
│ │ │ └─ manifest_controller.ts
│ │ ├─ middleware/
│ │ └─ models/
│ ├─ database/
│ ├─ public/
│ │ └─ media/ # Media files storage
│ │ └─ media.json # Manifest with defaults & overrides
│ ├─ start/
│ │ ├─ routes.ts # API routes
│ │ └─ kernel.ts # Middleware registration
│ ├─ config/
│ ├─ .env
│ └─ package.json
└─ frontend/ # React application (to be added)

````

---

## 📦 Requirements

- **Node.js 20+**
- **npm** or **pnpm**
- **PostgreSQL** or **MySQL** (or SQLite for development)
- AdonisJS CLI (optional): `npm i -g @adonisjs/core`

---

## 🧑‍💻 Development

### Backend Setup

```bash
cd apiAdonis
cp .env.example .env          # Configure your database and app settings
npm install
node ace migration:run        # Run database migrations
node ace serve --watch        # Start dev server with hot reload
````

The API will be available at `http://localhost:3333`

### Environment Variables

Configure your `.env` file:

```env
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=your-secret-app-key
DB_CONNECTION=sqlite          # or mysql, postgresql
SESSION_DRIVER=cookie
```

---

## 🚀 Production

### Build and Deploy

```bash
cd apiAdonis
npm ci --omit=dev
node ace build
cd build
npm ci --omit=dev
node ace migration:run --force
node server.js
```

### Using PM2 (Recommended)

Install PM2:

```bash
npm i -g pm2
```

Start the application:

```bash
cd apiAdonis/build
pm2 start server.js --name "digital-signage-api"
pm2 save
pm2 startup  # Follow the instructions to enable startup on boot
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs digital-signage-api
pm2 restart digital-signage-api
pm2 stop digital-signage-api
```

---

## 🔐 Authentication & Users

- User authentication is handled by AdonisJS Auth with secure sessions
- Passwords are hashed using modern algorithms (bcrypt/argon2)
- Two user roles: **admin** and **user**
- **Admins** can:
  - Create/delete users
  - Reset user passwords
  - Access all admin routes
- **All users** can:
  - Upload/manage media
  - Create/edit HTML content
  - Change their own password
  - View manifest

---

## 📁 Media Folder & Allowed Formats

- Media files are stored in media
- **Images**: `.jpg, .jpeg, .png, .gif, .bmp, .webp, .svg`
- **Videos**: `.mp4, .webm, .ogg`
- **HTML notices**: `.html`

---

## 🧾 Manifest Configuration (`media.json`)

Located at `public/media/media.json`, defines **global defaults** and **file-specific overrides**:

```json
{
  "defaults": {
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
  },
  "overrides": []
}
```

> **Note**: File-specific settings should be managed through the media update endpoints (`PUT /player/:id` and `PUT /html/:id`) rather than manual overrides.

---

## 🧪 API Endpoints

### Authentication

- `POST /sessions` - Login `{ email, password }`
- `GET /sessions/me` - Get current user (requires auth)
- `DELETE /sessions` - Logout (requires auth)

### User Management

- `GET /users` - List all users (admin only)
- `POST /users` - Create user (admin only) `{ email, password, fullName, isAdmin }`
- `GET /users/:id` - Get user details (requires auth)
- `PUT /users/:id` - Update user (requires auth)
- `DELETE /users/:id` - Delete user (admin only)

### Password Management

- `POST /change-password/:id` - Change own password (requires auth)
- `PUT /change-password/admin/:id` - Admin reset password (admin only)

### Media Management

- `POST /player` - Upload media (requires auth, multipart/form-data)
- `GET /player` - List all media (requires auth)
- `GET /player/:id` - Get media details (requires auth)
- `PUT /player/:id` - Update media settings (requires auth)
- `DELETE /player/:id` - Delete media (requires auth)

### HTML Content Management

- `POST /html` - Create HTML notice (requires auth)
- `POST /html/deadline` - Create countdown deadline (requires auth)
- `POST /html/duplicate/:id` - Duplicate HTML content (requires auth)
- `GET /html` - List all HTML content (requires auth)
- `GET /html/:id` - Get HTML content (requires auth)
- `PUT /html/:id` - Update HTML content (requires auth)
- `DELETE /html/:id` - Delete HTML content (requires auth)

### Manifest & Configuration

- `GET /manifest` - Get complete manifest (public)
- `POST /defaults` - Update global defaults (requires auth)

### Admin Utilities

- `GET /admin/state` - Get admin state (admin only)
- `GET /admin/local-ip` - Get server local IP (admin only)

---

## 🧹 .gitignore (Recommended)

```gitignore
# Dependencies
node_modules/

# Build output
build/
tmp/

# Environment
.env
.env.local

# Database
*.sqlite
*.sqlite3

# Logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Optional: Large media files
public/media/*.mp4
public/media/*.webm
public/media/*.mov
```

---

## 📝 Development Notes

### Database Migrations

```bash
node ace make:migration create_users_table
node ace migration:run
node ace migration:rollback
```

### Creating Controllers

```bash
node ace make:controller User
```

### Creating Models

```bash
node ace make:model User
```

---

## 🔧 Troubleshooting

### Port already in use

Change the `PORT` in your `.env` file or kill the process using port 3333:

```bash
lsof -ti:3333 | xargs kill -9
```

### Database connection issues

Ensure your database is running and credentials in `.env` are correct.

### File upload issues

Check that the `public/media` directory exists and has proper write permissions:

```bash
mkdir -p apiAdonis/public/media
chmod 755 apiAdonis/public/media
```

---

## 📚 Tech Stack

**Backend:**

- AdonisJS 6
- TypeScript
- Lucid ORM
- AdonisJS Auth

**Frontend (planned):**

- React
- React Router
- Axios for API calls

---

## 🤝 Contributing

This is a final course project (Trabalho de Conclusão de Curso). For questions or suggestions, please contact the project maintainer.

---

## 📄 License

[Specify your license here]

```

This README is tailored to your AdonisJS backend structure and reflects the actual routes and controllers in your project. Key changes from the original:

1. Updated tech stack (AdonisJS instead of Express)
2. Reflects your actual API routes from `routes.ts`
3. Removed references to override endpoints (as discussed, they're redundant)
4. Updated file structure to match your project
5. Added AdonisJS-specific commands and workflows
6. Maintained the useful sections about deployment, PM2, and production setupThis README is tailored to your AdonisJS backend structure and reflects the actual routes and controllers in your project. Key changes from the original:

1. Updated tech stack (AdonisJS instead of Express)
2. Reflects your actual API routes from `routes.ts`
3. Removed references to override endpoints (as discussed, they're redundant)
4. Updated file structure to match your project
5. Added AdonisJS-specific commands and workflows
6. Maintained the useful sections about deployment, PM2, and production setup
```
