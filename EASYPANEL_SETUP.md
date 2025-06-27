# Configuração EasyPanel - Solução do Erro Fatal

## SOLUÇÃO PARA O ERRO: "database 'estruturas' does not exist"

O erro fatal mostrado nas imagens indica que o banco "estruturas" não existe. A aplicação está configurada corretamente, mas o banco precisa ser criado.

## 1. Configuração Correta no EasyPanel

### Criar Serviço PostgreSQL
```
Nome do Serviço: warehouse-postgres
Nome do Banco: almoxarifado  ← IMPORTANTE: deve ser "almoxarifado"
Usuário: estruturas
Senha: (definir senha segura)
```

### Variáveis de Ambiente na Aplicação
```bash
DATABASE_URL=postgres://estruturas:SUA_SENHA@warehouse-postgres:5432/almoxarifado
NODE_ENV=production
PORT=5013
SESSION_SECRET=warehouse_session_secret_production_2024
```

## 2. Verificação das Variáveis (da imagem)

As variáveis mostradas na imagem estão indefinidas:
- UndefinedVar: $DATABASE_URL
- UndefinedVar: $NODE_ENV  
- UndefinedVar: $PORT
- UndefinedVar: $SESSION_SECRET

### Solução:
No EasyPanel, configurar todas as variáveis de ambiente na seção Environment do serviço.

## 3. Script de Correção Automática

O sistema agora inclui:
- `fix-easypanel-db.sh`: Script que cria o banco automaticamente
- `docker-entrypoint.sh`: Atualizado para verificar/criar banco
- Configuração PostgreSQL nativa (sem Neon)

## 4. Passos para Correção Imediata

### No EasyPanel:
1. Criar serviço PostgreSQL com banco "almoxarifado"
2. Configurar todas as variáveis de ambiente
3. Fazer redeploy da aplicação

### Verificação:
```bash
# O script já faz esta verificação automaticamente
docker logs CONTAINER_ID | grep "Banco de dados"
```

## 5. Estrutura Final Funcionando

- PostgreSQL nativo (drizzle-orm/node-postgres)
- Auto-criação do banco se não existir
- Migrações automáticas
- Health check configurado
- Todas as variáveis com valores padrão

A aplicação está pronta - só precisa das configurações corretas no EasyPanel.