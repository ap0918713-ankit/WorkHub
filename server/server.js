const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Check JWT Secret
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from server/.env");
}

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "workhub_db",
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user;
        next();
    });
}

// Validate Date
function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

// Health Check
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "WorkHub API and MySQL are working!"
        });
    } catch (err) {
        console.error("Database error:", err.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// SIGNUP API
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (
            !cleanName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                message: "Please enter a valid name and email"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [cleanName, cleanEmail, hashedPassword]
        );

        const token = jwt.sign(
            {
                id: result.insertId,
                email: cleanEmail
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail
            }
        });

    } catch (err) {
        console.error("Signup error:", err.message);

        res.status(500).json({
            message: "Unable to create account"
        });
    }
});

// LOGIN API
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login error:", err.message);

        res.status(500).json({
            message: "Unable to login"
        });
    }
});

// GET LOGGED-IN USER
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(users[0]);

    } catch (err) {
        console.error("User fetch error:", err.message);

        res.status(500).json({
            message: "Unable to fetch user"
        });
    }
});

// GET USER TASKS
app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const [tasks] = await db.query(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC",
            [req.user.id]
        );

        res.json(tasks);

    } catch (err) {
        console.error("Fetch tasks error:", err.message);

        res.status(500).json({
            message: "Unable to fetch tasks"
        });
    }
});

// ADD TASK
app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const title =
            typeof req.body.title === "string"
                ? req.body.title.trim()
                : "";

        const priority = req.body.priority || "Medium";
        const dueDate = req.body.due_date || null;

        if (!title) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority"
            });
        }

        if (dueDate !== null && !isValidDate(dueDate)) {
            return res.status(400).json({
                message: "Due date must be YYYY-MM-DD"
            });
        }

        const [result] = await db.query(
            `INSERT INTO tasks
            (title, completed, user_id, priority, due_date)
            VALUES (?, ?, ?, ?, ?)`,
            [title, false, req.user.id, priority, dueDate]
        );

        const [rows] = await db.query(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [result.insertId, req.user.id]
        );

        res.status(201).json(rows[0]);

    } catch (err) {
        console.error("Add task error:", err.message);

        res.status(500).json({
            message: "Unable to add task"
        });
    }
});

// UPDATE TASK
app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        const allowedFields = [];

        if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
            if (typeof req.body.completed !== "boolean") {
                return res.status(400).json({
                    message: "Completed must be true or false"
                });
            }

            allowedFields.push(["completed", req.body.completed]);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
            if (
                typeof req.body.title !== "string" ||
                !req.body.title.trim()
            ) {
                return res.status(400).json({
                    message: "Invalid task title"
                });
            }

            allowedFields.push(["title", req.body.title.trim()]);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "priority")) {
            if (!["High", "Medium", "Low"].includes(req.body.priority)) {
                return res.status(400).json({
                    message: "Invalid priority"
                });
            }

            allowedFields.push(["priority", req.body.priority]);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "due_date")) {
            const dueDate = req.body.due_date;

            if (dueDate !== null && !isValidDate(dueDate)) {
                return res.status(400).json({
                    message: "Invalid due date"
                });
            }

            allowedFields.push(["due_date", dueDate]);
        }

        if (allowedFields.length === 0) {
            return res.status(400).json({
                message: "No valid fields provided"
            });
        }

        const setClause = allowedFields
            .map(([field]) => `${field} = ?`)
            .join(", ");

        const values = allowedFields.map(([, value]) => value);

        values.push(id, req.user.id);

        const [result] = await db.query(
            `UPDATE tasks SET ${setClause}
            WHERE id = ? AND user_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
                [id, req.user.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }
        }

        const [rows] = await db.query(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [id, req.user.id]
        );

        res.json(rows[0]);

    } catch (err) {
        console.error("Update task error:", err.message);

        res.status(500).json({
            message: "Unable to update task"
        });
    }
});

// DELETE TASK
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        const [result] = await db.query(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (err) {
        console.error("Delete task error:", err.message);

        res.status(500).json({
            message: "Unable to delete task"
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`WorkHub server running at http://localhost:${PORT}`);
});