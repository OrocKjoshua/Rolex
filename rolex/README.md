# Rolex backend

This backend provides:
- User registration and login (JWT)
- Admin image uploads (stored in `rolex img`)

Steps:

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.

2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

API endpoints:
- `POST /api/auth/register` { name, email, password }
- `POST /api/auth/login` { email, password }
- `POST /api/admin/upload` (multipart form-data with `image` file) — requires `Authorization: Bearer <token>` from an admin user
- `GET /api/admin/images` — list images

Uploaded images are saved to the `rolex img` folder and served at `/images/<filename>`.
