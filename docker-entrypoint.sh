#!/bin/sh
set -e

# Aplica as migrações pendentes antes de subir o servidor. Se falhar, o
# container não inicia (evita servir com banco sem schema).
echo "[entrypoint] aplicando migrações..."
node scripts/migrate.mjs

echo "[entrypoint] iniciando servidor..."
# Chama o next diretamente (sem pnpm/corepack em runtime) para não depender de
# rede no boot e para o processo do servidor ser o PID 1 do container.
exec node node_modules/next/dist/bin/next start
