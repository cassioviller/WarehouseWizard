import fs from 'fs';

// Read the storage.ts file
let content = fs.readFileSync('server/storage.ts', 'utf8');

// Fix field naming issues systematically
const replacements = [
  // Fix function parameter names - most critical
  ['ownerId: number', 'owner_id: number'],
  ['materialId: number', 'material_id: number'],
  ['ownerId)', 'owner_id)'],
  ['materialId)', 'material_id)'],
  ['ownerId,', 'owner_id,'],
  ['materialId,', 'material_id,'],
  
  // Fix variable references
  ['ownerId;', 'owner_id;'],
  ['materialId;', 'material_id;'],
  
  // Fix property access in return statements
  ['item.materialId', 'item.material_id'],
  ['entry.ownerId', 'entry.owner_id'],
  ['exit.ownerId', 'exit.owner_id'],
  
  // Fix field references that don't exist in schema
  ['destination', 'purpose'],
  
  // Fix null check
  ['result.rowCount', '(result.rowCount ?? 0)'],
];

// Apply all replacements
replacements.forEach(([from, to]) => {
  content = content.replaceAll(from, to);
});

// Write back the fixed content
fs.writeFileSync('server/storage.ts', content);
console.log('Fixed storage.ts field naming issues');