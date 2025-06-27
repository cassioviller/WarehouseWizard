import type { Express } from "express";
import { createServer, type Server } from "http";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertCategorySchema, insertSupplierSchema, insertEmployeeSchema, 
  insertMaterialSchema, insertStockEntrySchema, insertStockExitSchema,
  insertUserSchema, insertThirdPartySchema
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
}

function getOwnerId(req: any): number {
  return req.user?.ownerId || req.user?.id || 1;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Health check endpoint (required for Docker healthcheck)
  app.get("/health", async (req, res) => {
    try {
      // Test database connection with simple query
      await storage.getDashboardMetrics(1);
      res.status(200).json({ 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Users routes (for super admin)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      console.log(`[USERS] Requisição de usuários por: ${user.username} (role: ${user.role})`);
      
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const users = await storage.getAllUsers();
      console.log(`[USERS] ${users.length} usuários encontrados`);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      console.log("[USERS] Dados recebidos:", req.body);
      
      // Validar apenas os campos necessários
      const userData = {
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        role: req.body.role || 'user'
      };

      if (!userData.username || !userData.password || !userData.name) {
        return res.status(400).json({ error: "Campos obrigatórios: username, password, name" });
      }

      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        ...userData,
        email: `${userData.username}@empresa.com`,
        password: hashedPassword,
        owner_id: 1,
      });
      
      console.log("[USERS] Usuário criado:", newUser.username);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Update user route
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const userData: any = {
        username: req.body.username,
        name: req.body.name,
        role: req.body.role || 'user'
      };

      // Only hash password if provided
      if (req.body.password && req.body.password.trim() !== '') {
        const hashedPassword = await hashPassword(req.body.password);
        userData.password = hashedPassword;
      }

      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log("[USERS] Usuário atualizado:", updatedUser.username);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Delete user route
  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      
      // Prevent deleting super admin
      if (id === 1) {
        return res.status(400).json({ error: "Não é possível excluir o super administrador" });
      }

      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log("[USERS] Usuário excluído com ID:", id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Third parties routes
  app.get("/api/third-parties", requireAuth, async (req, res) => {
    try {
      const ownerId = getOwnerId(req);
      const thirdParties = await storage.getThirdParties(ownerId);
      res.json(thirdParties);
    } catch (error) {
      console.error("Error fetching third parties:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/third-parties", requireAuth, async (req, res) => {
    try {
      const ownerId = getOwnerId(req);
      const thirdPartyData = insertThirdPartySchema.parse(req.body);
      
      const thirdParty = await storage.createThirdParty({
        ...thirdPartyData,
        owner_id: ownerId,
      });
      
      res.status(201).json(thirdParty);
    } catch (error) {
      console.error("Error creating third party:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/third-parties/:id", requireAuth, async (req, res) => {
    try {
      const ownerId = getOwnerId(req);
      const id = parseInt(req.params.id);
      const thirdPartyData = insertThirdPartySchema.partial().parse(req.body);
      
      const thirdParty = await storage.updateThirdParty(id, thirdPartyData, ownerId);
      
      if (!thirdParty) {
        return res.status(404).json({ error: "Terceiro não encontrado" });
      }
      
      res.json(thirdParty);
    } catch (error) {
      console.error("Error updating third party:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/third-parties/:id", requireAuth, async (req, res) => {
    try {
      const ownerId = getOwnerId(req);
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteThirdParty(id, ownerId);
      
      if (!success) {
        return res.status(404).json({ error: "Terceiro não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting third party:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories(getOwnerId(req));
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse({
        ...req.body,
        ownerId: getOwnerId(req),
      });
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData, getOwnerId(req));
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id, getOwnerId(req));
      if (!deleted) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar categoria" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers(getOwnerId(req));
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar fornecedores" });
    }
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse({
        ...req.body,
        ownerId: getOwnerId(req),
      });
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Employees
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployees(getOwnerId(req));
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar funcionários" });
    }
  });

  app.post("/api/employees", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        ownerId: getOwnerId(req),
      });
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Materials
  app.get("/api/materials", requireAuth, async (req, res) => {
    try {
      const materials = await storage.getMaterialsWithCategory(getOwnerId(req));
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar materiais" });
    }
  });

  app.post("/api/materials", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse({
        ...req.body,
        ownerId: getOwnerId(req),
      });
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Stock Entries
  app.get("/api/stock-entries", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getStockEntries(getOwnerId(req));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar entradas" });
    }
  });

  app.post("/api/stock-entries", requireAuth, async (req, res) => {
    try {
      const { entry, items } = req.body;
      const validatedEntry = insertStockEntrySchema.parse({
        ...entry,
        ownerId: getOwnerId(req),
      });
      const validatedItems = items.map((item: any) => ({
        ...item,
        ownerId: getOwnerId(req),
      }));
      
      const stockEntry = await storage.createStockEntry(validatedEntry, validatedItems);
      res.status(201).json(stockEntry);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Stock Exits
  app.get("/api/stock-exits", requireAuth, async (req, res) => {
    try {
      const exits = await storage.getStockExits(getOwnerId(req));
      res.json(exits);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar saídas" });
    }
  });

  app.post("/api/stock-exits", requireAuth, async (req, res) => {
    try {
      const { exit, items } = req.body;
      const validatedExit = insertStockExitSchema.parse({
        ...exit,
        ownerId: getOwnerId(req),
      });
      const validatedItems = items.map((item: any) => ({
        ...item,
        ownerId: getOwnerId(req),
      }));
      
      const stockExit = await storage.createStockExit(validatedExit, validatedItems);
      res.status(201).json(stockExit);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(getOwnerId(req));
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas" });
    }
  });

  // Financial report
  app.get("/api/reports/financial", requireAuth, async (req, res) => {
    try {
      const report = await storage.getFinancialReport(getOwnerId(req));
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
    }
  });

  // Users management (super_admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      const { password, ...otherData } = req.body;
      
      // Hash the password properly
      const salt = randomBytes(16).toString('hex');
      const hashedPassword = (await scryptAsync(password, salt, 64)) as Buffer;
      const finalPassword = `${hashedPassword.toString('hex')}.${salt}`;
      
      const userData = insertUserSchema.parse({
        ...otherData,
        password: finalPassword,
        ownerId: 1
      });
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
