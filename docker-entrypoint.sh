#!/bin/bash
set -e

echo ">>> Iniciando script de entrada da Aplicação no Replit <<<"

# 1. Validar Variáveis de Ambiente Essenciais
: "${DATABASE_URL:?Variável DATABASE_URL não está configurada. Verifique as variáveis secretas do seu Repl ou o add-on de banco de dados.}"
: "${NODE_ENV:?Variável NODE_ENV não está configurada}"
: "${PORT:?Variável PORT não está configurada}"

echo "Configurações detectadas:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: [CONFIGURADA]"

# 2. Extrair Informações de Conexão da DATABASE_URL

# Extrair componentes da DATABASE_URL para pg_isready e psql
PGHOST=$(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):.*/\1/' 2>/dev/null || echo "localhost")
PGPORT=$(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+).*/\1/' 2>/dev/null || echo "5432")
PGUSER=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/([^:]+):.*/\1/' 2>/dev/null || echo "postgres")
DB_NAME=$(echo $DATABASE_URL | sed -E 's/^.*\/([^?]+).*$/\1/') # Extrai o nome do banco de dados

echo "Conectando ao banco de dados:"
echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "User: $PGUSER"
echo "Database Name: $DB_NAME" # Adicionado para depuração

# 3. Aguardar o Banco de Dados Estar Pronto
echo "Aguardando inicialização do PostgreSQL..."
MAX_ATTEMPTS=30
ATTEMPTS=0

check_db_connection() {
  # Para conexões com sslmode=disable, pg_isready deve funcionar
  # Usando -d para especificar o banco de dados, embora pg_isready não precise para conectividade básica
  pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB_NAME" > /dev/null 2>&1
  return $?
}

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if check_db_connection; then
    echo "PostgreSQL está pronto!"
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "PostgreSQL não está pronto ainda - tentativa $ATTEMPTS de $MAX_ATTEMPTS - esperando..."
  sleep 2
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "Não foi possível conectar ao PostgreSQL após $MAX_ATTEMPTS tentativas. Verifique a conexão e a DATABASE_URL."
  exit 1
fi

echo "Banco de dados conectado com sucesso!"

# 4. Verificar/Criar Banco de Dados
echo "Verificando se o banco de dados '$DB_NAME' existe..."

# Extrair senha da DATABASE_URL
export PGPASSWORD=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/[^:]+:([^@]+)@.*/\1/')

# Verificar se o banco existe, se não, criar
if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "Banco de dados '$DB_NAME' não existe. Criando..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE \"$DB_NAME\""
  echo "Banco de dados '$DB_NAME' criado com sucesso!"
else
  echo "Banco de dados '$DB_NAME' já existe."
fi

# 5. Executar Migrações (Drizzle)
echo "Verificando se as tabelas do banco de dados existem..."
if psql -d "$DB_NAME" -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -c "SELECT to_regclass('public.users');" | grep -q "users"; then
  echo "Tabela 'users' já existe, pulando migração."
else
  echo "Tabela 'users' não existe. Executando migração inicial..."
  
  # Executar push do schema para o banco de dados
  NODE_ENV=production npm run db:push
  
  if [ $? -eq 0 ]; then
    echo "Migração executada com sucesso!"
  else
    echo "Erro ao executar migração. Verifique os logs."
    exit 1
  fi
fi

echo ">>> Configuração do banco de dados concluída <<<"

# 5. Criar endpoint de health check
echo "Configurando health check..."

# 6. Iniciar a Aplicação
echo "Iniciando aplicação na porta $PORT..."
echo ">>> Sistema de Almoxarifado pronto para uso! <<<"

# O 'exec "$@"' garante que o comando CMD do Dockerfile seja executado como o processo principal
exec "$@"
