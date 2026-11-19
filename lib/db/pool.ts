/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

let poolInstance: Pool | null = null;
let testPoolOverride: Pool | null = null;

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Please configure the PostgreSQL connection string in environment variables.",
    );
  }
  return url;
}

export function createPool(connectionString?: string): Pool {
  let url = connectionString || getDatabaseUrl();
  const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");

  // Determine SSL configuration
  // For remote PostgreSQL (including Supabase Cloud, RDS, VPS), enable SSL by default
  const sslConfig = isLocalhost
    ? false
    : {
        rejectUnauthorized: false,
      };

  // Strip sslmode parameter so pg driver respects rejectUnauthorized: false
  if (!isLocalhost && url.includes("sslmode=")) {
    url = url.replace(/[\?&]sslmode=[^&]+/g, "");
    if (url.endsWith("?")) {
      url = url.slice(0, -1);
    }
  }

  const pool = new Pool({
    connectionString: url,
    ssl: sslConfig,
    // Connection pool limits
    max: process.env.NODE_ENV === "production" ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // Prepared statements: Supabase Transaction Pooler (port 6543 / PgBouncer)
    // does NOT support named prepared statements. node-postgres default queries
    // execute as unnamed statements, which are fully supported by PgBouncer.
  });

  pool.on("error", (err) => {
    console.error("[db-pool] Unexpected error on idle client", err);
  });

  return pool;
}

export function getPool(): Pool {
  if (testPoolOverride) {
    return testPoolOverride;
  }
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

export function setTestPool(pool: Pool | null): void {
  testPoolOverride = pool;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<R>> {
  const pool = getPool();
  return pool.query<R>(text, params);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
