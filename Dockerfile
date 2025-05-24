# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# 1.1) Instala deps
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# 1.2) Copia TODO o frontend para /app
COPY whats-bot-control-center/ ./

# 1.3) Gera o build Vite
RUN npm run build

# 2) Runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

# Só precisa do dist
COPY --from=builder /app/dist ./dist

# Serve estático
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
