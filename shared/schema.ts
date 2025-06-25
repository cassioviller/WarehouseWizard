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
  ownerId: integer("owner_id").notNull().default(1), // tenant isolation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department"),
  position: text("position"),
  email: text("email"),
  phone: text("phone"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  unit: text("unit").notNull(), // UN, KG, M, L, etc
  minimumStock: integer("minimum_stock").default(0),
  currentStock: integer("current_stock").default(0),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockEntries = pgTable("stock_entries", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  origin: text("origin").notNull(), // supplier, employee_return, third_party_return
  supplierId: integer("supplier_id").references(() => suppliers.id),
  employeeId: integer("employee_id").references(() => employees.id),
  notes: text("notes"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockEntryItems = pgTable("stock_entry_items", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => stockEntries.id, { onDelete: "cascade" }),
  materialId: integer("material_id").references(() => materials.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  ownerId: integer("owner_id").notNull(),
});

export const stockExits = pgTable("stock_exits", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  destination: text("destination").notNull(), // employee, third_party
  employeeId: integer("employee_id").references(() => employees.id),
  notes: text("notes"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockExitItems = pgTable("stock_exit_items", {
  id: serial("id").primaryKey(),
  exitId: integer("exit_id").references(() => stockExits.id, { onDelete: "cascade" }),
  materialId: integer("material_id").references(() => materials.id),
  quantity: integer("quantity").notNull(),
  purpose: text("purpose").notNull(),
  ownerId: integer("owner_id").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  materials: many(materials),
  categories: many(categories),
  suppliers: many(suppliers),
  employees: many(employees),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  entryItems: many(stockEntryItems),
  exitItems: many(stockExitItems),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  entries: many(stockEntries),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  entries: many(stockEntries),
  exits: many(stockExits),
}));

export const stockEntriesRelations = relations(stockEntries, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [stockEntries.supplierId],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [stockEntries.employeeId],
    references: [employees.id],
  }),
  items: many(stockEntryItems),
}));

export const stockEntryItemsRelations = relations(stockEntryItems, ({ one }) => ({
  entry: one(stockEntries, {
    fields: [stockEntryItems.entryId],
    references: [stockEntries.id],
  }),
  material: one(materials, {
    fields: [stockEntryItems.materialId],
    references: [materials.id],
  }),
}));

export const stockExitsRelations = relations(stockExits, ({ one, many }) => ({
  employee: one(employees, {
    fields: [stockExits.employeeId],
    references: [employees.id],
  }),
  items: many(stockExitItems),
}));

export const stockExitItemsRelations = relations(stockExitItems, ({ one }) => ({
  exit: one(stockExits, {
    fields: [stockExitItems.exitId],
    references: [stockExits.id],
  }),
  material: one(materials, {
    fields: [stockExitItems.materialId],
    references: [materials.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertStockEntrySchema = createInsertSchema(stockEntries).omit({
  id: true,
  createdAt: true,
});

export const insertStockEntryItemSchema = createInsertSchema(stockEntryItems).omit({
  id: true,
});

export const insertStockExitSchema = createInsertSchema(stockExits).omit({
  id: true,
  createdAt: true,
});

export const insertStockExitItemSchema = createInsertSchema(stockExitItems).omit({
  id: true,
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
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type StockEntry = typeof stockEntries.$inferSelect;
export type InsertStockEntry = z.infer<typeof insertStockEntrySchema>;
export type StockEntryItem = typeof stockEntryItems.$inferSelect;
export type InsertStockEntryItem = z.infer<typeof insertStockEntryItemSchema>;
export type StockExit = typeof stockExits.$inferSelect;
export type InsertStockExit = z.infer<typeof insertStockExitSchema>;
export type StockExitItem = typeof stockExitItems.$inferSelect;
export type InsertStockExitItem = z.infer<typeof insertStockExitItemSchema>;
