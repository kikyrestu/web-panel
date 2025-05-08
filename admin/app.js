const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const vpsRoutes = require('./routes/vps');
const webhostingRoutes = require('./routes/webhosting');
const gamehostingRoutes = require('./routes/gamehosting');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

// Import middlewares
const { checkAuth } = require('./middlewares/auth');

// Initialize Express
const app = express();
const PORT = process.env.ADMIN_PORT || 3000;

// Configure session store
const sessionStore = new SequelizeStore({
  db: sequelize
});

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'hosting-bot-admin-secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Create session table
sessionStore.sync();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', checkAuth, dashboardRoutes);
app.use('/vps', checkAuth, vpsRoutes);
app.use('/webhosting', checkAuth, webhostingRoutes);
app.use('/gamehosting', checkAuth, gamehostingRoutes);
app.use('/orders', checkAuth, ordersRoutes);
app.use('/users', checkAuth, usersRoutes);
app.use('/settings', checkAuth, settingsRoutes);

// Home route - redirect to dashboard or login
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error/404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error/500');
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin dashboard running on http://localhost:${PORT}`);
});

module.exports = app;