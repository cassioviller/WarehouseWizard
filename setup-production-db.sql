-- Setup script for production database
-- Run this on postgres://estruturas:1234@viajey_cassio:5432/almoxarifado?sslmode=disable

-- Create super admin user
INSERT INTO users (username, password, name, role, owner_id) 
VALUES ('cassio', 'f6037740ba9f57e1c30465a4c76fe53b5b288c822bb649e0fd1a7f4d12fdfce4e1c026063bef70689a26896af5e275b6913fa94db59d42a204bc4b7e290b69b3.2b14b39f8ddeab3d4e3d8a3b69c53a8b', 'Cassio Admin', 'super_admin', 1) 
ON CONFLICT (username) DO UPDATE SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- Insert default categories
INSERT INTO categories (name, description, owner_id) VALUES
('Materiais de Escritório', 'Papelaria e suprimentos de escritório', 1),
('Equipamentos', 'Equipamentos e ferramentas', 1),
('Materiais de Limpeza', 'Produtos de limpeza e higiene', 1),
('Materiais Elétricos', 'Componentes e materiais elétricos', 1)
ON CONFLICT DO NOTHING;