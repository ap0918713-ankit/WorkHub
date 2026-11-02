
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all");
  const [apiStatus, setApiStatus] = useState("Connecting...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to fetch tasks");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
      setApiStatus("Backend Connected");
    } catch (error) {
      console.error(error);
      setApiStatus("Backend Disconnected");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!newTask.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim() }),
      });

      if (!response.ok) throw new Error("Task could not be added");

      setNewTask("");
      fetchTasks();
    } catch (error) {
      alert("Task add nahi hua. Backend check karo.");
      console.error(error);
    }
  };

  const toggleTask = async (task) => {
    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) throw new Error("Task update failed");

      fetchTasks();
    } catch (error) {
      alert("Task update nahi hua.");
      console.error(error);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Kya tum ye task delete karna chahte ho?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      fetchTasks();
    } catch (error) {
      alert("Task delete nahi hua.");
      console.error(error);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">W</div>
          <span>WorkHub</span>
        </div>

        <div className="profile-card">
          <div className="avatar">AP</div>
          <div>
            <h3>Ankit Pandey</h3>
            <p>Project Owner</p>
          </div>
        </div>

        <p className="menu-heading">WORKSPACE</p>

        <nav className="sidebar-nav">
          <a className="nav-item active" href="#overview">
            <span>▦</span> Overview
          </a>
          <a className="nav-item" href="#tasks">
            <span>✓</span> My Tasks
          </a>
          <a className="nav-item" href="#about">
            <span>◉</span> About Me
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>🚀</span>
            <p>Stay focused. Keep growing.</p>
          </div>
          <p className="sidebar-footer">Made with ❤️ by Ankit</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / Overview</p>
            <h2>My Dashboard</h2>
          </div>

          <div className="connection-status">
            <span
              className={
                apiStatus === "Backend Connected" ? "status-dot" : "status-dot offline"
              }
            ></span>
            {apiStatus}
          </div>
        </header>

        <section className="welcome-section" id="overview">
          <div>
            <span className="welcome-label">PERSONAL WORKSPACE</span>
            <h1>Let's get things done, Ankit! 👋</h1>
            <p>
              Organize your work, manage your daily tasks and achieve your goals.
            </p>
          </div>
          <div className="welcome-art">🚀</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">▦</div>
            <p>Total Tasks</p>
            <h2>{totalTasks}</h2>
            <span>All your tasks</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Completed</p>
            <h2>{completedTasks}</h2>
            <span>Successfully finished</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Pending</p>
            <h2>{pendingTasks}</h2>
            <span>Waiting to be done</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">↗</div>
            <p>Progress</p>
            <h2>{progress}%</h2>
            <span>Your completion rate</span>
          </div>
        </section>

        <section className="content-grid">
          <div className="task-panel" id="tasks">
            <div className="panel-header">
              <div>
                <h2>My Tasks</h2>
                <p>Manage your daily activities</p>
              </div>
              <span className="task-count">{totalTasks} Tasks</span>
            </div>

            <form className="task-form" onSubmit={addTask}>
              <input
                type="text"
                placeholder="What do you need to do?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button type="submit">+ Add Task</button>
            </form>

            <div className="filter-tabs">
              <button
                className={filter === "all" ? "filter-btn selected" : "filter-btn"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={filter === "active" ? "filter-btn selected" : "filter-btn"}
                onClick={() => setFilter("active")}
              >
                Pending
              </button>
              <button
                className={filter === "completed" ? "filter-btn selected" : "filter-btn"}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>

            <div className="task-list">
              {loading ? (
                <div className="empty-state">Loading your tasks...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <span>📝</span>
                  <h3>No tasks found</h3>
                  <p>Add a new task to get started.</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div className="task-item" key={task.id}>
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        onChange={() => toggleTask(task)}
                      />
                      <span className="custom-check"></span>
                    </label>

                    <span className={task.completed ? "task-title done" : "task-title"}>
                      {task.title}
                    </span>

                    <span className={task.completed ? "task-badge done-badge" : "task-badge"}>
                      {task.completed ? "Completed" : "Pending"}
                    </span>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-column">
            <div className="progress-panel">
              <h2>Task Progress</h2>
              <p>Your productivity overview</p>

              <div
                className="progress-circle"
                style={{ "--progress": `${progress}%` }}
              >
                <div className="progress-inner">
                  <strong>{progress}%</strong>
                  <span>Completed</span>
                </div>
              </div>

              <div className="progress-info">
                <span><i className="legend completed-legend"></i> Completed</span>
                <strong>{completedTasks}</strong>
              </div>
              <div className="progress-info">
                <span><i className="legend pending-legend"></i> Pending</span>
                <strong>{pendingTasks}</strong>
              </div>
            </div>

            <div className="about-panel" id="about">
              <div className="about-heading">
                <div className="about-avatar">AP</div>
                <div>
                  <h2>Ankit Pandey</h2>
                  <p>Full Stack Developer - Fresher</p>
                </div>
              </div>

              <p className="about-description">
                Computer Science graduate passionate about building useful
                web applications and learning new technologies.
              </p>

              <div className="about-details">
                <div>
                  <span>Education</span>
                  <strong>B.Tech - CSE</strong>
                </div>
                <div>
                  <span>Institute</span>
                  <strong>Ambalika Institute of Management & Technology</strong>
                </div>
                <div>
                  <span>Graduation</span>
                  <strong>2026</strong>
                </div>
              </div>

              <div className="tech-stack">
                <span>React</span>
                <span>Node.js</span>
                <span>Express</span>
                <span>MySQL</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="main-footer">
          <p>© 2026 WorkHub. Developed by <strong>Ankit Pandey</strong>.</p>
          <p>Built with React, Node.js, Express & MySQL</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
