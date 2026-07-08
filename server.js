const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const insightsRoutes = require('./routes/insights');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api', insightsRoutes);
app.get('/api/test', (req, res) => {
  res.json({ message: 'Smart Spend AI server is running!' });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});