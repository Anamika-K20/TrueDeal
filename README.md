# TrueDeal

A price intelligence web app that tracks Amazon bag prices over time, analyzes historical trends, and tells you whether a deal is actually worth it.

## Features

- Paste any Amazon bags URL to instantly scrape price and deal verdict
- Automated catalog discovery — crawls Amazon search pages to seed products
- Price history tracking with a chart showing price trends over time
- Deal analysis: Great Deal / Good Deal / Fair / Average / Overpriced
- Background scheduler re-scrapes all tracked products every 12 hours
- REST API with FastAPI + interactive docs at `/docs`
- React (Vite) frontend with a product grid and price history chart

## Project Structure

```
TrueDeal/
├── backend/
│   ├── api/            # FastAPI app (main.py)
│   ├── analysis/       # Deal verdict logic (analyzer.py)
│   ├── db/             # SQLite setup and operations
│   ├── scraper/        # Puppeteer-based Amazon scraper
│   ├── scheduler/      # APScheduler background price refresh
│   └── seed_products.py  # Auto-discover and seed products from Amazon search
└── frontend/           # React + Vite UI
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
npm install
npx puppeteer browsers install chrome
uvicorn api.main:app --reload
```

API runs at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173`

## Seeding Products

Auto-discover and scrape Amazon bag listings:

```bash
cd backend
python seed_products.py              # crawls "bags", 3 pages
python seed_products.py backpacks 5  # custom query and page count
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scrape` | Scrape a product URL and save to DB |
| GET | `/products` | List all tracked products |
| GET | `/products/{id}/history` | Price history for a product |
| GET | `/products/{id}/analysis` | Deal analysis for a product |
| POST | `/refresh` | Trigger immediate re-scrape of all products |

## Tech Stack

- Python, FastAPI, SQLite, APScheduler
- Node.js, Puppeteer
- React, Vite, Recharts
