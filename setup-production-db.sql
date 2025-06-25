-- Setup script for production database
-- Connection: postgres://estruturas:1234@viajey_cassio:5432/almoxarifado?sslmode=disable
-- Updated schema with comprehensive warehouse management features
-- IMPORTANTE: Execute este script no banco de produção antes do primeiro deploy

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS almoxarifado;

-- Connect to the database
\c almoxarifado;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    position TEXT,
    email TEXT,
    phone TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unidade',
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    last_supplier_id INTEGER REFERENCES suppliers(id),
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create stock_entries table
CREATE TABLE IF NOT EXISTS stock_entries (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    employee_id INTEGER REFERENCES employees(id),
    total_value DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create stock_entry_items table
CREATE TABLE IF NOT EXISTS stock_entry_items (
    id SERIAL PRIMARY KEY,
    stock_entry_id INTEGER REFERENCES stock_entries(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create stock_exits table
CREATE TABLE IF NOT EXISTS stock_exits (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    purpose TEXT,
    notes TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create stock_exit_items table
CREATE TABLE IF NOT EXISTS stock_exit_items (
    id SERIAL PRIMARY KEY,
    stock_exit_id INTEGER REFERENCES stock_exits(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id),
    quantity INTEGER NOT NULL,
    purpose TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Insert initial users (passwords are hashed for "1234" and "teste")
INSERT INTO users (username, password, name, role, owner_id) VALUES
('cassio', 'f6037740ba0e536c2a90b5dc3ad23b9cdcf9c2f75e5cb7c0c1b7c4b9a1db57e5ce8d19f7e6f4cb4f0b8b0a2c6e5a8f1b9d0c8e2f4a7b1c5e9f3a6d8b2e5f1.7a8e4f1c9b2d5a3e6f8b9c0d1e4f7a2b5c8e9f0a3d6b1e4f7c0a9b2e5f8d1c4a7', 'Cassio Admin', 'super_admin', 1),
('teste', '194c6306669c312372286d47aa4d73a6b9a0cffdf7314bc14f0aefe8e7a83264ecc42649f01a4227748c5e81705446452faa913dbae501ef0969cc79dec8920f.3e6ddf6d08f70323c0502d18f9be7567', 'Usuário Teste', 'user', 1)
ON CONFLICT (username) DO NOTHING;

-- Insert initial categories
INSERT INTO categories (name, description, owner_id) VALUES
('Materiais de Escritório', 'Papelaria e suprimentos de escritório', 1),
('Equipamentos', 'Equipamentos e ferramentas', 1),
('Materiais de Limpeza', 'Produtos de limpeza e higiene', 1),
('Materiais Elétricos', 'Componentes e materiais elétricos', 1)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_owner ON users(owner_id);
CREATE INDEX IF NOT EXISTS idx_categories_owner ON categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_owner ON employees(owner_id);
CREATE INDEX IF NOT EXISTS idx_materials_owner ON materials(owner_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_owner ON stock_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_owner ON stock_exits(owner_id);