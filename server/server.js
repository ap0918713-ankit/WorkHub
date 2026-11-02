const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 5000;

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

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            success: true,
            message: 'WorkHub API and MySQL are working!'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
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
            return res.status(404).json({
                message: 'Task not found'
            });
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
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        res.json({
            message: 'Task deleted successfully'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`WorkHub server running at http://localhost:${PORT}`);
});