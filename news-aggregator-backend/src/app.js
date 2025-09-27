const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require('./routes/articleRoutes');
const factCheckRoutes = require('./routes/factCheckRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const communityRoutes = require('./routes/communityRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const voteRoutes = require("./routes/voteRoutes");
const annotationRoutes = require("./routes/annotationRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://news-aggregator-gules.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove any undefined values
    
    console.log('🔍 CORS check for origin:', origin);
    
    // Remove trailing slashes for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check exact matches first
    const isExactMatch = allowedOrigins.some(allowedOrigin => {
      const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin;
    });
    
    // Check if it's a Vercel preview deployment (more permissive)
    const isVercelPreview = normalizedOrigin.includes('vercel.app') && 
                           (normalizedOrigin.includes('news-aggregator') || 
                            normalizedOrigin.includes('karthik-nambiars-projects'));
    
    if (isExactMatch || isVercelPreview) {
      console.log('✅ CORS allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      console.log('Is Vercel preview?', isVercelPreview);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Root route for wake-up pings
app.get('/', (req, res) => {
  res.json({ 
    message: 'News Aggregator Backend is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple wake-up endpoint (no auth needed)
app.get('/wake-up', (req, res) => {
  res.json({ 
    message: 'Backend is awake!',
    status: 'awake',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/health', healthRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/factchecks', factCheckRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/annotations", annotationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/articles',
      'GET /api/community/leaderboard',
      'GET /api/sources'
    ]
  });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
