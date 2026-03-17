FROM node:20-bullseye AS dev
WORKDIR /app
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY package.json ./
RUN npm install --include=optional
CMD ["npm", "run", "dev", "--", "--host"]

FROM dev AS build
COPY . .
RUN npm run build

FROM node:20-bullseye AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
