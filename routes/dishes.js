const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage });

// GET /api/dishes — 列表（支持 ?category=荤菜 筛选）
router.get('/', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM dishes WHERE available = 1 AND category = ? ORDER BY id').all(category);
  } else {
    rows = db.prepare('SELECT * FROM dishes WHERE available = 1 ORDER BY id').all();
  }
  res.json(rows);
});

// GET /api/dishes/all — 管理用，含不可用的
router.get('/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM dishes ORDER BY id').all();
  res.json(rows);
});

// POST /api/dishes — 新增
router.post('/', upload.single('image'), (req, res) => {
  const { name, description = '', category = '荤菜' } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';
  const info = db.prepare(
    'INSERT INTO dishes (name, description, category, image) VALUES (?, ?, ?, ?)'
  ).run(name, description, category, image);
  res.json({ id: info.lastInsertRowid });
});

// PUT /api/dishes/:id — 修改
router.put('/:id', upload.single('image'), (req, res) => {
  const { name, description, category, available } = req.body;
  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(req.params.id);
  if (!dish) return res.status(404).json({ error: '菜品不存在' });

  const image = req.file ? `/uploads/${req.file.filename}` : dish.image;
  db.prepare(
    'UPDATE dishes SET name = ?, description = ?, category = ?, image = ?, available = ? WHERE id = ?'
  ).run(
    name ?? dish.name,
    description ?? dish.description,
    category ?? dish.category,
    image,
    available ?? dish.available,
    req.params.id
  );
  res.json({ ok: true });
});

// DELETE /api/dishes/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM dishes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
