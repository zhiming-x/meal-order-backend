const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

// 确保 uploads 目录存在
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

// GET /api/dishes — 列表（支持 ?category=荤菜 筛选）
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = db.prepare('SELECT * FROM dishes WHERE available = 1 AND category = ? ORDER BY id').all(category);
    } else {
      rows = db.prepare('SELECT * FROM dishes WHERE available = 1 ORDER BY id').all();
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: '获取菜品失败' });
  }
});

// GET /api/dishes/all — 管理用，含不可用的
router.get('/all', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM dishes ORDER BY id').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: '获取菜品失败' });
  }
});

// POST /api/dishes — 新增
router.post('/', upload.single('image'), (req, res) => {
  try {
    const { name, description = '', category = '荤菜' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '菜名不能为空' });
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const info = db.prepare(
      'INSERT INTO dishes (name, description, category, image) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), description, category, image);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: '添加菜品失败' });
  }
});

// PUT /api/dishes/:id — 修改
router.put('/:id', upload.single('image'), (req, res) => {
  try {
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
  } catch (e) {
    res.status(500).json({ error: '更新菜品失败' });
  }
});

// POST /api/dishes/:id/image — 上传/更新图片
router.post('/:id/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '没有图片' });
    const image = `/uploads/${req.file.filename}`;
    const info = db.prepare('UPDATE dishes SET image = ? WHERE id = ?').run(image, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: '菜品不存在' });
    res.json({ ok: true, image });
  } catch (e) {
    res.status(500).json({ error: '上传图片失败' });
  }
});

// DELETE /api/dishes/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM dishes WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
