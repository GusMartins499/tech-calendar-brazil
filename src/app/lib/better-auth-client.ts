import { createAuthClient } from 'better-auth/react';

// Sem baseURL: o client usa a mesma origem da página no browser,
// então funciona em localhost e no domínio *.ts.net do Tailscale sem rebuild.
export const authClient = createAuthClient();
