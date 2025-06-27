import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const url = process.env.DATABASE_URL;
console.log(`Conectando: ${url.replace(/:[^:@]*@/, ':***@')}`);

const client = postgres(url, { 
  ssl: url.includes('sslmode=require'),
  max: 10,
  connect_timeout: 10,
  idle_timeout: 30
});

export const db = drizzle(client, { schema });