# GSB Backend

Node/Express API fuer das Globale Stimmungsbarometer.

## Features
- Anonyme Monatsabstimmung ohne Accounts
- 1 Stimme pro Geraet und Monat (Cookie-Hash, kein IP-Logging in DB)
- SQLite als kostenfreie Start-DB
- Read-Cache fuer stabile Statistik-Endpunkte bei hoher Last
- Voting-Rate-Limits und Burst-Schutz

## Setup lokal
1. `cd backend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

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

## Kostenlos deployen (Start)

### Backend
- Render Free Web Service oder Fly.io Free Tier
- Deploy direkt aus GitHub-Repo
- Env Vars aus `.env.example` setzen
- Alternativ direkt Blueprint aus `render.yaml` erzeugen (`New +` -> `Blueprint`)

### Frontend
- GitHub Pages oder Cloudflare Pages
- In `config.json` `API_BASE` auf deine Backend-URL setzen

## Skalierungsstrategie bei Lastspitzen
- Read-Endpunkte bedienen aus kurzen In-Memory-Cache-Fenstern
- Voting-Endpunkt separat limitiert (Rate-Limit + Burst-Guard)
- Frontend kann Votes lokal puffern und spaeter erneut senden
- Statistik bleibt abrufbar, auch wenn Voting kurzfristig gebremst ist
