# GSB Backend

Node/Express API fuer das Globale Stimmungsbarometer.

## Features
- Anonyme Monatsabstimmung ohne Accounts
- 1 Stimme pro Geraet und Monat (Cookie-Hash, kein IP-Logging in DB)
- PostgreSQL via `DATABASE_URL` (Render Postgres)
- Read-Cache fuer stabile Statistik-Endpunkte bei hoher Last
- Voting-Rate-Limits und Burst-Schutz

## Setup lokal
1. `cd backend`
2. `cp .env.example .env`
3. PostgreSQL lokal starten und `DATABASE_URL` setzen
4. `npm install`
5. `npm run dev`

API laeuft dann auf `http://localhost:8787`.

## Endpunkte
- `GET /api/v1/meta`
- `GET /api/v1/status`
- `GET /api/v1/dashboard?month=YYYY-MM&metric=global&country=WORLD&limit=10`
- `GET /api/v1/aggregate?country=WORLD&metric=global&month=YYYY-MM`
- `GET /api/v1/snapshot?month=YYYY-MM&metric=global`
- `GET /api/v1/profile?month=YYYY-MM&country=DE`
- `GET /api/v1/leaderboard?month=YYYY-MM&metric=global&limit=10`
- `POST /api/v1/votes`

## Render Deploy
- Service per `render.yaml` deployen (`New +` -> `Blueprint`)
- `DATABASE_URL` wird aus Render Postgres gebunden
- In `config.json` vom Frontend `API_BASE` auf Backend-URL setzen
