const db = require('./db');

const dishes = [
  { name: '番茄炒蛋', description: '经典家常菜', category: '荤菜' },
  { name: '茄辣西', description: '茄子辣椒西红柿', category: '荤菜' },
  { name: '黄焖鸡', description: '浓郁入味', category: '荤菜' },
  { name: '江西辣排骨', description: '辣得过瘾', category: '荤菜' },
  { name: '玉米排骨汤', description: '清甜养胃', category: '汤' },
  { name: '粥', description: '暖心暖胃', category: '主食' },
  { name: '米饭', description: '粒粒分明', category: '主食' },
  { name: '番茄鸡蛋辣椒炒肉面', description: '一碗满足所有', category: '主食' }
];

const stmt = db.prepare('INSERT INTO dishes (name, description, category) VALUES (?, ?, ?)');
for (const d of dishes) {
  stmt.run(d.name, d.description, d.category);
}

const rows = db.prepare('SELECT id, name, category FROM dishes').all();
console.log('已添加', rows.length, '道菜:');
rows.forEach(r => console.log(`  ${r.id}. [${r.category}] ${r.name}`));
