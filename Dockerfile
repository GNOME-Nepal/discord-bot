# GNOME Nepal Discord Bot Dockerfile

FROM node:latest AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.3.0 && \
    npm install --include=dev
COPY . .

FROM node:latest
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .

RUN npm install -g npm@11.3.0 && \
    npm install --omit=dev

RUN echo "#!/bin/sh\n\
trap 'echo \"Received stop signal, exiting...\"; exit 0' SIGTERM SIGINT\n\
while true; do\n\
  node index.js\n\
  sleep 1\n\
done" > /app/restart_handler.sh && \
    chmod +x /app/restart_handler.sh

ENV NODE_ENV=production
CMD ["/app/restart_handler.sh"]
