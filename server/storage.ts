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
  getThirdParties(owner_id: number): Promise<ThirdParty[]>;
  createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty>;
  updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, owner_id: number): Promise<ThirdParty | undefined>;
  deleteThirdParty(id: number, owner_id: number): Promise<boolean>;
  
  // Category methods
  getCategories(owner_id: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, owner_id: number): Promise<Category | undefined>;
  deleteCategory(id: number, owner_id: number): Promise<boolean>;
  
  // Supplier methods
  getSuppliers(owner_id: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>, owner_id: number): Promise<Supplier | undefined>;
  deleteSupplier(id: number, owner_id: number): Promise<boolean>;
  
  // Employee methods
  getEmployees(owner_id: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, owner_id: number): Promise<Employee | undefined>;
  deleteEmployee(id: number, owner_id: number): Promise<boolean>;
  
  // Material methods
  getMaterials(owner_id: number): Promise<Material[]>;
  getMaterialsWithCategory(owner_id: number): Promise<(Material & { category: Category | null })[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>, owner_id: number): Promise<Material | undefined>;
  deleteMaterial(id: number, owner_id: number): Promise<boolean>;
  updateMaterialStock(material_id: number, quantity: number, operation: 'add' | 'subtract', owner_id: number): Promise<void>;
  
  // Stock Entry methods
  getStockEntries(owner_id: number): Promise<(StockEntry & { supplier: Supplier | null, employee: Employee | null })[]>;
  createStockEntry(entry: InsertStockEntry, items: InsertStockEntryItem[]): Promise<StockEntry>;
  
  // Stock Exit methods
  getStockExits(owner_id: number): Promise<(StockExit & { employee: Employee | null })[]>;
  createStockExit(exit: InsertStockExit, items: InsertStockExitItem[]): Promise<StockExit>;
  
  // Dashboard metrics
  getDashboardMetrics(owner_id: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }>;
  
  // Financial reports
  getFinancialReport(owner_id: number): Promise<{
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
      pool,
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
    return ((result.rowCount ?? 0) || 0) > 0;
  }

  async getCategories(owner_id: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.owner_id, owner_id));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, owner_id: number): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.owner_id, owner_id)))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number, owner_id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.owner_id, owner_id)));
    return ((result.rowCount ?? 0) || 0) > 0;
  }

  async getSuppliers(owner_id: number): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.owner_id, owner_id));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>, owner_id: number): Promise<Supplier | undefined> {
    const [updated] = await db
      .update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.owner_id, owner_id)))
      .returning();
    return updated || undefined;
  }

  async deleteSupplier(id: number, owner_id: number): Promise<boolean> {
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.owner_id, owner_id)));
    return ((result.rowCount ?? 0) || 0) > 0;
  }

  async getEmployees(owner_id: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.owner_id, owner_id));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>, owner_id: number): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set(employee)
      .where(and(eq(employees.id, id), eq(employees.owner_id, owner_id)))
      .returning();
    return updated || undefined;
  }

  async deleteEmployee(id: number, owner_id: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.owner_id, owner_id)));
    return ((result.rowCount ?? 0) || 0) > 0;
  }

  async getMaterials(owner_id: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.owner_id, owner_id));
  }

  async getMaterialsWithCategory(owner_id: number): Promise<(Material & { category: Category | null })[]> {
    const result = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        category_id: materials.category_id,
        unit: materials.unit,
        minimum_stock: materials.minimum_stock,
        current_stock: materials.current_stock,
        unit_price: materials.unit_price,
        owner_id: materials.owner_id,
        created_at: materials.created_at,
        category: categories,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.category_id, categories.id))
      .where(eq(materials.owner_id, owner_id));
    
    return result as (Material & { category: Category | null })[];
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>, owner_id: number): Promise<Material | undefined> {
    const [updated] = await db
      .update(materials)
      .set(material)
      .where(and(eq(materials.id, id), eq(materials.owner_id, owner_id)))
      .returning();
    return updated || undefined;
  }

  async deleteMaterial(id: number, owner_id: number): Promise<boolean> {
    const result = await db
      .delete(materials)
      .where(and(eq(materials.id, id), eq(materials.owner_id, owner_id)));
    return ((result.rowCount ?? 0) || 0) > 0;
  }

  async updateMaterialStock(material_id: number, quantity: number, operation: 'add' | 'subtract', owner_id: number): Promise<void> {
    const increment = operation === 'add' ? quantity : -quantity;
    await db
      .update(materials)
      .set({
        current_stock: sql`${materials.current_stock} + ${increment}`
      })
      .where(and(eq(materials.id, material_id), eq(materials.owner_id, owner_id)));
  }

  async getStockEntries(owner_id: number): Promise<(StockEntry & { supplier: Supplier | null, employee: Employee | null })[]> {
    const result = await db
      .select({
        id: stockEntries.id,
        notes: stockEntries.notes,
        supplier_id: stockEntries.supplier_id,
        employee_id: stockEntries.employee_id,
        total_value: stockEntries.total_value,
        owner_id: stockEntries.owner_id,
        created_at: stockEntries.created_at,
        supplier: suppliers,
        employee: employees,
      })
      .from(stockEntries)
      .leftJoin(suppliers, eq(stockEntries.supplier_id, suppliers.id))
      .leftJoin(employees, eq(stockEntries.employee_id, employees.id))
      .where(eq(stockEntries.owner_id, owner_id))
      .orderBy(desc(stockEntries.created_at));
    
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
        stock_entry_id: newEntry.id,
      });

      // Update material stock
      await this.updateMaterialStock(item.material_id!, item.quantity, 'add', entry.owner_id);
    }

    return newEntry;
  }

  async getStockExits(owner_id: number): Promise<(StockExit & { employee: Employee | null })[]> {
    const result = await db
      .select({
        id: stockExits.id,
        purpose: stockExits.purpose,
        employee_id: stockExits.employee_id,
        notes: stockExits.notes,
        owner_id: stockExits.owner_id,
        created_at: stockExits.created_at,
        employee: employees,
      })
      .from(stockExits)
      .leftJoin(employees, eq(stockExits.employee_id, employees.id))
      .where(eq(stockExits.owner_id, owner_id))
      .orderBy(desc(stockExits.created_at));
    
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
        stock_exit_id: newExit.id,
      });

      // Update material stock
      await this.updateMaterialStock(item.material_id!, item.quantity, 'subtract', exit.owner_id);
    }

    return newExit;
  }

  async getDashboardMetrics(owner_id: number): Promise<{
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
      .where(eq(materials.owner_id, owner_id));

    const [entriesToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockEntries)
      .where(and(
        eq(stockEntries.owner_id, owner_id),
        sql`${stockEntries.created_at} >= ${today}`
      ));

    const [exitsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockExits)
      .where(and(
        eq(stockExits.owner_id, owner_id),
        sql`${stockExits.created_at} >= ${today}`
      ));

    const [criticalItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(and(
        eq(materials.owner_id, owner_id),
        sql`${materials.current_stock} <= ${materials.minimum_stock}`
      ));

    return {
      totalMaterials: totalMaterials.count,
      entriesToday: entriesToday.count,
      exitsToday: exitsToday.count,
      criticalItems: criticalItems.count,
    };
  }

  async getThirdParties(owner_id: number): Promise<ThirdParty[]> {
    const result = await db.select().from(thirdParties).where(eq(thirdParties.owner_id, owner_id));
    return result;
  }

  async createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty> {
    const [result] = await db.insert(thirdParties).values(thirdParty).returning();
    return result;
  }

  async updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, owner_id: number): Promise<ThirdParty | undefined> {
    const [result] = await db
      .update(thirdParties)
      .set(thirdParty)
      .where(and(eq(thirdParties.id, id), eq(thirdParties.owner_id, owner_id)))
      .returning();
    return result;
  }

  async deleteThirdParty(id: number, owner_id: number): Promise<boolean> {
    const result = await db
      .delete(thirdParties)
      .where(and(eq(thirdParties.id, id), eq(thirdParties.owner_id, owner_id)));
    return (result.rowCount ?? 0) > 0;
  }

  async getFinancialReport(owner_id: number): Promise<{
    totalStockValue: number;
    totalItems: number;
    highValueItems: number;
    stockItems: (Material & { category: Category | null, totalValue: number })[];
  }> {
    const materialsWithCategory = await this.getMaterialsWithCategory(owner_id);
    
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
