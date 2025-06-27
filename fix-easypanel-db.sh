#!/bin/bash
set -e

echo "🔧 Script de Correção para EasyPanel - Banco de Dados"

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está definida"
    echo "Configure no EasyPanel: postgres://estruturas:senha@postgres-service:5432/almoxarifado"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

# Extrair componentes da URL
DB_HOST=$(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+).*/\1/')
DB_USER=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/([^:]+):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/[^:]+:([^@]+)@.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed -E 's/^.*\/([^?]+).*$/\1/')

echo "🔌 Conectando ao PostgreSQL:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"  
echo "User: $DB_USER"
echo "Database: $DB_NAME"

# Configurar senha para psql
export PGPASSWORD="$DB_PASS"

# Aguardar PostgreSQL estar disponível
echo "⏳ Aguardando PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    echo "PostgreSQL não está pronto - aguardando..."
    sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Verificar se banco existe, se não, criar
echo "🗄️ Verificando banco de dados '$DB_NAME'..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "📝 Criando banco de dados '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\""
    echo "✅ Banco '$DB_NAME' criado com sucesso!"
else
    echo "✅ Banco '$DB_NAME' já existe"
fi

# Testar conexão com o banco específico
echo "🔍 Testando conexão com o banco '$DB_NAME'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT current_database() as database, version();"

echo "🎯 Banco de dados configurado corretamente para EasyPanel!"