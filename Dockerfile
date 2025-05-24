# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Instala deps do frontend
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# Gera o build
COPY whats-bot-control-center/ .
RUN npm run build

# 2) Runtime static server
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
