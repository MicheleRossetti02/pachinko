# Pachinko (frontend + backend)

This workspace contains a minimal Pachinko demo:

- `pachinko-backend/` — Node/Express backend that serves `/api` endpoints and persists to `data.json`.
- `pachinko-frontend/` — React + Vite frontend (development with `vite`, production build + `vite preview`).

Quick start (development)

1. Start the backend:

```bash
cd pachinko-backend
npm install
npm start
```

2. Start the frontend in dev mode (hot reload):

```bash
cd pachinko-frontend
npm install
npm run dev
```

Preview the production build locally

```bash
cd pachinko-frontend
npm install
npm run build
npm run preview
```

Start both services together (concurrently)

We add a convenience script that runs the backend and a preview server together. From the repo root:

```bash
npm install
npm run start:all
```

Staff demo secret

- Default staff secret: `staff123` (can be overridden with `STAFF_SECRET` env var for the backend).

Notes

- If preview or dev port is already in use, the frontend will try another port. To force port 5173, use `vite --port 5173` or set `vite.config.js`.
- For local HTTPS in preview, Vite will generate a self-signed certificate if `https: true` is enabled in config; your browser may warn about an untrusted certificate.
# Pachinko Demo

Semplice demo pachinko: frontend single-file (React via CDN) + backend Node/Express che salva i dati su `data.json`.

Struttura:

- pachinko-backend/
  - server.js
  - package.json
  - data.json
- pachinko-frontend/
  - index.html

Esecuzione (macOS / Linux):

1. Avvia backend:

```bash
cd pachinko-backend
npm install
npm start
```

Il server ascolta su `http://localhost:4000`.

2. Apri il frontend:

- Metodo semplice: apri `pachinko-frontend/index.html` nel browser (doppio click). Se il browser blocca chiamate cross-origin potresti dover servire la cartella:

```bash
cd pachinko-frontend
npx http-server
# poi apri http://localhost:8080
```

Area staff (demo): header `x-staff-secret` con valore di default `staff123` o quello impostato nella variabile d'ambiente `STAFF_SECRET`.

Note:
- Questo è un MVP. Per produzione: aggiungere autenticazione, DB, rate limiting, logging, ecc.
