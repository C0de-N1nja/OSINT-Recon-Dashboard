const express = require("express");
const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const connectDB = require("./config/db");
const authRoutes = require('./routes/authRoutes');
const reconRoutes = require("./routes/reconRoutes");
const scheduler = require('./utils/scheduler');

// Passport Config
require('./config/passport')(passport);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Express Session Middleware (required for Passport Google strategy)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Static Folder & View Engine
app.use(express.static("public"));
app.set("view engine", "ejs");

// Connect to Database and Start Scheduler
connectDB();
scheduler.start();

// Routes
app.use('/auth', authRoutes);
app.use('/', reconRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));