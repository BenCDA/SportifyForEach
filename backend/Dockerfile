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

# Create user before COPY so --chown resolves correctly
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Use --chown at copy time to avoid chown -R on a frozen overlay layer
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/dist-seed ./dist-seed

COPY --chown=appuser:appgroup prisma ./prisma/
COPY --chown=appuser:appgroup src/openapi.yaml ./dist/openapi.yaml
COPY --chown=appuser:appgroup entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh

USER appuser

EXPOSE 3000

CMD ["./entrypoint.sh"]
