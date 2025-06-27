import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // user, admin, super_admin
  owner_id: integer("owner_id").notNull().default(1), // tenant isolation
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  is_active: boolean("is_active").notNull().default(true),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("isActive").notNull().default(true),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document"),
  document_type: text("document_type").default("CPF"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  is_active: boolean("is_active").notNull().default(true),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category_id: integer("category_id").references(() => categories.id),
  current_stock: integer("current_stock").notNull().default(0),
  minimum_stock: integer("minimum_stock").notNull().default(0),
  unit: text("unit").notNull().default("unidade"),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"),
  last_supplier_id: integer("last_supplier_id").references(() => suppliers.id),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Unified material movements table
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'entry' or 'exit'
  date: timestamp("date").notNull(),
  user_id: integer("user_id").notNull(),
  
  // For entries
  origin_type: text("origin_type"), // 'supplier', 'employee_return', 'third_party_return'
  supplier_id: integer("supplier_id"),
  return_employee_id: integer("return_employee_id"),
  return_third_party_id: integer("return_third_party_id"),
  
  // For exits
  destination_type: text("destination_type"), // 'employee', 'third_party'
  employee_id: integer("employee_id"),
  third_party_id: integer("third_party_id"),
  
  // Items (JSON array)
  items: text("items").notNull(), // JSON string
  
  // General info
  description: text("description"),
  total_value: decimal("total_value", { precision: 12, scale: 2 }).default("0.00"),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  action: text("action").notNull(),
  table_name: text("table_name"),
  record_id: integer("record_id"),
  old_values: text("old_values"), // JSON string
  new_values: text("new_values"), // JSON string
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Legacy tables for backward compatibility
export const stockEntries = pgTable("stock_entries", {
  id: serial("id").primaryKey(),
  supplier_id: integer("supplier_id").references(() => suppliers.id),
  employee_id: integer("employee_id").references(() => employees.id),
  total_value: decimal("total_value", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockEntryItems = pgTable("stock_entry_items", {
  id: serial("id").primaryKey(),
  stock_entry_id: integer("stock_entry_id").references(() => stockEntries.id, { onDelete: "cascade" }),
  material_id: integer("material_id").references(() => materials.id),
  quantity: integer("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockExits = pgTable("stock_exits", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => employees.id),
  purpose: text("purpose"),
  notes: text("notes"),
  owner_id: integer("owner_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockExitItems = pgTable("stock_exit_items", {
  id: serial("id").primaryKey(),
  stock_exit_id: integer("stock_exit_id").references(() => stockExits.id, { onDelete: "cascade" }),
  material_id: integer("material_id").references(() => materials.id),
  quantity: integer("quantity").notNull(),
  purpose: text("purpose"),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  suppliers: many(suppliers),
  employees: many(employees),
  materials: many(materials),
  movements: many(materialMovements),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.category_id],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [materials.last_supplier_id],
    references: [suppliers.id],
  }),
  stockEntryItems: many(stockEntryItems),
  stockExitItems: many(stockExitItems),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
  stockEntries: many(stockEntries),
  movements: many(materialMovements),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  stockEntries: many(stockEntries),
  stockExits: many(stockExits),
  movements: many(materialMovements),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ many }) => ({
  movements: many(materialMovements),
}));

export const stockEntriesRelations = relations(stockEntries, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [stockEntries.supplier_id],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [stockEntries.employee_id],
    references: [employees.id],
  }),
  items: many(stockEntryItems),
}));

export const stockEntryItemsRelations = relations(stockEntryItems, ({ one }) => ({
  stockEntry: one(stockEntries, {
    fields: [stockEntryItems.stock_entry_id],
    references: [stockEntries.id],
  }),
  material: one(materials, {
    fields: [stockEntryItems.material_id],
    references: [materials.id],
  }),
}));

export const stockExitsRelations = relations(stockExits, ({ one, many }) => ({
  employee: one(employees, {
    fields: [stockExits.employee_id],
    references: [employees.id],
  }),
  items: many(stockExitItems),
}));

export const stockExitItemsRelations = relations(stockExitItems, ({ one }) => ({
  stockExit: one(stockExits, {
    fields: [stockExitItems.stock_exit_id],
    references: [stockExits.id],
  }),
  material: one(materials, {
    fields: [stockExitItems.material_id],
    references: [materials.id],
  }),
}));

export const materialMovementsRelations = relations(materialMovements, ({ one }) => ({
  user: one(users, {
    fields: [materialMovements.user_id],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [materialMovements.supplier_id],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [materialMovements.employee_id],
    references: [employees.id],
  }),
  thirdParty: one(thirdParties, {
    fields: [materialMovements.third_party_id],
    references: [thirdParties.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.user_id],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
}).extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  created_at: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  created_at: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  created_at: true,
});

export const insertThirdPartySchema = createInsertSchema(thirdParties).omit({
  id: true,
  created_at: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  created_at: true,
});

export const insertMaterialMovementSchema = createInsertSchema(materialMovements).omit({
  id: true,
  created_at: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  created_at: true,
});

export const insertStockEntrySchema = createInsertSchema(stockEntries).omit({
  id: true,
  created_at: true,
});

export const insertStockEntryItemSchema = createInsertSchema(stockEntryItems).omit({
  id: true,
  created_at: true,
});

export const insertStockExitSchema = createInsertSchema(stockExits).omit({
  id: true,
  created_at: true,
});

export const insertStockExitItemSchema = createInsertSchema(stockExitItems).omit({
  id: true,
  created_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type ThirdParty = typeof thirdParties.$inferSelect;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type MaterialMovement = typeof materialMovements.$inferSelect;
export type InsertMaterialMovement = z.infer<typeof insertMaterialMovementSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type StockEntry = typeof stockEntries.$inferSelect;
export type InsertStockEntry = z.infer<typeof insertStockEntrySchema>;
export type StockEntryItem = typeof stockEntryItems.$inferSelect;
export type InsertStockEntryItem = z.infer<typeof insertStockEntryItemSchema>;
export type StockExit = typeof stockExits.$inferSelect;
export type InsertStockExit = z.infer<typeof insertStockExitSchema>;
export type StockExitItem = typeof stockExitItems.$inferSelect;
export type InsertStockExitItem = z.infer<typeof insertStockExitItemSchema>;