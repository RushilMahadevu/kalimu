import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../../firebase";
import {
  loadHomeworkTasks,
  addHomeworkTask,
  deleteHomeworkTask,
  updateHomeworkTaskStatus,
} from "../../../firebase";
import {
  Calendar,
  Clock,
  Book,
  CheckSquare,
  Trash2,
  Plus,
  Edit3,
} from "lucide-react";
import styles from "./HomeworkManager.module.css";

const HomeworkManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!auth.currentUser) {
      setError("Please sign in to view your tasks");
      setIsLoading(false);
      return;
    }

    try {
      const loadedTasks = await loadHomeworkTasks(auth.currentUser.uid);
      setTasks(loadedTasks);
    } catch (error) {
      setError("Failed to load tasks");
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError("Please sign in to add tasks");
      return;
    }

    try {
      const taskData = {
        ...newTask,
        userId: auth.currentUser.uid,
      };
      await addHomeworkTask(taskData);
      setNewTask({
        title: "",
        subject: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
        notes: "",
      });
      setShowForm(false);
      loadTasks();
    } catch (error) {
      setError("Failed to add task");
      console.error("Error adding task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteHomeworkTask(taskId);
      loadTasks();
    } catch (error) {
      setError("Failed to delete task");
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateHomeworkTaskStatus(taskId, newStatus);
      loadTasks();
    } catch (error) {
      setError("Failed to update task");
      console.error("Error updating task:", error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div className={styles["homework-manager"]}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Homework Manager</h1>
          <Link to="/academic-planning" className={styles.backButton}>
            Back to Academic Planning
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles["add-task-button"]}
          >
            <Plus size={20} />
            Add Task
          </button>
        </header>

        {error && <div className={styles["error-message"]}>{error}</div>}

        {showForm && (
          <form onSubmit={addTask} className={styles["task-form"]}>
            <div className={styles["form-grid"]}>
              <input
                type="text"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={styles["form-input"]}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={newTask.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                className={styles["form-input"]}
                required
              />
              <input
                type="datetime-local"
                value={newTask.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className={styles["form-input"]}
                required
              />
              <select
                value={newTask.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className={styles["form-select"]}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <textarea
              placeholder="Notes"
              value={newTask.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className={styles["form-textarea"]}
              rows="3"
            />
            <div className={styles["form-actions"]}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`${styles["task-button"]}`}
              >
                Cancel
              </button>
              <button type="submit" className={styles["add-task-button"]}>
                Add Task
              </button>
            </div>
          </form>
        )}

        <div className={styles["filter-bar"]}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles["filter-select"]}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : (
          <div className={styles["task-grid"]}>
            {filteredTasks.map((task) => (
              <div key={task.id} className={styles["task-card"]}>
                <div className={styles["task-header"]}>
                  <div>
                    <h3 className={styles["task-title"]}>{task.title}</h3>
                    <div className={styles["task-meta"]}>
                      <div className={styles["task-meta-item"]}>
                        <Book size={16} />
                        {task.subject}
                      </div>
                      <div className={styles["task-meta-item"]}>
                        <Clock size={16} />
                        {new Date(task.dueDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles["task-actions"]}>
                    <button
                      onClick={() =>
                        updateTaskStatus(
                          task.id,
                          task.status === "completed" ? "pending" : "completed"
                        )
                      }
                      className={`${styles["task-button"]} ${
                        task.status === "completed" ? styles.complete : ""
                      }`}
                    >
                      <CheckSquare size={20} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className={`${styles["task-button"]} ${styles.delete}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                {task.notes && (
                  <p className={styles["task-notes"]}>{task.notes}</p>
                )}
                <div className={styles["priority-badge"]}>
                  <span className={`${styles[`priority-${task.priority}`]}`}>
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}{" "}
                    Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkManager;
