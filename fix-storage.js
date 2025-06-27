import fs from 'fs';

// Read the storage.ts file
let content = fs.readFileSync('server/storage.ts', 'utf8');

// Fix field naming issues systematically
const replacements = [
  // Replace camelCase with snake_case in select statements
  ['categoryId:', 'category_id:'],
  ['minimumStock:', 'minimum_stock:'],
  ['unitPrice:', 'unit_price:'],
  ['ownerId:', 'owner_id:'],
  ['createdAt:', 'created_at:'],
  ['supplierId:', 'supplier_id:'],
  ['employeeId:', 'employee_id:'],
  ['materialId:', 'material_id:'],
  
  // Fix property access in return statements
  ['materialId}', 'material_id}'],
  ['item.materialId', 'item.material_id'],
  ['entry.ownerId', 'entry.owner_id'],
  ['exit.ownerId', 'exit.owner_id'],
  
  // Fix object property assignments
  ['entryId:', 'stock_entry_id:'],
  ['exitId:', 'stock_exit_id:'],
  
  // Fix field references that don't exist in schema
  ['stockEntries.date', 'stockEntries.created_at'],
  ['stockEntries.origin', 'stockEntries.notes'],
  ['stockExits.date', 'stockExits.created_at'],
  ['stockExits.destination', 'stockExits.purpose'],
  
  // Fix function parameter names
  ['materialId: number', 'material_id: number'],
  ['materialId,', 'material_id,'],
  
  // Fix duplicate field references
  ['notes: stockEntries.notes,\n        supplier_id: stockEntries.supplier_id,\n        employee_id: stockEntries.employee_id,\n        total_value: stockEntries.total_value,\n        owner_id: stockEntries.owner_id,\n        created_at: stockEntries.created_at,', 'notes: stockEntries.notes,\n        supplier_id: stockEntries.supplier_id,\n        employee_id: stockEntries.employee_id,\n        total_value: stockEntries.total_value,\n        owner_id: stockEntries.owner_id,\n        created_at: stockEntries.created_at,']
];

// Apply all replacements
replacements.forEach(([from, to]) => {
  content = content.replaceAll(from, to);
});

// Write back the fixed content
fs.writeFileSync('server/storage.ts', content);
console.log('Fixed storage.ts field naming issues');