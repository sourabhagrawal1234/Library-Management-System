const dns = require('node:dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Razorpay webhook needs the raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/fines', require('./routes/fineRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Library Management System API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

let server;
let retryCount = 0;
const MAX_RETRIES = 5;

const startServer = () => {
  server = app.listen(PORT, async () => {
    console.log(`🚀 LMS Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    try {
      const { syncReservationStatuses } = require('./controllers/reservationController');
      await syncReservationStatuses();
      console.log('🔖 Reservation queues automatically synchronized.');
    } catch (syncErr) {
      console.error('Reservation sync warning on boot:', syncErr.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        try {
          const { execSync } = require('child_process');
          const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
          const lines = output.trim().split('\n');
          for (const line of lines) {
            if (line.includes('LISTENING')) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && pid !== process.pid.toString() && pid !== '0') {
                try {
                  execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                  console.log(`⚡ Freed port ${PORT} from PID ${pid}. Retrying (${retryCount}/${MAX_RETRIES})...`);
                } catch (_) {}
              }
            }
          }
        } catch (_) {}

        setTimeout(() => {
          try {
            server.close();
          } catch (_) {}
          startServer();
        }, 1000);
        return;
      }

      console.error(`\n❌ Error: Port ${PORT} could not be freed after ${MAX_RETRIES} attempts.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

module.exports = app;
