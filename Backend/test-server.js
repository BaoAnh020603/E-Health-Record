const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test working!' });
});

app.post('/api/explain-medical-term', (req, res) => {
  res.json({ message: 'Explain medical term working!' });
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
});