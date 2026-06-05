const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { meal_type, note = '', items = [] } = req.body;
    if (!meal_type || !items.length) {
      return res.status(400).json({ error: '缺少餐次或菜品' });
    }

    // Turso 不支持 db.transaction，用顺序执行
    const orderResult = await db.execute({
      sql: 'INSERT INTO orders (meal_type, note) VALUES (?, ?)',
      args: [meal_type, note]
    });
    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      await db.execute({
        sql: 'INSERT INTO order_items (order_id, dish_id, quantity) VALUES (?, ?, ?)',
        args: [orderId, item.dish_id, qty]
      });
    }

    res.json({ id: orderId });
  } catch (e) {
    console.error('POST /api/orders error:', e);
    res.status(500).json({ error: '下单失败' });
  }
});

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const ordersResult = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = ordersResult.rows;

    const result = [];
    for (const order of orders) {
      const itemsResult = await db.execute({
        sql: `SELECT oi.quantity, d.name, d.category, d.image
              FROM order_items oi
              JOIN dishes d ON d.id = oi.dish_id
              WHERE oi.order_id = ?`,
        args: [order.id]
      });
      result.push({ ...order, items: itemsResult.rows });
    }

    res.json(result);
  } catch (e) {
    console.error('GET /api/orders error:', e);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// PUT /api/orders/:id/reply
router.put('/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) return res.status(400).json({ error: '回复内容不能为空' });
    const result = await db.execute({
      sql: 'UPDATE orders SET reply = ?, status = ? WHERE id = ?',
      args: [reply.trim(), 'confirmed', req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: '订单不存在' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '回复失败' });
  }
});

// PUT /api/orders/:id/user-reply
router.put('/:id/user-reply', async (req, res) => {
  try {
    const { user_reply } = req.body;
    if (!user_reply || !user_reply.trim()) return res.status(400).json({ error: '回复内容不能为空' });
    const result = await db.execute({
      sql: 'UPDATE orders SET user_reply = ? WHERE id = ?',
      args: [user_reply.trim(), req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: '订单不存在' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '回复失败' });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'done'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    const result = await db.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: '订单不存在' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

module.exports = router;
