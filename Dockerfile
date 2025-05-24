# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copia apenas o package.json e package-lock para instalar deps
COPY whats-bot-control-center/package*.json ./
RUN npm ci

# Copia o resto do código do frontend e gera o build
COPY whats-bot-control-center/ .
RUN npm run build

# 2) Runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

# Só precisa da pasta dist
COPY --from=builder /app/dist ./dist

# Serve o conteúdo estático em port 3000
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
