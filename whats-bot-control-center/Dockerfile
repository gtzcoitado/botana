# 1) Instalar dependências (prod+dev) só para o build
FROM node:18-alpine AS deps
WORKDIR /app
# copia só o package.json do front
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# 2) Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
# reaproveita node_modules instalados no deps
COPY --from=deps /app/node_modules ./node_modules
# copia todo o código do front
COPY whats-bot-control-center/ . 
RUN npm run build

# 3) Container final: serve só o dist
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
