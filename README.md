# WrenchLog

Simple Dockerized garage maintenance tracker for vehicles and equipment.

Overview
- Backend: Flask + SQLite (serves API on port 5000)
- Frontend: React app served on port 5173

Development (recommended)

By default Docker Compose will read `docker-compose.override.yml` (development override).
The override mounts your local source into the containers for development. For the frontend it
also preserves the container's `/app/node_modules` with an anonymous volume so the image-installed
dependencies are not hidden.

Start everything for development (hot reload / HMR):

```bash
docker compose up --build
```

Start only the frontend dev server (useful while iterating UI):

```bash
docker compose up --build frontend
```

Start only the backend API:

```bash
docker compose up --build wrenchlog
```

Notes:
- Frontend dev server: http://localhost:5173
- Backend/API: http://localhost:5000
- The dev override mounts your source tree so edits show immediately.
- API base URL is configurable with `VITE_API_BASE_URL`. If unset, the frontend defaults to the current hostname and port `5000` during Vite development, and to `/api` when served behind the same host in production.

Production / Image-only

The base `docker-compose.yml` does not mount your local frontend directory. It builds the
frontend into static assets and serves them from the container, so it no longer depends on
the Vite dev server at runtime. You can run Compose without the override to use the image
artifacts:

```bash
docker compose -f docker-compose.yml up --build
```

The development override still uses the Vite dev server with bind mounts and HMR.

This split is intentional:

1. `docker compose up --build` uses the override for frontend development.
2. `docker compose -f docker-compose.yml up --build` runs image-only backend and frontend services.

If your backend is hosted on a different URL, set `VITE_API_BASE_URL` before starting Compose. Example values:

- `http://192.168.1.50:5000/api`
- `https://example.com/api`

Features:
- Create People (owners/customers)
- Create Vehicles and Equipment and link to People
- Record maintenance entries per vehicle or equipment
