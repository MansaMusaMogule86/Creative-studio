FROM node:22-slim AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG SITE_URL=https://mansasmoguls.com
ARG SITE_ENV=production
ENV SITE_URL=$SITE_URL
ENV SITE_ENV=$SITE_ENV
RUN pnpm build
RUN npm install -g esbuild && esbuild api/leads.ts \
  --bundle --platform=node --format=esm --target=node22 \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
  --outfile=dist-api/leads.mjs

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-api ./dist-api
COPY server.mjs ./server.mjs
EXPOSE 3000
CMD ["node", "server.mjs"]
