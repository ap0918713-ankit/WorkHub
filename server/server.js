const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from server/.env');
}

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'workhub_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10
});
// User Signup API
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            userId: result.insertId
        });

    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({
            message: 'Server error during signup'
        });
    }
});
// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            success: true,
            message: 'WorkHub API and MySQL are working!'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// SIGNUP API
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2) {
            return res.status(400).json({
                message: 'Name must contain at least 2 characters'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [cleanName, cleanEmail, hashedPassword]
        );

        const token = jwt.sign(
            { id: result.insertId, email: cleanEmail },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail
            }
        });

    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({
            message: 'Unable to create account'
        });
    }
});
// User Login API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({
            message: 'Server error during login'
        });
    }
});

// LOGIN API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({
            message: 'Unable to login'
        });
    }
});

// Get All Tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const [tasks] = await db.query(
            'SELECT * FROM tasks ORDER BY id DESC'
        );
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Task
app.post('/api/tasks', async (req, res) => {
    try {
        const title = req.body.title?.trim();

        if (!title) {
            return res.status(400).json({
                message: 'Task title is required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (title, completed) VALUES (?, ?)',
            [title, false]
        );

        const [rows] = await db.query(
            'SELECT * FROM tasks WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Task
app.patch('/api/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        if (typeof req.body.completed !== 'boolean') {
            return res.status(400).json({
                message: 'Completed must be true or false'
            });
        }

        const [result] = await db.query(
            'UPDATE tasks SET completed = ? WHERE id = ?',
            [req.body.completed, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const [rows] = await db.query(
            'SELECT * FROM tasks WHERE id = ?',
            [id]
        );

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const [result] = await db.query(
            'DELETE FROM tasks WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`WorkHub server running at http://localhost:${PORT}`);
});
