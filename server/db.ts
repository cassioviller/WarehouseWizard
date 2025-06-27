import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuração do pool de conexões PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configurações adicionais para garantir conexão estável
  max: 10, // máximo de conexões no pool
  idleTimeoutMillis: 15000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 10000, // tempo limite para estabelecer conexão
  statement_timeout: 30000, // timeout para queries
  query_timeout: 30000, // timeout para queries
});

// Configuração do Drizzle ORM com PostgreSQL
export const db = drizzle({ client: pool, schema });

// Função para testar a conexão
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
