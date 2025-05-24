#################################
# 1) Build stage
#################################
FROM node:18-alpine AS builder

# 1.1) Clone todo o repositório
WORKDIR /app
COPY . .

# 1.2) Entre na pasta do frontend
WORKDIR /app/whats-bot-control-center

# 1.3) Instale deps e rode o build
RUN npm ci
RUN npm run build

#################################
# 2) Runtime stage
#################################
FROM node:18-alpine AS runner
WORKDIR /app

# 2.1) Traga apenas o build pronto
COPY --from=builder /app/whats-bot-control-center/dist ./dist

# 2.2) Instale o serve para arquivos estáticos
RUN npm install -g serve

# 2.3) Exponha a porta 3000 e rode
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
