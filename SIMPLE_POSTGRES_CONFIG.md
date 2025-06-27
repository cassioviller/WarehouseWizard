# Configuração PostgreSQL Flexível - WarehouseWizard

## Implementação Baseada em Exemplo Funcional

### 1. Configuração de Banco Flexível (server/db.ts)

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Conexão flexível que funciona tanto em desenvolvimento quanto produção
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
```

**Características**:
- Detecção automática de SSL baseada na URL do banco
- Funciona em desenvolvimento (Replit) e produção (EasyPanel/Docker)
- Pool de conexões otimizado
- Timeouts configurados

### 2. Ambientes de Deploy

**Desenvolvimento (Replit)**:
- URL atual: `postgresql://neondb_owner:***@ep-patient-rice-a64fntal.us-west-2.aws.neon.tech/neondb?sslmode=require`
- SSL habilitado automaticamente
- Configuração via Secrets

**Produção (EasyPanel)**:
- URL: `postgres://estruturas:1234@viajey_cassio:5432/almoxarifado?sslmode=disable`
- SSL desabilitado (conexão local)
- Configuração via Environment Variables

**Produção Local (Docker)**:
- docker-compose.yml com PostgreSQL 15
- Usuário: almoxarifado_user
- Banco: almoxarifado

### 3. Dockerfile Simplificado

```dockerfile
FROM node:20-slim
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "run", "start"]
```

**Vantagens**:
- Simples e eficiente
- Sem complexidade desnecessária
- Foco na aplicação

### 4. Opções de Deploy

**A. Deploy com Docker Compose**:
```bash
docker-compose up -d
```

**B. Deploy com EasyPanel**:
- Configurar DATABASE_URL nas Environment Variables
- Build automático via Dockerfile
- PostgreSQL como serviço separado

### 5. Status Atual

**Validações Realizadas**:
- ✅ API respondendo: 401 (comportamento correto)
- ✅ Conexão PostgreSQL: Funcional
- ✅ SSL auto-detectado: Baseado na URL
- ✅ Pool de conexões: Configurado
- ✅ Drizzle ORM: Integrado

**Comandos de Teste**:
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy com Docker
docker-compose up -d

# Verificar status
curl -s http://localhost:5000/api/user
```

### 6. Migração do Schema

O sistema mantém a migração automática via Drizzle:
```bash
npm run db:push
```

**Tabelas principais**:
- users (authentication)
- materials (inventory)
- categories, suppliers, employees
- stock_entries, stock_exits (movements)
- third_parties (external entities)

## Conclusão

Esta configuração PostgreSQL flexível simplificou significativamente o setup, eliminando complexidades desnecessárias enquanto mantém compatibilidade total com:

1. **Replit** (desenvolvimento com SSL)
2. **EasyPanel** (produção sem SSL)  
3. **Docker Compose** (local com PostgreSQL próprio)

A detecção automática de SSL baseada na URL do banco garante que funcione em qualquer ambiente sem configuração manual adicional.