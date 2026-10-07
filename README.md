# 🥗 FoodNest – Food Items Management App

Track your food inventory, monitor expiry dates and reduce food waste.
**MERN stack** (MongoDB, Express, React + Vite, Node).

## Features
- User registration & login (JWT, bcrypt, "Remember me")
- Route protection (frontend `ProtectedRoute` + backend auth middleware, expired tokens auto-logout)
- Add / view / update / delete food items (each user sees only their own items)
- Search, category filter, stock/expiry filter, column sorting, pagination, CSV export
- Stock status (In Stock / Low Stock ≤ 10 / Out of Stock) and expiry tracking (Fresh / Expiring Soon ≤ 7 days / Expired)
- Dashboard with totals, alerts, recently added items, expiry tracker and category chart
- Profile management (edit name, change password with current-password check)
- Information pages: About, Contact (messages are saved to the database), 404 page
- Responsive layout with mobile side menu

## Project structure
```
FoodNest/
├─ backend/    Express + MongoDB API
└─ frontend/   React (Vite) app
```

## Run locally
**Requirements:** Node.js 18+ and a MongoDB Atlas (or local MongoDB) connection string.

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # then edit .env (MONGO_URI, JWT_SECRET)
npm run dev               # or: npm start   -> http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev               # -> http://localhost:5173
```

## Deploy (free)
**Backend → Render (Web Service)**
- Root directory: `backend` · Build: `npm install` · Start: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL, e.g. `https://food-nest12.vercel.app`)
- In MongoDB Atlas → Network Access, allow `0.0.0.0/0`.

**Frontend → Vercel**
- Root directory: `frontend` · Framework: Vite
- Environment variable: `VITE_API_URL` = your Render backend URL (no trailing slash)
- `vercel.json` already handles page refresh (SPA rewrites).

## API summary
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/register | – | Create account |
| POST | /api/login | – | Login, returns JWT |
| GET | /api/profile | ✔ | Get profile |
| PUT | /api/update-profile | ✔ | Update name |
| PUT | /api/change-password | ✔ | Change password |
| GET/POST | /api/items | ✔ | List / add food |
| PUT/DELETE | /api/items/:id | ✔ | Update / delete food |
| POST | /api/contact | – | Contact form |
| GET | /api/health | – | Health check |

## Notes
- Food items created by the old version (before items belonged to users) have no owner and will not
  appear for any account. Re-add them, or in MongoDB set their `user` field to the owner's user `_id`.
- The inventory page keeps its original route `/courses` (aliases `/inventory` and `/dashboard` also work).
