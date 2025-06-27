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
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
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
