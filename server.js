const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// ✅ Use dynamic port for Render
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Root route for testing on Render
app.get('/', (req, res) => {
  res.send('✅ Backend is live on Render!');
});

// Connect to SQLite DB
const db = new sqlite3.Database('./users.db');

// Create the users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    username TEXT,
    mobile TEXT,
    address TEXT,
    social TEXT
  )
`);

// Register route
app.post('/register', (req, res) => {
  const { name, email, password, username, mobile, address, social } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const query = `
    INSERT INTO users (name, email, password, username, mobile, address, social)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, email, password, username, mobile, address, social], function (err) {
    if (err) {
      console.error('SQLite Error:', err.message);
      if (err.message.includes('UNIQUE constraint failed: users.email')) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }
      return res.status(400).json({ message: 'Registration failed due to a server error.' });
    }
    res.json({ message: 'User registered successfully.' });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Login error' });
    }
    if (!row) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful' });
  });
});

// Get profile by email
app.get('/user/:email', (req, res) => {
  const email = req.params.email;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Error fetching user' });
    }
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json(row);
  });
});

// Update profile
app.put('/user/:email', (req, res) => {
  const email = req.params.email;
  const { name, password, username, mobile, address, social } = req.body;

  db.run(
    `UPDATE users SET 
      name = ?, password = ?, username = ?, 
      mobile = ?, address = ?, social = ?
    WHERE email = ?`,
    [name, password, username, mobile, address, social, email],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Update failed' });
      }
      res.json({ message: 'Profile updated successfully.' });
    }
  );
});

// Delete profile
app.delete('/user/:email', (req, res) => {
  const email = req.params.email;

  db.run(`DELETE FROM users WHERE email = ?`, [email], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Error deleting user' });
    }
    if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully.' });
  });
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
