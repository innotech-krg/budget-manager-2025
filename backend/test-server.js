// Minimaler Test-Server um das Problem zu identifizieren
import express from 'express';

console.log('🚀 Starting minimal test server...');

const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
  res.json({ status: 'OK', message: 'Test server works' });
});

console.log('✅ Express app created');

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

console.log('✅ Server started successfully');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});






