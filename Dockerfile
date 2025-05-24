# 1) Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY whats-bot-control-center/package*.json ./
RUN npm ci

COPY whats-bot-control-center/ .
RUN npm run build

# 2) Runtime
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
