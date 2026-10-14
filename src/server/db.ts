import { Pool, type PoolConfig } from 'pg';

/**
 * Shared PostgreSQL pool.
 * DATABASE_URL must be configured in the hosting provider's secret environment.
 * No database password is stored in source control.
 */
const connectionString = process.env.DATABASE_URL;

const poolConfig: PoolConfig = {
  ...(connectionString ? { connectionString } : {}),
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // Managed cloud databases commonly require TLS. Set PGSSL=true when the
  // provider requires TLS without providing a CA certificate.
  ...(process.env.PGSSL === 'true'
    ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } }
    : {})
};

export const db = new Pool(poolConfig);

db.on('error', (error) => {
  console.error('[POSTGRES] Erro inesperado em conexão ociosa:', error.message);
});

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const result = await db.query<{ ok: number }>('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}
