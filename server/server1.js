// Import necessary modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

// Create an Express application instance
const app = express();
const port = 3001; // Choose a port for your backend

// Define a secret key for JWT signing (replace with a strong, unique key in production)
const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // Use environment variable in production

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(bodyParser.json()); // Parse JSON request bodies

// Initialize SQLite database
const db = new sqlite3.Database('./investment_platform.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' -- 'user' or 'admin'
    )`, (createTableErr) => {
      if (createTableErr) {
        console.error('Error creating users table:', createTableErr.message);
      } else {
        console.log('Users table checked/created.');
        // Optional: Insert a default admin user if needed (consider hashing the password)
        // bcrypt.hash('adminpassword123', 10, (hashErr, hashedPassword) => { // Hash a strong password
        //   if (!hashErr) {
        //     db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin'], (insertErr) => {
        //       if (insertErr) {
        //         console.error('Error inserting default admin user:', insertErr.message);
        //       } else {
        //         console.log('Default admin user checked/inserted.');
        //       }
        //     });
        //   } else {
        //     console.error('Error hashing default admin password:', hashErr.message);
        //   }
        // });
      }
    });
  }
});

// Middleware to verify JWT (for protected routes)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer TOKEN" format

  if (token == null) {
    return res.sendStatus(401); // If no token, unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // If token is invalid, forbidden
    }
    req.user = user; // Attach user payload to request object
    next(); // Proceed to the next middleware/route handler
  });
};


// Basic route to check if the server is running
app.get('/', (req, res) => {
  res.send('Investment Platform Backend is running!');
});

// Endpoint for user signup
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      console.error('Error hashing password:', hashErr.message);
      return res.status(500).json({ error: 'Error processing password' });
    }

    const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(insertSql, [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(409).json({ error: 'Username already exists' + username });
        } else {
          console.error('Error inserting user:', err.message);
          res.status(500).json({ error: 'Error registering user' });
        }
        return;
      }
      res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });
  });
});


// Endpoint for user login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const selectSql = 'SELECT * FROM users WHERE username = ?';
  db.get(selectSql, [username], (err, row) => {
    if (err) {
      console.error('Error retrieving user:', err.message);
      res.status(500).json({ error: 'Error during login' });
      return;
    }

    if (!row) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    bcrypt.compare(password, row.password, (compareErr, isMatch) => {
      if (compareErr) {
        console.error('Error comparing passwords:', compareErr.message);
        return res.status(500).json({ error: 'Error during login' });
      }

      if (isMatch) {
        // Passwords match - generate JWT
        const userPayload = { id: row.id, username: row.username, role: row.role };
        const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({ message: 'Login successful', accessToken: accessToken, user: userPayload });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    });
  });
});

// Example of a protected route
// This route can only be accessed by authenticated users with a valid JWT
app.get('/api/dashboard', authenticateJWT, (req, res) => {
  // If the middleware passes, req.user will contain the user payload from the JWT
  res.json({ message: 'Welcome to the dashboard!', user: req.user });
});


// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

// Close the database connection when the app exits
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
