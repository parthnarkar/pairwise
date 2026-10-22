# Pairwise Client

This is the frontend application for Pairwise, built with React, TypeScript, Vite, and Tailwind CSS. It communicates with the Pairwise API to manage clients, run matching algorithms, and dispatch matches.

## Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **State & Data:** TanStack Query (server state) + React Context (auth state)
- **Routing:** React Router v7
- **Validation:** Zod
- **Icons:** Lucide React

## Project Structure

```
src/
├── api/          # Axios clients and API wrappers
├── components/   # Reusable UI primitives and feature components
├── context/      # AuthContext provider
├── hooks/        # Custom React hooks (e.g., useAuth)
├── lib/          # Formatting and helper utilities
├── pages/        # Route-level view components
└── types/        # Shared TypeScript interfaces
```

## Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` — Starts the Vite development server (default: `http://localhost:5173`)
- `npm run build` — Builds the production bundle to `dist/`
- `npm run preview` — Serves the production build locally
- `npm run lint` — Runs Oxlint for code quality checks

## Deployment

This application is pre-configured for Vercel. The included `vercel.json` ensures client-side routing works correctly:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

When deploying, set the `VITE_API_URL` environment variable in the Vercel dashboard to point to your deployed backend API.