# 1) Instala todas as dependências (prod+dev) para o build
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
# reaproveita node_modules já instalado em deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Container final: serve apenas o dist
FROM node:18-alpine AS runner
WORKDIR /app
# copia os arquivos estáticos gerados
COPY --from=builder /app/dist ./dist
# instala o serve para servir estático
RUN npm install -g serve
EXPOSE 3000
# inicia o servidor estático na porta $PORT
CMD ["serve", "-s", "dist", "-l", "3000"]
