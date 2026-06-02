const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// 双密码配置：从环境变量读取，默认值
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '001024';
const USER_PASSWORD = process.env.USER_PASSWORD || '520';

// 密码 → 角色映射
const ROLE_MAP = {};
ROLE_MAP[generateToken(ADMIN_PASSWORD)] = 'admin';
ROLE_MAP[generateToken(USER_PASSWORD)] = 'user';

function generateToken(password) {
  return crypto.createHash('sha256').update(password + 'meal-order-salt').digest('hex');
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码' });

  const token = generateToken(password);
  const role = ROLE_MAP[token];

  if (role) {
    res.json({ ok: true, token, role });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const role = ROLE_MAP[token];
  if (role) {
    res.json({ ok: true, role });
  } else {
    res.status(401).json({ error: '未登录' });
  }
});

module.exports = router;
