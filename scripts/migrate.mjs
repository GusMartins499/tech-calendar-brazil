// Aplica as migrações pendentes do Drizzle e sai.
// Roda como processo Node separado (fora do bundler do Next), então usa apenas
// as dependências de produção. Chamado pelo entrypoint do container antes de
// iniciar o servidor, garantindo que um volume vazio (PVC novo no k3s) já suba
// com o schema pronto. Se falhar, sai com código != 0 e o container não sobe.
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.DB_FILE_NAME ?? 'file:local.db';
const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? './src/db/migrations';

const client = createClient({ url });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder });
  console.log(`[migrate] migrações aplicadas em ${url}`);
} catch (error) {
  console.error('[migrate] falha ao aplicar migrações:', error);
  process.exit(1);
} finally {
  client.close();
}
