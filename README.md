# Pairwise

Two-folder structure: `client/` (Vite+React+TS) · `server/` (Express+TS+MongoDB).

## Local Dev
- Client: `cd client && npm run dev` → http://localhost:5173
- Server: `cd server && npm run dev` → http://localhost:5000
- Seed:   `cd server && npm run seed`

## Deploy
- Frontend: Vercel project (root = `client/`)
- Backend:  Vercel project (root = `server/`)