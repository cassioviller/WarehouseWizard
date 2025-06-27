import { 
  users, categories, suppliers, employees, materials, thirdParties,
  stockEntries, stockEntryItems, stockExits, stockExitItems,
  type User, type InsertUser, type Category, type InsertCategory,
  type Supplier, type InsertSupplier, type Employee, type InsertEmployee,
  type Material, type InsertMaterial, type StockEntry, type InsertStockEntry,
  type StockEntryItem, type InsertStockEntryItem, type StockExit, type InsertStockExit,
  type StockExitItem, type InsertStockExitItem, type ThirdParty, type InsertThirdParty
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Third party methods
  getThirdParties(ownerId: number): Promise<ThirdParty[]>;
  createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty>;
  updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, ownerId: number): Promise<ThirdParty | undefined>;
  deleteThirdParty(id: number, ownerId: number): Promise<boolean>;
  
  // Category methods
  getCategories(ownerId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, ownerId: number): Promise<Category | undefined>;
  deleteCategory(id: number, ownerId: number): Promise<boolean>;
  
  // Supplier methods
  getSuppliers(ownerId: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>, ownerId: number): Promise<Supplier | undefined>;
  deleteSupplier(id: number, ownerId: number): Promise<boolean>;
  
  // Employee methods
  getEmployees(ownerId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, ownerId: number): Promise<Employee | undefined>;
  deleteEmployee(id: number, ownerId: number): Promise<boolean>;
  
  // Material methods
  getMaterials(ownerId: number): Promise<Material[]>;
  getMaterialsWithCategory(ownerId: number): Promise<(Material & { category: Category | null })[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>, ownerId: number): Promise<Material | undefined>;
  deleteMaterial(id: number, ownerId: number): Promise<boolean>;
  updateMaterialStock(materialId: number, quantity: number, operation: 'add' | 'subtract', ownerId: number): Promise<void>;
  
  // Stock Entry methods
  getStockEntries(ownerId: number): Promise<(StockEntry & { supplier: Supplier | null, employee: Employee | null })[]>;
  createStockEntry(entry: InsertStockEntry, items: InsertStockEntryItem[]): Promise<StockEntry>;
  
  // Stock Exit methods
  getStockExits(ownerId: number): Promise<(StockExit & { employee: Employee | null })[]>;
  createStockExit(exit: InsertStockExit, items: InsertStockExitItem[]): Promise<StockExit>;
  
  // Dashboard metrics
  getDashboardMetrics(ownerId: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }>;
  
  // Financial reports
  getFinancialReport(ownerId: number): Promise<{
    totalStockValue: number;
    totalItems: number;
    highValueItems: number;
    stockItems: (Material & { category: Category | null, totalValue: number })[];
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool as any, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.created_at);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCategories(ownerId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.owner_id, ownerId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, ownerId: number): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.owner_id, ownerId)))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number, ownerId: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.owner_id, ownerId)));
    return (result.rowCount || 0) > 0;
  }

  async getSuppliers(ownerId: number): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.owner_id, ownerId));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>, ownerId: number): Promise<Supplier | undefined> {
    const [updated] = await db
      .update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.owner_id, ownerId)))
      .returning();
    return updated || undefined;
  }

  async deleteSupplier(id: number, ownerId: number): Promise<boolean> {
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.owner_id, ownerId)));
    return (result.rowCount || 0) > 0;
  }

  async getEmployees(ownerId: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.owner_id, ownerId));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>, ownerId: number): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set(employee)
      .where(and(eq(employees.id, id), eq(employees.owner_id, ownerId)))
      .returning();
    return updated || undefined;
  }

  async deleteEmployee(id: number, ownerId: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.owner_id, ownerId)));
    return (result.rowCount || 0) > 0;
  }

  async getMaterials(ownerId: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.owner_id, ownerId));
  }

  async getMaterialsWithCategory(ownerId: number): Promise<(Material & { category: Category | null })[]> {
    const result = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.category_id,
        unit: materials.unit,
        minimumStock: materials.minimum_stock,
        currentStock: materials.current_stock,
        unitPrice: materials.unit_price,
        ownerId: materials.owner_id,
        createdAt: materials.created_at,
        category: categories,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.category_id, categories.id))
      .where(eq(materials.owner_id, ownerId));
    
    return result as (Material & { category: Category | null })[];
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>, ownerId: number): Promise<Material | undefined> {
    const [updated] = await db
      .update(materials)
      .set(material)
      .where(and(eq(materials.id, id), eq(materials.owner_id, ownerId)))
      .returning();
    return updated || undefined;
  }

  async deleteMaterial(id: number, ownerId: number): Promise<boolean> {
    const result = await db
      .delete(materials)
      .where(and(eq(materials.id, id), eq(materials.owner_id, ownerId)));
    return (result.rowCount || 0) > 0;
  }

  async updateMaterialStock(materialId: number, quantity: number, operation: 'add' | 'subtract', ownerId: number): Promise<void> {
    const increment = operation === 'add' ? quantity : -quantity;
    await db
      .update(materials)
      .set({
        currentStock: sql`${materials.current_stock} + ${increment}`
      })
      .where(and(eq(materials.id, materialId), eq(materials.owner_id, ownerId)));
  }

  async getStockEntries(ownerId: number): Promise<(StockEntry & { supplier: Supplier | null, employee: Employee | null })[]> {
    const result = await db
      .select({
        id: stockEntries.id,
        date: stockEntries.date,
        origin: stockEntries.origin,
        supplierId: stockEntries.supplier_id,
        employeeId: stockEntries.employee_id,
        notes: stockEntries.notes,
        ownerId: stockEntries.owner_id,
        createdAt: stockEntries.created_at,
        supplier: suppliers,
        employee: employees,
      })
      .from(stockEntries)
      .leftJoin(suppliers, eq(stockEntries.supplier_id, suppliers.id))
      .leftJoin(employees, eq(stockEntries.employee_id, employees.id))
      .where(eq(stockEntries.owner_id, ownerId))
      .orderBy(desc(stockEntries.date));
    
    return result as (StockEntry & { supplier: Supplier | null, employee: Employee | null })[];
  }

  async createStockEntry(entry: InsertStockEntry, items: InsertStockEntryItem[]): Promise<StockEntry> {
    const [newEntry] = await db
      .insert(stockEntries)
      .values(entry)
      .returning();

    for (const item of items) {
      await db.insert(stockEntryItems).values({
        ...item,
        entryId: newEntry.id,
      });

      // Update material stock
      await this.updateMaterialStock(item.materialId!, item.quantity, 'add', entry.owner_id);
    }

    return newEntry;
  }

  async getStockExits(ownerId: number): Promise<(StockExit & { employee: Employee | null })[]> {
    const result = await db
      .select({
        id: stockExits.id,
        date: stockExits.date,
        destination: stockExits.destination,
        employeeId: stockExits.employee_id,
        notes: stockExits.notes,
        ownerId: stockExits.owner_id,
        createdAt: stockExits.created_at,
        employee: employees,
      })
      .from(stockExits)
      .leftJoin(employees, eq(stockExits.employee_id, employees.id))
      .where(eq(stockExits.owner_id, ownerId))
      .orderBy(desc(stockExits.date));
    
    return result as (StockExit & { employee: Employee | null })[];
  }

  async createStockExit(exit: InsertStockExit, items: InsertStockExitItem[]): Promise<StockExit> {
    const [newExit] = await db
      .insert(stockExits)
      .values(exit)
      .returning();

    for (const item of items) {
      await db.insert(stockExitItems).values({
        ...item,
        exitId: newExit.id,
      });

      // Update material stock
      await this.updateMaterialStock(item.materialId!, item.quantity, 'subtract', exit.owner_id);
    }

    return newExit;
  }

  async getDashboardMetrics(ownerId: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalMaterials] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(eq(materials.owner_id, ownerId));

    const [entriesToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockEntries)
      .where(and(
        eq(stockEntries.owner_id, ownerId),
        sql`${stockEntries.date} >= ${today}`
      ));

    const [exitsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockExits)
      .where(and(
        eq(stockExits.owner_id, ownerId),
        sql`${stockExits.date} >= ${today}`
      ));

    const [criticalItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(and(
        eq(materials.owner_id, ownerId),
        sql`${materials.current_stock} <= ${materials.minimum_stock}`
      ));

    return {
      totalMaterials: totalMaterials.count,
      entriesToday: entriesToday.count,
      exitsToday: exitsToday.count,
      criticalItems: criticalItems.count,
    };
  }

  async getThirdParties(ownerId: number): Promise<ThirdParty[]> {
    const result = await db.select().from(thirdParties).where(eq(thirdParties.owner_id, ownerId));
    return result;
  }

  async createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty> {
    const [result] = await db.insert(thirdParties).values(thirdParty).returning();
    return result;
  }

  async updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, ownerId: number): Promise<ThirdParty | undefined> {
    const [result] = await db
      .update(thirdParties)
      .set(thirdParty)
      .where(and(eq(thirdParties.id, id), eq(thirdParties.owner_id, ownerId)))
      .returning();
    return result;
  }

  async deleteThirdParty(id: number, ownerId: number): Promise<boolean> {
    const result = await db
      .delete(thirdParties)
      .where(and(eq(thirdParties.id, id), eq(thirdParties.owner_id, ownerId)));
    return result.rowCount > 0;
  }

  async getFinancialReport(ownerId: number): Promise<{
    totalStockValue: number;
    totalItems: number;
    highValueItems: number;
    stockItems: (Material & { category: Category | null, totalValue: number })[];
  }> {
    const materialsWithCategory = await this.getMaterialsWithCategory(ownerId);
    
    const stockItems = materialsWithCategory.map(material => ({
      ...material,
      totalValue: parseFloat(material.unit_price || '0') * (material.current_stock || 0)
    }));

    const totalStockValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = stockItems.length;
    const highValueItems = stockItems.filter(item => item.totalValue > 1000).length;

    return {
      totalStockValue,
      totalItems,
      highValueItems,
      stockItems,
    };
  }
}

export const storage = new DatabaseStorage();
