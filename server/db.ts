import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Sem SSL para PostgreSQL local no EasyPanel
  max: 10,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database() as database_name');
    console.log('Conectado ao banco de dados:', result.rows[0].database_name);
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Fechando pool de conexões...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Fechando pool de conexões...');
  await pool.end();
  process.exit(0);
});
