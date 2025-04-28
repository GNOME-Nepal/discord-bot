# GNOME Nepal Discord Bot Dockerfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .


ENV NODE_ENV=production
CMD ["node", "index.js"]
