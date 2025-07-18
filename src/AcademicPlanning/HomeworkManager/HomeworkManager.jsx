import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../../firebase";
import {
  loadHomeworkTasks,
  addHomeworkTask,
  deleteHomeworkTask,
  updateHomeworkTaskStatus,
  updateHomeworkTask,
} from "../../../firebase";
import { Clock, Book, CheckSquare, Trash2, Plus, Pencil, ArrowLeft, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [editingTask, setEditingTask] = useState(null);

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

  const updateTask = async (taskId, updatedData) => {
    if (!auth.currentUser) {
      setError("Please sign in to update tasks");
      return;
    }

    try {
      await updateHomeworkTask(auth.currentUser.uid, taskId, updatedData);
      setEditingTask(null);
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
        4. Keep responses focused and actionable and concise
      `;
      const genAI = new GoogleGenerativeAI(
        import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      let overview;

      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || [null, text];
      overview = jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(text);

      // Validate that all required fields are present
      const requiredFields = [
        "summary",
        "urgentTasks",
        "timeManagement",
        "studyTips",
      ];
      const missingFields = requiredFields.filter((field) => !overview[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
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
    if (typeof text === "string") return text;
    if (typeof text === "number") return text.toString();
    return "";
  };

  return (
    <div className={styles["homework-manager"]}>
      <div className={styles.container}>
        {/* Header */}
        <motion.header 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles["header-content"]}>
            <div className={styles["title-section"]}>
              <div className={styles["title-badge"]}>
                <Sparkles size={16} />
                <span>AI-Powered Task Management</span>
              </div>
              <h1 className={styles.title}>Homework Manager</h1>
              <p className={styles.subtitle}>
                Organize and track your assignments with intelligent AI insights
              </p>
            </div>
            
            <div className={styles["header-actions"]}>
              <Link to="/academic-planning" className={styles.backButton}>
                <ArrowLeft size={20} />
                Back to Academic Planning
              </Link>
              <motion.button
                onClick={() => setShowForm(!showForm)}
                className={styles["add-task-button"]}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={20} />
                Add Task
              </motion.button>
            </div>
          </div>
        </motion.header>

        {error && (
          <motion.div 
            className={styles["error-message"]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <div className={styles["content-wrapper"]}>
          <div className={styles["main-content"]}>
            {/* Task Form */}
            <AnimatePresence>
              {showForm && (
                <motion.section 
                  className={styles["task-form-section"]}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={addTask} className={styles["task-form"]}>
                    <h2 className={styles["form-title"]}>Add New Task</h2>
                    
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
                      <motion.button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className={styles["task-button"]}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        type="submit" 
                        className={styles["add-task-button"]}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus size={16} />
                        Add Task
                      </motion.button>
                    </div>
                  </form>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Filter Bar */}
            <motion.section 
              className={styles["filter-bar-section"]}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
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
            </motion.section>

            {/* Tasks */}
            <motion.section 
              className={styles["tasks-section"]}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {isLoading ? (
                <div className={styles.loading}>Loading tasks...</div>
              ) : (
                <div className={styles["task-grid"]}>
                  {Array.isArray(filteredTasks) && filteredTasks.length > 0 ? (
                    filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id || Math.random()}
                        className={styles["task-card"]}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                      >
                        {editingTask?.id === task.id ? (
                          <div className={styles["edit-form"]}>
                            <input
                              type="text"
                              value={editingTask.title}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  title: e.target.value,
                                })
                              }
                              className={styles["form-input"]}
                            />
                            <input
                              type="text"
                              value={editingTask.subject}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  subject: e.target.value,
                                })
                              }
                              className={styles["form-input"]}
                            />
                            <input
                              type="datetime-local"
                              value={editingTask.dueDate}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  dueDate: e.target.value,
                                })
                              }
                              className={styles["form-input"]}
                            />
                            <select
                              value={editingTask.priority}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  priority: e.target.value,
                                })
                              }
                              className={styles["form-select"]}
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                            <textarea
                              value={editingTask.notes}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  notes: e.target.value,
                                })
                              }
                              className={styles["form-textarea"]}
                              rows="3"
                            />
                            <div className={styles["edit-actions"]}>
                              <motion.button
                                onClick={() => setEditingTask(null)}
                                className={styles["task-button"]}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                onClick={() => updateTask(task.id, editingTask)}
                                className={styles["add-task-button"]}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Save
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles["task-header"]}>
                              <div>
                                <h3 className={styles["task-title"]}>
                                  {safeRenderText(task.title)}
                                </h3>
                                <div className={styles["task-meta"]}>
                                  <div className={styles["task-meta-item"]}>
                                    <Book size={16} />
                                    <span>{safeRenderText(task.subject)}</span>
                                  </div>
                                  <div className={styles["task-meta-item"]}>
                                    <Clock size={16} />
                                    <span>
                                      {task.dueDate
                                        ? new Date(task.dueDate).toLocaleString()
                                        : "No date set"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className={styles["task-actions"]}>
                                <motion.button
                                  onClick={() => setEditingTask({ ...task })}
                                  className={styles["edit-button"]}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Pencil size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={() =>
                                    updateTaskStatus(
                                      task.id,
                                      task.status === "completed" ? "pending" : "completed"
                                    )
                                  }
                                  className={`${styles["task-button"]} ${
                                    task.status === "completed" ? styles.complete : ""
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <CheckSquare size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={() => deleteTask(task.id)}
                                  className={`${styles["task-button"]} ${styles.delete}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </div>
                            
                            {task.notes && (
                              <p className={styles["task-notes"]}>
                                {safeRenderText(task.notes)}
                              </p>
                            )}
                            
                            <div className={styles["priority-badge"]}>
                              <span
                                className={`${styles[`priority-${task.priority || "medium"}`]}`}
                              >
                                {task.priority
                                  ? `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} Priority`
                                  : "Medium Priority"}
                              </span>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className={styles.loading}>
                      No tasks available. Create your first task to get started!
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          </div>

          {/* AI Sidebar */}
          <motion.aside 
            className={styles["ai-sidebar"]}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className={styles["ai-overview-card"]}>
              <h2>AI Homework Overview</h2>
              <motion.button
                onClick={generateOverview}
                className={styles["generate-overview-button"]}
                disabled={isGeneratingOverview || !Array.isArray(tasks) || tasks.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGeneratingOverview ? "Analyzing..." : "Generate Overview"}
              </motion.button>

              {aiOverview && typeof aiOverview === "object" && (
                <motion.div 
                  className={styles["overview-content"]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
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
                </motion.div>
              )}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default HomeworkManager;
