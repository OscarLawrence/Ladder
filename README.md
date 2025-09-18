# TIPS Bond Ladder Calculator

A web application for calculating Treasury Inflation-Protected Securities (TIPS) bond ladders to generate target after-tax real income streams.

## Features

- Calculate optimal TIPS bond investments for target income goals
- Real-time yield input and scenario modeling
- Professional financial calculations based on inflation-adjusted returns
- Clean, responsive web interface
- Export results and analysis

## Development

### Frontend Development
```bash
cd frontend
pnpm install
pnpm run dev  # Runs on http://localhost:3000
```

### Backend Development
```bash
cd backend
uv sync
uv run uvicorn main:app --reload  # Runs on http://localhost:8000
```

### Production Build
```bash
cd frontend
pnpm run build
cp -r dist/* ../backend/static/
```

## Deployment

Configured for Railway deployment:
- Single FastAPI service serves both API and frontend
- Frontend built to static files and served by FastAPI
- Health check endpoint at `/api`

## API Endpoints

- `GET /` - Serves frontend or API info
- `GET /api` - API information
- `POST /calculate-ladder` - Calculate TIPS ladder
- `GET /sample-yields` - Sample TIPS yield data