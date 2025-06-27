import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Conexão flexível que funciona tanto em desenvolvimento quanto produção
const queryClient = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('sslmode=require'),
  max: 10,
  connect_timeout: 10,
  idle_timeout: 30
});

export const db = drizzle(queryClient, { schema });

export async function testConnection() {
  try {
    const result = await queryClient`SELECT current_database() as db_name, current_user as user_name`;
    console.log('Database connection successful:', result[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
