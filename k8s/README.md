# Deploy no k3s + Tailscale

App Next.js exposto **apenas** pela sua VPN Tailscale (HTTPS em
`tech-calendar.<seu-tailnet>.ts.net`), com SQLite persistido em PVC e migração
automática no boot.

## Arquitetura

Um Deployment de 1 réplica com dois containers:

- **app** — a imagem do projeto (`ghcr.io/gusmartins499/my-calendar-tech-brazil`),
  serve na porta 3000; o entrypoint roda as migrações antes de subir.
- **tailscale** (sidecar, userspace) — junta o pod ao tailnet como o nó
  `tech-calendar` e faz `tailscale serve` de HTTPS → `127.0.0.1:3000`.

O estado do nó Tailscale fica num Secret (`tailscale-state`, criado sozinho via
kube state store), então não vira nó órfão a cada restart.

## Pré-requisitos

1. **k3s** rodando (a StorageClass default `local-path` já serve para o PVC).
2. No admin do Tailscale: **MagicDNS** e **HTTPS certificates** habilitados
   (Settings → DNS). Sem HTTPS habilitado, o `tailscale serve` não emite o cert.
3. Uma **auth key** reutilizável: <https://login.tailscale.com/admin/settings/keys>.
4. No **Google Cloud Console** (client OAuth do app), adicione:
   - Origem JavaScript: `https://tech-calendar.<seu-tailnet>.ts.net`
   - URI de redirecionamento: `https://tech-calendar.<seu-tailnet>.ts.net/api/auth/callback/google`

> Descubra o FQDN exato com `tailscale status` ou no admin console após o primeiro
> deploy (o nó aparece como `tech-calendar`).

## Passos

```sh
# 1. Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Secrets (não versionados) — troque os valores
kubectl -n tech-calendar create secret generic tech-calendar-app \
  --from-literal=GOOGLE_CLIENT_ID='...' \
  --from-literal=GOOGLE_CLIENT_SECRET='...' \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=BETTER_AUTH_URL='https://tech-calendar.<seu-tailnet>.ts.net'

kubectl -n tech-calendar create secret generic tailscale-auth \
  --from-literal=TS_AUTHKEY='tskey-auth-...'

# 3. Todo o resto
kubectl apply -k k8s/

# 4. Acompanhar
kubectl -n tech-calendar get pods -w
kubectl -n tech-calendar logs deploy/tech-calendar -c app
kubectl -n tech-calendar logs deploy/tech-calendar -c tailscale
```

Quando o pod estiver `Running`, acesse `https://tech-calendar.<seu-tailnet>.ts.net`
de qualquer dispositivo no seu tailnet.

## Observações

- **Imagem:** ajuste o `image:` em `deployment.yaml` se seu usuário/registry GHCR
  for diferente de `gusmartins499`.
- **Login pede a agenda toda vez:** é o `prompt=consent` garantindo o refresh
  token (ver README principal). Esperado.
- **Trocar o hostname:** altere `TS_HOSTNAME` no `deployment.yaml` e o
  `BETTER_AUTH_URL`/redirect do Google de forma consistente.
- **Backup do banco:** o PVC `tech-calendar-db` guarda `local.db` (sessões +
  tokens). Faça snapshot dele se quiser preservar logins.
