import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import geocodingRoutes from './routes/geocoding.js';
import directionsRoutes from './routes/directions.js';
import { checkStatus } from './controllers/orsController.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (sanitized, no secrets)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url.startsWith('/api')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.get('/api/health', checkStatus);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/directions', directionsRoutes);

// Serve static frontend build if present
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For SPA routing in production
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If dist hasn't been built yet (e.g. running vite dev server)
      res.status(200).send('NAVIBAND API Server is running. Frontend is served by Vite development server on port 5173.');
    }
  });
});

// Central Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`NAVIBAND Backend running on http://localhost:${PORT}`);
  console.log(`OpenRouteService integration ready.`);
});

