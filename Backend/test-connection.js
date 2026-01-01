// Simple test to check if server is accessible
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is working!',
    timestamp: new Date().toISOString(),
    message: 'Connection successful from mobile app'
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    ip: req.ip,
    headers: req.headers
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://192.168.1.172:${PORT}`);
  console.log(`\n📱 Test from your phone browser:`);
  console.log(`   Go to: http://192.168.1.172:${PORT}`);
  console.log(`   You should see: "Server is working!"`);
});