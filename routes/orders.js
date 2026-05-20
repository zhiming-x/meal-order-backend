const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/orders — 创建订单
router.post('/', (req, res) => {
  const { meal_type, note = '', items = [] } = req.body;
  if (!meal_type || !items.length) {
    return res.status(400).json({ error: '缺少餐次或菜品' });
  }

  const insertOrder = db.prepare(
    'INSERT INTO orders (meal_type, note) VALUES (?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, dish_id, quantity) VALUES (?, ?, ?)'
  );

  const txn = db.transaction(() => {
    const info = insertOrder.run(meal_type, note);
    const orderId = info.lastInsertRowid;
    for (const item of items) {
      insertItem.run(orderId, item.dish_id, item.quantity || 1);
    }
    return orderId;
  });

  const orderId = txn();
  res.json({ id: orderId });
});

// GET /api/orders — 历史订单（含菜品详情）
router.get('/', (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders ORDER BY created_at DESC'
  ).all();

  const getItems = db.prepare(`
    SELECT oi.quantity, d.name, d.category, d.image
    FROM order_items oi
    JOIN dishes d ON d.id = oi.dish_id
    WHERE oi.order_id = ?
  `);

  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id)
  }));

  res.json(result);
});

// PUT /api/orders/:id/reply — 男友回复
router.put('/:id/reply', (req, res) => {
  const { reply } = req.body;
  db.prepare('UPDATE orders SET reply = ?, status = ? WHERE id = ?')
    .run(reply, 'confirmed', req.params.id);
  res.json({ ok: true });
});

// PUT /api/orders/:id/status — 更新状态
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?')
    .run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
