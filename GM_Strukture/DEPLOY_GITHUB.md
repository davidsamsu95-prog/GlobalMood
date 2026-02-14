# Deployment (GitHub + Free Tier)

## Zielbild
- Frontend: GitHub Pages (kostenfrei)
- Backend: Render Free Web Service (kostenfrei)
- DB: SQLite-Datei im Backend-Container (kostenfrei, aber fluechtig bei Redeploy)

Hinweis: Fuer dauerhaft persistente DB spaeter auf einen Free-Tier DB-Service wechseln.

## 1) GitHub Repo
1. Lokales Projekt in ein GitHub-Repo pushen.
2. Stelle sicher, dass `backend/.env` **nicht** committed wird.

## 2) Backend auf Render deployen
1. Bei Render `New +` -> `Web Service` -> GitHub Repo verbinden.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Env Vars setzen (siehe `backend/.env.example`):
   - `NODE_ENV=production`
   - `PORT=10000` (oder Render Default)
   - `FRONTEND_ORIGIN=https://<dein-user>.github.io`
   - `COOKIE_SAMESITE=none`
   - `COOKIE_SECURE=true`
   - `MIN_COUNTRY_N=5`

## 3) Frontend auf GitHub Pages deployen
1. In `config.js` setzen:
   - `API_BASE: "https://<dein-render-service>.onrender.com"`
2. GitHub Repo Settings -> Pages -> Source: `Deploy from branch`.
3. Branch: `main`, Folder: `/ (root)`.

## 4) CORS/Cookie testen
- Browser DevTools: `POST /api/v1/votes` muss mit `credentials: include` laufen.
- Bei Fehlern zuerst `FRONTEND_ORIGIN`, `COOKIE_SAMESITE`, `COOKIE_SECURE` pruefen.

## 5) Laststrategie (bereits im Code)
- Statistiken werden read-cached ausgeliefert.
- Voting wird rate-limitiert.
- Frontend puffert Votes lokal bei 429/503/Netzfehler und sendet automatisch nach.

## Kostenwarnung
- In diesem Setup entstehen normalerweise **keine direkten API-Kosten**.
- Moegliche Kosten entstehen erst, wenn Free-Tier-Limits ueberschritten werden und du auf Paid-Plans upgradest.
