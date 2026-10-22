
<div align="center">
  <img src="./client/public/pairwise-logo.png" alt="Pairwise Logo" width="120" />

  <h1>Pairwise</h1>
</div>

Pairwise is a professional matchmaking dashboard designed for high-touch concierge services. It provides a clean, human-in-the-loop workspace where matchmakers can manage client profiles, track relationship journeys, run a deterministic compatibility algorithm, and dispatch curated introductions.

The project is split into two independent services:
- `client/` — Single-page application (React + Vite + Tailwind CSS)
- `server/` — REST API (Node.js + Express + MongoDB)

## Key Features

- **Client Management** — View assigned clients, search and filter by status/city, and add timestamped private notes.
- **Deterministic Matching Engine** — A 100-point, gender-tailored scoring algorithm that evaluates age, income, location, lifestyle, education, and family preferences.
- **AI-Assisted Rationales** — Integrates Google Gemini to generate professional match rationales and personalized client introductions for top candidates, with a deterministic fallback if the AI is unavailable.
- **Match Lifecycle** — Send matches via a review modal, track sent history, and revoke matches with a logged audit trail.
- **Candidate Pool Explorer** — Browse the complete pool of available profiles ready for matching.

## Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or a local MongoDB instance)

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, and GEMINI_API_KEY in .env
npm run seed       # Populates initial client and candidate data
npm run dev        # Starts API on http://localhost:5000
```

### 2. Client Setup
```bash
cd client
npm install
cp .env.example .env
# Ensure VITE_API_URL points to http://localhost:5000/api
npm run dev        # Starts app on http://localhost:5173
```

### Demo Access
- **Email:** `matchmaker@thedatecrew.com`
- **Password:** `TDC@2026`

## Algorithm Tests
The matching engine includes a self-contained verification suite:
```bash
cd server
npm run check:engine
```

## Deployment
Both services are designed for independent deployment on Vercel.
- **Frontend:** Deploy the `client/` directory (Framework: Vite).
- **Backend:** Deploy the `server/` directory (Framework: Node.js).

Ensure the server's `CLIENT_URL` environment variable matches the deployed frontend URL for CORS.