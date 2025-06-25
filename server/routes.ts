import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertCategorySchema, insertSupplierSchema, insertEmployeeSchema, 
  insertMaterialSchema, insertStockEntrySchema, insertStockExitSchema,
  insertUserSchema
} from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
}

function getOwnerId(req: any): number {
  return req.user?.ownerId || req.user?.id || 1;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

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
      const userData = insertUserSchema.parse(req.body);
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
