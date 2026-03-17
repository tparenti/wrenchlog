FROM node:20-bullseye AS frontend-build
WORKDIR /frontend
ENV VITE_API_BASE_URL=/api
COPY frontend/package.json ./
RUN npm install --include=optional
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
COPY --from=frontend-build /frontend/dist /app/frontend_dist
ENV FLASK_ENV=production
ENV FLASK_RUN_HOST=0.0.0.0
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
