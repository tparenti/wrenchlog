# WrenchLog

WrenchLog is a Dockerized maintenance tracker for people, vehicles, and equipment. It uses a Flask API with SQLite for persistence and a React frontend for the UI.

## Stack

- Backend: Flask, Flask-SQLAlchemy, SQLite, Gunicorn
- Frontend: React, Vite
- Containers: Docker Compose

## Current Behavior

- In production-style runs, the React app and the API are served from the same host on port `5000`.
- In development, the full app is still accessed on port `5000`; Flask proxies frontend requests to an internal Vite dev server.
- The frontend uses `/api` automatically in same-host deployments.
- During Vite development, the frontend service stays internal to Docker and is not exposed as a public port.

## Features

- Create and edit people
- Create and edit vehicles
- Create and edit equipment
- Assign vehicles and equipment to people
- Add, edit, and delete maintenance entries
- View person detail pages with related vehicles and equipment
- Responsive React UI with light and dark themes

## Run Modes

### Development

`docker compose up --build`

What this does:

- Starts the Flask backend with the project mounted into the container
- Starts the Vite frontend dev server internally for frontend asset serving
- Uses `docker-compose.override.yml` automatically

URLs:

- App and API: `http://localhost:5000`

Useful development commands:

```bash
docker compose up --build
docker compose up --build frontend
docker compose up --build wrenchlog
```

### Image-only deployment

`docker compose -f docker-compose.yml up --build`

What this does:

- Builds the React frontend into static assets
- Copies those assets into the backend image
- Serves both the UI and the API from the Flask container on port `5000`

URL:

- App and API: `http://localhost:5000`

Examples:

- App: `http://localhost:5000`
- API: `http://localhost:5000/api/people`

## API Base URL Configuration

The frontend supports an override via `VITE_API_BASE_URL`.

Use this when:

- The internal frontend dev server needs to call a backend on another host
- You are testing against a remote API

Examples:

- `http://192.168.1.50:5000/api`
- `https://example.com/api`

Example PowerShell session:

```powershell
$env:VITE_API_BASE_URL = "http://192.168.1.50:5000/api"
docker compose up --build
```

Example bash session:

```bash
export VITE_API_BASE_URL="http://192.168.1.50:5000/api"
docker compose up --build
```

## Compose Layout

### `docker-compose.yml`

Base image-only deployment:

- Runs the Flask app on port `5000`
- Serves the built React frontend from the same container
- Intended for simple deployment and launch testing

### `docker-compose.override.yml`

Development-only override:

- Mounts backend source into the Flask container
- Builds the frontend with the `dev` target
- Mounts frontend source into the internal Vite container
- Preserves container `node_modules` with an anonymous volume
- Keeps the entire application accessible on a single external port: `5000`

## Notes

- If you changed the compose services recently, Docker may leave old containers around. To clean them up, run:

```bash
docker compose -f docker-compose.yml up -d --build --remove-orphans
```

- The old server-rendered Flask templates are no longer used in the image-only React deployment path.

## Repository Structure

```text
.
|-- app.py
|-- models.py
|-- Dockerfile
|-- docker-compose.yml
|-- docker-compose.override.yml
|-- frontend/
|   |-- src/
|   |-- Dockerfile
|   `-- package.json
|-- templates/
`-- requirements.txt
```
