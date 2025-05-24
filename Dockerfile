# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copia só o package.json e o lockfile para instalar as deps
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# Copia todo o código do frontend e gera o build
COPY whats-bot-control-center/ .
RUN npm run build

# 2) Runtime stage: serve o dist estático
FROM node:18-alpine AS runner
WORKDIR /app

# Copia apenas a pasta dist do builder
COPY --from=builder /app/dist ./dist

# Instala o `serve` global para servir estáticos
RUN npm install -g serve

# Exponha a porta que o Railway espera
EXPOSE 3000

# Inicia o servidor estático na porta 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
