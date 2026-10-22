# Pairwise Server

This is the REST API for Pairwise, built with Node.js, Express, TypeScript, and Mongoose. It handles authentication, client management, matchmaking logic, and AI integration.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Validation:** Zod
- **Authentication:** JWT + bcryptjs
- **AI:** Google Gemini (`@google/generative-ai`)

## Project Structure

```
src/
├── config/         # Database connection (serverless-safe cache)
├── controllers/    # Route handlers (auth, customers, matches)
├── middleware/     # Auth guard and error handling
├── models/         # Mongoose schemas (Customer, Matchmaker, MatchAction)
├── routes/         # Express route definitions
├── services/       # Matching engine, AI service, token service
└── utils/          # Logger, seed script, and demographics data
```

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/pairwise?retryWrites=true&w=majority

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CLIENT_URL=http://localhost:5173

# AI Integration
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
AI_TIMEOUT_MS=4000
AI_TOP_N=5
```

## Available Scripts

- `npm run dev` — Starts the development server via `ts-node-dev` (auto-restarts on file changes)
- `npm run build` — Compiles TypeScript to `dist/`
- `npm start` — Runs the compiled production build
- `npm run seed` — Drops existing collections and populates the database with 1 matchmaker, 10 test clients, and 120 candidate profiles
- `npm run check:engine` — Runs the matching engine unit assertions

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET` | `/api/customers` | List assigned clients (with search/filter) |
| `GET` | `/api/customers/:id` | Retrieve full client biodata and notes |
| `PATCH` | `/api/customers/:id/status` | Update client journey status |
| `POST` | `/api/customers/:id/notes` | Add a client note |
| `POST` | `/api/matches/calculate/:id` | Run the matching algorithm for a client |
| `POST` | `/api/matches/send` | Dispatch a match recommendation |
| `DELETE` | `/api/matches/:id` | Revoke a sent match |
| `GET` | `/api/matches/history` | Retrieve global match activity |

## Deployment

This server is built for Vercel Serverless Functions. The `vercel.json` routes all traffic to `src/index.ts`, and the database connection is cached globally to prevent cold-start connection leaks.

When deploying, configure all environment variables in the Vercel dashboard. Ensure `AI_TIMEOUT_MS` is set to a value under 8000 (Vercel's function limit is 10s).