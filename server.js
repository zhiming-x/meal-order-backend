const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/dishes', require('./routes/dishes'));
app.use('/api/orders', require('./routes/orders'));

app.listen(PORT, () => {
  console.log(`后端已启动: http://localhost:${PORT}`);
});
