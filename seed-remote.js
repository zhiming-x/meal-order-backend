const https = require('https');

const BASE = 'https://meal-order-backend.onrender.com';

const dishes = [
  { name: '番茄炒蛋', description: '经典家常菜', category: '荤菜' },
  { name: '茄辣西', description: '茄子辣椒西红柿', category: '素菜' },
  { name: '黄焖鸡', description: '浓郁入味', category: '荤菜' },
  { name: '江西辣排骨', description: '辣得过瘾', category: '荤菜' },
  { name: '玉米排骨汤', description: '清甜养胃', category: '汤' },
  { name: '粥', description: '暖心暖胃', category: '主食' },
  { name: '米饭', description: '粒粒分明', category: '主食' },
  { name: '番茄鸡蛋辣椒炒肉面', description: '一碗满足所有', category: '主食' }
];

// 先清空现有数据
async function deleteAll() {
  const res = await fetch(BASE + '/api/dishes/all');
  const existing = await res.json();
  for (const d of existing) {
    await fetch(BASE + '/api/dishes/' + d.id, { method: 'DELETE' });
  }
  console.log('已清空', existing.length, '条');
}

async function addDishes() {
  for (const d of dishes) {
    const res = await fetch(BASE + '/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    });
    const data = await res.json();
    console.log(`添加: ${d.name} -> id ${data.id}`);
  }
}

async function verify() {
  const res = await fetch(BASE + '/api/dishes');
  const data = await res.json();
  console.log('\n验证:');
  data.forEach(r => console.log(`  ${r.id}. [${r.category}] ${r.name}`));
}

(async () => {
  try {
    await deleteAll();
    await addDishes();
    await verify();
  } catch (e) {
    console.error('错误:', e.message);
  }
})();
