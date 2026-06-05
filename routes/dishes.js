const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只能上传图片'));
  }
});

// GET /api/dishes
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let result;
    if (category) {
      result = await db.execute({
        sql: 'SELECT * FROM dishes WHERE available = 1 AND category = ? ORDER BY id',
        args: [category]
      });
    } else {
      result = await db.execute('SELECT * FROM dishes WHERE available = 1 ORDER BY id');
    }
    res.json(result.rows);
  } catch (e) {
    console.error('GET /api/dishes error:', e);
    res.status(500).json({ error: '获取菜品失败' });
  }
});

// GET /api/dishes/all
router.get('/all', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM dishes ORDER BY id');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: '获取菜品失败' });
  }
});

// POST /api/dishes
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description = '', category = '荤菜' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '菜名不能为空' });
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const result = await db.execute({
      sql: 'INSERT INTO dishes (name, description, category, image) VALUES (?, ?, ?, ?)',
      args: [name.trim(), description, category, image]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e) {
    console.error('POST /api/dishes error:', e);
    res.status(500).json({ error: '添加菜品失败' });
  }
});

// PUT /api/dishes/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, category, available } = req.body;
    const existing = await db.execute({
      sql: 'SELECT * FROM dishes WHERE id = ?',
      args: [req.params.id]
    });
    if (!existing.rows.length) return res.status(404).json({ error: '菜品不存在' });

    const dish = existing.rows[0];
    const image = req.file ? `/uploads/${req.file.filename}` : dish.image;
    await db.execute({
      sql: 'UPDATE dishes SET name = ?, description = ?, category = ?, image = ?, available = ? WHERE id = ?',
      args: [name ?? dish.name, description ?? dish.description, category ?? dish.category, image, available ?? dish.available, req.params.id]
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/dishes/:id error:', e);
    res.status(500).json({ error: '更新菜品失败' });
  }
});

// POST /api/dishes/:id/image
router.post('/:id/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '没有图片' });
    const image = `/uploads/${req.file.filename}`;
    const result = await db.execute({
      sql: 'UPDATE dishes SET image = ? WHERE id = ?',
      args: [image, req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: '菜品不存在' });
    res.json({ ok: true, image });
  } catch (e) {
    res.status(500).json({ error: '上传图片失败' });
  }
});

// DELETE /api/dishes/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM dishes WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/dishes error:', e);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
