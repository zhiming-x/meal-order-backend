const { createClient } = require('@libsql/client');

// 优先使用 Turso 云数据库，否则用本地 SQLite
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

const db = createClient(
  TURSO_URL
    ? { url: TURSO_URL, authToken: TURSO_TOKEN }
    : { url: 'file:meal.db' }
);

// 初始化表结构
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '荤菜',
      image TEXT DEFAULT '',
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_type TEXT NOT NULL,
      note TEXT DEFAULT '',
      reply TEXT DEFAULT '',
      user_reply TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1
    )
  `);
}

// 初始化并导出
module.exports = db;
module.exports.initDB = initDB;
