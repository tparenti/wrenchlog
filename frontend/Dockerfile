FROM node:20-bullseye AS build
WORKDIR /app
COPY package.json ./
RUN npm install --include=optional
COPY . .
RUN npm run build

FROM node:20-bullseye
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
