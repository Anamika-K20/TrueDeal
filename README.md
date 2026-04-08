# TrueDeal

A price intelligence web app that tracks Amazon bag prices over time, analyzes historical trends, and tells you whether a deal is actually worth it.

## Live

- Frontend: https://true-deal.vercel.app
- Backend API: https://truedeal-production.up.railway.app

## Features

- Paste any Amazon bags URL to instantly scrape price and deal verdict
- Automated catalog discovery — crawls Amazon search pages to seed products
- Price history tracking with a chart showing price trends over time
- Deal analysis: Great Deal / Good Deal / Fair / Average / Overpriced
- Background scheduler re-scrapes all tracked products every 12 hours
- Background scheduler auto-discovers new products daily
- REST API with FastAPI + interactive docs at `/docs`
- React (Vite) frontend with a product grid and price history chart

## Project Structure

```
TrueDeal/
├── backend/
│   ├── api/              # FastAPI app (main.py)
│   ├── analysis/         # Deal verdict logic (analyzer.py)
│   ├── db/               # PostgreSQL setup and operations
│   ├── scraper/          # Puppeteer-based Amazon scraper
│   ├── scheduler/        # APScheduler background price refresh
│   ├── seed_products.py  # Auto-discover and seed products from Amazon search
│   ├── Dockerfile        # Docker build for Railway deployment
│   └── railway.json      # Railway deployment config
└── frontend/             # React + Vite UI
```

## Local Setup

### Prerequisites
- Python 3.11
- Node.js
- PostgreSQL (or use the Railway DB with `DATABASE_URL`)

### Backend

```bash
cd backend
pip install -r requirements.txt
npm install
npx puppeteer browsers install chrome
python -m uvicorn api.main:app --reload
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

If `uvicorn` is not recognized on Windows, run the command above from the `backend` directory so Python can import `api.main`, or use the full interpreter path shown by your configured Python environment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173`

Set `VITE_API_URL` in a `.env` file to point at your backend:
```
VITE_API_URL=http://localhost:8000
```

## Seeding Products

Auto-discover and scrape Amazon bag listings into the DB:

```bash
cd backend
python seed_products.py              # crawls "bags", 20 pages
python seed_products.py backpacks 5  # custom query and page count
```

Default seeding now uses 20 pages when page count is omitted.

Optional scheduler env vars for permanent growth:

```bash
DISCOVERY_QUERY=bags
DISCOVERY_PAGES=20
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Health check |
| POST | `/scrape` | Scrape a product URL and save to DB |
| GET | `/products` | List all tracked products |
| GET | `/products/{id}/history` | Price history for a product |
| GET | `/products/{id}/analysis` | Deal analysis for a product |
| POST | `/refresh` | Trigger immediate re-scrape of all products |

## Deployment

- Backend deployed on [Railway](https://railway.app) using Docker
- PostgreSQL database provisioned on Railway
- Frontend deployed on [Vercel](https://vercel.com) with `VITE_API_URL` pointing to Railway backend

## Tech Stack

- Python, FastAPI, PostgreSQL, psycopg2, APScheduler
- Node.js, Puppeteer
- React, Vite, Recharts
