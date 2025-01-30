import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import converterRoutes from './routes/converter.js';

// Load environment variables
dotenv.config();
console.log('Environment loaded, NODE_ENV:', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
console.log('CORS middleware enabled');

app.use(express.json());
console.log('JSON parsing middleware enabled');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});

// Routes
app.use('/api', converterRoutes);
console.log('API routes mounted at /api');

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API endpoint: http://localhost:${port}/api`);
  console.log(`Health check: http://localhost:${port}/health`);
});