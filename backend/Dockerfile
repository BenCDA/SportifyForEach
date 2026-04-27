FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.seed.json ./
COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
RUN npm run build && npx tsc -p tsconfig.seed.json

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copie tout depuis le builder : node_modules inclut prisma CLI + engines déjà générés
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed

COPY prisma ./prisma/
COPY src/openapi.yaml ./dist/openapi.yaml
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["./entrypoint.sh"]
