
# 🚀 WorkHub – Task Management Application

WorkHub is a full-stack task management application designed to help users organize daily activities, manage tasks, and track productivity through a clean and user-friendly dashboard.

## 👨‍💻 Developed By

**Ankit Pandey**

- **Qualification:** B.Tech – Computer Science Engineering
- **Passing Year:** 2026
- **Institute:** Ambalika Institute of Management & Technology, Lucknow
- **GitHub:** [ap0918713-ankit](https://github.com/ap0918713-ankit)
- **Email:** ap0918713@gmail.com

## ✨ Features

- Add new tasks
- Mark tasks as completed or pending
- Delete tasks
- Filter tasks by All, Pending and Completed
- Dashboard with task statistics
- Productivity overview
- Personal developer profile
- MySQL database integration
- REST API integration
- Responsive user interface

## 🛠️ Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MySQL

### Development Tools
- Visual Studio Code
- MySQL Workbench
- Git
- GitHub

## 📁 Project Structure

```text
WorkHub/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── server.js
│   ├── test-db.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone Repository

```bash
git clone https://github.com/ap0918713-ankit/WorkHub.git
cd WorkHub
```

### 2. Database Setup

Open MySQL Workbench and execute:

```sql
CREATE DATABASE workhub_db;

USE workhub_db;

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Backend Setup

Open terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the server folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=workhub_db
DB_PORT=3306
```

Replace `your_mysql_password` with your local MySQL password.

Start backend:

```bash
node server.js
```

Backend URL:

http://localhost:5000

### 4. Frontend Setup

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown in your terminal, usually:

http://localhost:5173

## 🔒 Security

- Database credentials are stored in a local `.env` file.
- Environment files are excluded using `.gitignore`.
- Never upload passwords or private credentials to GitHub.

## 🎯 Project Objective

The main objective of WorkHub is to develop a practical full-stack task management system and gain hands-on experience with frontend development, backend APIs, database connectivity, and version control.

## 📚 Learning Outcomes

- React component development
- State management using React Hooks
- Building REST APIs with Express.js
- Connecting Node.js with MySQL
- Performing CRUD operations
- Using Git and GitHub

## 📬 Contact

**Ankit Pandey**

- Email: ap0918713@gmail.com
- GitHub: https://github.com/ap0918713-ankit

---

⭐ Thank you for visiting my project!

**WorkHub – Your Productivity, Simplified.**
