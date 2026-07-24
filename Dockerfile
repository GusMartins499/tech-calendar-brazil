FROM node:iron-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# --- Dependências (inclui dev, necessárias para o build) ---
FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Var NEXT_PUBLIC_* é embutida no bundle do cliente em build time. O escopo do
# Google Calendar é fixo, então tem um default; pode ser sobrescrito via
# --build-arg NEXT_PUBLIC_GOOGLE_SCOPE=...
ARG NEXT_PUBLIC_GOOGLE_SCOPE="https://www.googleapis.com/auth/calendar"
ENV NEXT_PUBLIC_GOOGLE_SCOPE=$NEXT_PUBLIC_GOOGLE_SCOPE

# Placeholders só para o build: o better-auth valida a config ao ser importado
# durante o `next build` e, sem estes, emite ERROR/WARN (default secret, Google
# sem clientId). Não são NEXT_PUBLIC_, então NÃO entram na imagem — em runtime os
# valores reais vêm do ambiente/secrets do k8s.
ENV BETTER_AUTH_SECRET=build-time-placeholder \
    GOOGLE_CLIENT_ID=build-time-placeholder \
    GOOGLE_CLIENT_SECRET=build-time-placeholder

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# --- Dependências apenas de produção (sem devDeps) ---
FROM base AS prod-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Instala só deps de produção e remove o que não roda neste runtime:
#  - @next/swc: compilador usado apenas em build/dev, não em `next start`;
#  - variantes musl de libsql/sharp: a imagem é Debian (glibc), nunca usadas.
RUN pnpm install --prod --frozen-lockfile \
    && rm -rf \
        node_modules/.pnpm/@next+swc-* \
        node_modules/@next/swc-* \
        node_modules/.pnpm/@libsql+linux-*-musl* \
        node_modules/.pnpm/@img+sharp-libvips-linuxmusl-* \
        node_modules/.pnpm/@img+sharp-linuxmusl-*

# --- Runner ---
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DB_FILE_NAME=file:/data/local.db \
    MIGRATIONS_FOLDER=./src/db/migrations

# --chown já grava os arquivos com o dono certo, evitando uma segunda camada
# (um `chown -R` depois duplicaria toda a node_modules na imagem).
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.mjs ./next.config.mjs
COPY --from=build --chown=node:node /app/src/db/migrations ./src/db/migrations
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

# Volume do banco (PVC no k3s). O usuário 'node' (uid 1000) precisa poder gravar.
RUN chmod +x docker-entrypoint.sh \
    && mkdir -p /data \
    && chown node:node /data

USER node

EXPOSE 3000

VOLUME ["/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
