# Deployment (GitHub + Render Blueprint)

## Ziel
- Frontend auf GitHub Pages
- Backend auf Render (aus `render.yaml`)
- Kostenarm starten mit Free-Tiers

## 1) Render: Service aus `render.yaml` erstellen
1. Render Login.
2. Dashboard: `New +` klicken.
3. `Blueprint` waehlen.
4. GitHub Repo `davidsamsu95-prog/GlobalMood` verbinden.
5. Branch `main` waehlen.
6. `Apply` bestaetigen.
7. Pruefen, dass Service `gsb-backend` erstellt wird.

Wichtige Werte aus `render.yaml`:
- `rootDir=backend`
- `startCommand=node src/server.js`
- `FRONTEND_ORIGIN=https://davidsamsu95-prog.github.io`
- `DB_PATH=/var/data/data.sqlite`
- `MIN_COUNTRY_N=30`

Nach erstem Deploy:
1. Render Service oeffnen.
2. `Settings` -> `Environment` pruefen.
3. Falls noetig `FRONTEND_ORIGIN` ergaenzen/korrekt setzen.
4. Service URL kopieren, z. B. `https://gsb-backend-xxxx.onrender.com`.
5. Diese URL ist dein finales `API_BASE`.

## 2) GitHub Pages aktivieren
1. GitHub Repo `Settings` -> `Pages`.
2. Unter `Build and deployment` Source auf `GitHub Actions` setzen.
3. In `Actions` warten, bis Workflow `Deploy Frontend to GitHub Pages` gruen ist.
4. Pages URL oeffnen: `https://davidsamsu95-prog.github.io/GlobalMood/`.

## 3) Frontend mit Backend verbinden
1. Datei `config.json` setzen:
```json
{
  "API_BASE": "https://gsb-backend-xxxx.onrender.com"
}
```
2. Commit + Push auf `main`.
3. GitHub Pages Workflow laeuft erneut und nimmt den Wert live.

Hinweis:
- `app.js` liest zur Laufzeit zuerst `window.__ENV__.API_BASE`, dann `config.json`, dann `config.js`.

## 4) Verifikation
1. Pages URL oeffnen.
2. DevTools `Network`:
   - `GET /api/v1/dashboard` muss `200` liefern.
   - `POST /api/v1/votes` muss `201` liefern (oder `409` bei bereits abgestimmt).
3. Keine CORS-Fehler in der Browser-Konsole.
4. Vote abschicken und pruefen:
   - KPI/Charts aktualisieren sich.
   - Bei `429/503` erscheint Warteschlangen-Hinweis und Vote wird spaeter automatisch erneut gesendet.

## 5) Kostenwarnung
- Keine bezahlte API ist integriert.
- Kosten entstehen erst, wenn Render/GitHub Free-Limits ueberschritten werden und du auf Paid wechselst.
