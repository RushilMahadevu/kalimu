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
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const [aiOverview, setAiOverview] = useState(null);
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!auth.currentUser) {
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

  const generateOverview = async () => {
    if (tasks.length === 0) return;
    
    setIsGeneratingOverview(true);
    try {
      const prompt = `
        As a homework analysis expert, analyze these assignments and provide insights.
        Tasks: ${JSON.stringify(tasks)}

        Return a JSON response with EXACTLY this structure:
        {
          "summary": "Brief overview analyzing total workload and upcoming deadlines",
          "urgentTasks": "List the most urgent tasks based on due dates and priority",
          "timeManagement": "Provide specific time management advice for these tasks",
          "studyTips": "Give subject-specific study strategies based on the tasks"
        }

        Requirements:
        1. All fields must be detailed text strings
        2. urgentTasks should list specific task names and deadlines
        3. Include concrete study strategies for each subject
        4. Keep responses focused and actionable
      `;

      const genAI = new GoogleGenerativeAI(process.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let overview;
      try {
        // First try direct JSON parsing
        overview = JSON.parse(text);
      } catch (e) {
        // If direct parsing fails, try extracting JSON from markdown
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
        overview = JSON.parse(jsonMatch[1].trim());
      }

      // Validate that all required fields are present
      const requiredFields = ['summary', 'urgentTasks', 'timeManagement', 'studyTips'];
      const missingFields = requiredFields.filter(field => !overview[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      setAiOverview(overview);
    } catch (error) {
      console.error("Failed to generate overview:", error);
      setError("Failed to generate complete AI overview. Please try again.");
    } finally {
      setIsGeneratingOverview(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const safeRenderText = (text) => {
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return text.toString();
    return '';
  };

  return (
    <div className={styles["homework-manager"]}>
      <div className={styles.container}>
        <div className={styles["content-wrapper"]}>
          <div className={styles["main-content"]}>
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
                {Array.isArray(filteredTasks) && filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div key={task.id || Math.random()} className={styles["task-card"]}>
                      <div className={styles["task-header"]}>
                        <div>
                          <h3 className={styles["task-title"]}>{safeRenderText(task.title)}</h3>
                          <div className={styles["task-meta"]}>
                            <div className={styles["task-meta-item"]}>
                              <Book size={16} />
                              <span>{safeRenderText(task.subject)}</span>
                            </div>
                            <div className={styles["task-meta-item"]}>
                              <Clock size={16} />
                              <span>
                                {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No date set'}
                              </span>
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
                        <p className={styles["task-notes"]}>{safeRenderText(task.notes)}</p>
                      )}
                      <div className={styles["priority-badge"]}>
                        <span className={`${styles[`priority-${task.priority || 'medium'}`]}`}>
                          {task.priority ? 
                            `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} Priority` 
                            : 'Medium Priority'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.loading}>No tasks available</div>
                )}
              </div>
            )}
          </div>

          <div className={styles["ai-sidebar"]}>
            <div className={styles["ai-overview-card"]}>
              <h2>AI Homework Overview</h2>
              <button
                onClick={generateOverview}
                className={styles["generate-overview-button"]}
                disabled={isGeneratingOverview || !Array.isArray(tasks) || tasks.length === 0}
              >
                {isGeneratingOverview ? "Analyzing..." : "Generate Overview"}
              </button>

              {aiOverview && typeof aiOverview === 'object' && (
                <div className={styles["overview-content"]}>
                  <div className={styles["overview-section"]}>
                    <h3>Summary</h3>
                    <p>{safeRenderText(aiOverview.summary)}</p>
                  </div>
                  
                  <div className={styles["overview-section"]}>
                    <h3>Urgent Tasks</h3>
                    <p>{safeRenderText(aiOverview.urgentTasks)}</p>
                  </div>
                  
                  <div className={styles["overview-section"]}>
                    <h3>Time Management</h3>
                    <p>{safeRenderText(aiOverview.timeManagement)}</p>
                  </div>
                  
                  <div className={styles["overview-section"]}>
                    <h3>Study Tips</h3>
                    <p>{safeRenderText(aiOverview.studyTips)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkManager;
