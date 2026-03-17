# WrenchLog

Simple Dockerized garage maintenance tracker for vehicles and equipment.

Overview
- Backend: Flask + SQLite (serves API on port 5000)
- Frontend: React + Vite dev server (dev on port 5173)

Development (recommended)

By default Docker Compose will read `docker-compose.override.yml` (development override).
The override mounts your local `./frontend` into the container and preserves the container's
`/app/node_modules` with an anonymous volume so the image-installed dependencies are not hidden.

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

Production / Image-only

The base `docker-compose.yml` does not mount your local frontend directory. That means
it will use the image contents instead of your host files. You can run Compose without
the override to use the image artifacts:

```bash
docker compose -f docker-compose.yml up --build
```

Important: the repository currently uses the Vite dev server in the frontend image. For a
production-ready deployment you should build a production frontend (`npm run build`) and
serve the generated static files from a web server (nginx) or from the Flask app's `static/`
folder. This is not performed automatically in the base compose file.

Recommended production workflow (manual steps)

1. Build the frontend production assets (on your machine or in CI):

```bash
cd frontend
npm ci
npm run build
cd ..
```

2. Copy the built files into the backend `static/` directory (create it if missing):

```bash
rm -rf wrenchlog_backend_static || true
mkdir -p wrenchlog_backend_static
cp -r frontend/dist/* wrenchlog_backend_static/
```

3. Modify the backend image or Dockerfile to copy `wrenchlog_backend_static` into `/app/static`
	(or I can implement a multi-stage Dockerfile that does this automatically).

If you'd like, I can implement the multi-stage frontend build + single backend image flow so
`docker compose -f docker-compose.yml up --build` produces a ready-to-run production image.

Features:
- Create People (owners/customers)
- Create Vehicles and Equipment and link to People
- Record maintenance entries per vehicle or equipment
