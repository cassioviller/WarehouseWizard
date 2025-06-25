# Guia de Deploy - Sistema de Almoxarifado

## Configuração de Produção

### 1. Banco de Dados PostgreSQL

**URL de Conexão:**
```
postgres://estruturas:1234@viajey_cassio:5432/almoxarifado?sslmode=disable
```

### 2. Build e Deploy com Docker

#### Construir a imagem:
```bash
docker build -t almoxarifado-app .
```

#### Executar o container:
```bash
docker run -d \
  --name almoxarifado \
  -p 5013:5013 \
  -e DATABASE_URL="postgres://estruturas:1234@viajey_cassio:5432/almoxarifado?sslmode=disable" \
  -e NODE_ENV="production" \
  -e PORT="5013" \
  -e SESSION_SECRET="almoxarifado-secret-2024" \
  almoxarifado-app
```

### 3. Verificações de Saúde

- **Health Check:** `http://localhost:5013/health`
- **Aplicação:** `http://localhost:5013`

### 4. Credenciais de Acesso

#### Super Administrador:
- **Usuário:** cassio
- **Senha:** 1234
- **Funcionalidades:** Gestão exclusiva de usuários

#### Usuário Regular:
- **Usuário:** teste
- **Senha:** teste
- **Funcionalidades:** Sistema completo de almoxarifado

### 5. Funcionalidades Disponíveis

#### Para Super Admin:
- Gestão de usuários (criar, editar, excluir)
- Controle de acesso e permissões

#### Para Usuários Regulares:
- Dashboard com métricas em tempo real
- Gestão completa de materiais
- Controle de entrada e saída de materiais
- Cadastro de fornecedores e funcionários
- Gestão de terceiros (empresas, prestadores)
- Relatórios financeiros e de estoque
- Sistema multi-tenant com isolamento de dados

### 6. Estrutura do Sistema

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Banco de Dados:** PostgreSQL com Drizzle ORM
- **Autenticação:** Session-based com Passport.js
- **Containerização:** Docker com health checks

### 7. Monitoramento

- Logs disponíveis via `docker logs almoxarifado`
- Health check automático a cada 30 segundos
- Métricas de sistema disponíveis no endpoint `/health`

### 8. Backup e Manutenção

- Backup do banco PostgreSQL deve ser feito regularmente
- Logs de auditoria disponíveis na tabela `audit_logs`
- Sistema preparado para escalabilidade horizontal

### 9. Solução de Problemas

#### Container não inicia:
1. Verificar se a DATABASE_URL está correta
2. Verificar conectividade com o banco PostgreSQL
3. Verificar logs: `docker logs almoxarifado`

#### Problemas de conexão com banco:
1. Verificar se o PostgreSQL está rodando em `viajey_cassio:5432`
2. Testar conexão: `psql "postgres://estruturas:1234@viajey_cassio:5432/almoxarifado"`
3. Verificar se o banco `almoxarifado` existe

#### Migração não executada:
1. O script executa automaticamente na inicialização
2. Verificar logs do container para erros de migração
3. Migração manual: `npm run db:push` dentro do container