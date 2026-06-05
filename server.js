const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 等 DB 初始化完成再挂路由
const { initDB } = require('./db');

initDB()
  .then(() => {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/dishes', require('./routes/dishes'));
    app.use('/api/orders', require('./routes/orders'));

    app.use((err, req, res, next) => {
      console.error(err.stack);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: '文件太大，最大 5MB' });
      }
      res.status(500).json({ error: '服务器内部错误' });
    });

    app.listen(PORT, () => {
      console.log(`后端已启动: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });
