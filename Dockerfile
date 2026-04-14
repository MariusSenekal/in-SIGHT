FROM node:22-alpine AS builder

WORKDIR /app
ARG NUXT_APP_BASE_URL=/
ARG NODE_OPTIONS_BUILD=--max-old-space-size=2048
ENV NUXT_APP_BASE_URL=${NUXT_APP_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN NODE_OPTIONS=${NODE_OPTIONS_BUILD} npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NUXT_APP_BASE_URL=/

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
