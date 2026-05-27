const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// 密码从环境变量读取，默认 5201314
const PASSWORD = process.env.APP_PASSWORD || '001024';

// 简单 token 生成（密码的 sha256）
function generateToken(password) {
  return crypto.createHash('sha256').update(password + 'meal-order-salt').digest('hex');
}

const VALID_TOKEN = generateToken(PASSWORD);

// POST /api/auth/login — 验证密码
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码' });

  if (generateToken(password) === VALID_TOKEN) {
    res.json({ ok: true, token: VALID_TOKEN });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// GET /api/auth/verify — 验证 token 是否有效
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === VALID_TOKEN) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: '未登录' });
  }
});

module.exports = router;
