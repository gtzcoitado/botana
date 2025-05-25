#################################
# 1) Build stage
#################################
FROM node:18-alpine AS builder
WORKDIR /app

# 1.1) Copia package.json + lockfile e instala deps
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# 1.2) Copia explicitamente o resto do frontend
COPY whats-bot-control-center/vite.config.ts ./
COPY whats-bot-control-center/index.html ./
COPY whats-bot-control-center/public ./public
COPY whats-bot-control-center/src ./src

# 1.3) Gera o build
RUN npm run build

#################################
# 2) Runtime stage
#################################
FROM node:18-alpine AS runner
WORKDIR /app

# 2.1) Puxa o dist pronto
COPY --from=builder /app/dist ./dist

# 2.2) Serve estático
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

