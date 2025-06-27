# Migração para EasyPanel - PostgreSQL Nativo

## 1. Configuração do PostgreSQL no EasyPanel

### Criar Serviço PostgreSQL
1. No painel do EasyPanel, criar um novo serviço PostgreSQL
2. Configurar as credenciais:
   - Nome do banco: `almoxarifado`
   - Usuário: `estruturas`
   - Senha: (definir senha segura)

### Variável de Ambiente
Definir no EasyPanel a variável `DATABASE_URL`:
```
DATABASE_URL=postgres://estruturas:senha_segura@postgres_service:5432/almoxarifado
```

## 2. Configuração Técnica Implementada

### server/db.ts
- Atualizado para usar `drizzle-orm/node-postgres` (compatível com PostgreSQL nativo)
- Removidas configurações específicas do Neon Database
- Pool de conexões otimizado para ambiente local

### Características da Nova Configuração
- **Driver**: `node-postgres` (pg)
- **SSL**: Desabilitado (PostgreSQL local)
- **Pool**: Máximo 10 conexões
- **Timeouts**: Configurados para ambiente local

## 3. Deploy no EasyPanel

### Dockerfile (já configurado)
O Dockerfile atual está pronto para EasyPanel:
- Usa PostgreSQL nativo
- Configurações de produção
- Auto-migração no startup

### Comando de Deploy
```bash
# No EasyPanel, usar o Dockerfile existente
docker build -t warehouse-app .
docker run -e DATABASE_URL=postgres://estruturas:senha@postgres_service:5432/almoxarifado warehouse-app
```

## 4. Verificação Pós-Deploy

### Testar Conexão
```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT current_database() as db_name')
  .then(res => console.log('Banco conectado:', res.rows[0].db_name))
  .catch(err => console.error('Erro:', err))
  .finally(() => pool.end());
"
```

### Executar Migrações
```bash
npm run db:push
```

## 5. Diferenças da Migração

### Antes (Neon Database)
- Conexão externa via WebSocket
- SSL obrigatório
- Driver `@neondatabase/serverless`

### Depois (PostgreSQL EasyPanel)
- Conexão local via TCP
- Sem SSL
- Driver `pg` nativo
- Performance melhorada (latência reduzida)

## 6. Benefícios da Migração

1. **Performance**: Conexão local reduz latência
2. **Simplicidade**: Sem dependências externas
3. **Controle**: Gerenciamento completo dos dados
4. **Custos**: Redução de custos com serviços externos
5. **Backup**: Controle total sobre backups

## 7. Checklist de Migração

- [x] Atualizar server/db.ts para PostgreSQL nativo
- [x] Configurar pool de conexões otimizado
- [x] Testar conexão local
- [ ] Criar serviço PostgreSQL no EasyPanel
- [ ] Configurar DATABASE_URL no EasyPanel
- [ ] Deploy da aplicação
- [ ] Executar migrações de produção
- [ ] Verificar funcionamento completo

A aplicação está pronta para deploy no EasyPanel com PostgreSQL nativo!