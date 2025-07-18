import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, loadStudyScheduleHistory } from '../../../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import styles from './StudySchedule.module.css';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChevronDown, ChevronUp } from 'lucide-react';

const StudySchedule = () => {
  const [tasks, setTasks] = useState([{ name: '', time: '' }]);
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiOptimization, setAiOptimization] = useState(null);
  const [isGeneratingOptimization, setIsGeneratingOptimization] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [highlightedContent, setHighlightedContent] = useState({});
  const [isHighlighting, setIsHighlighting] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      setError(null);
      try {
        if (user) {
          const history = await loadStudyScheduleHistory(user.uid);
          setScheduleHistory(history);
        } else {
          setScheduleHistory([]);
        }
      } catch (error) {
        console.error('Error loading schedule history:', error);
        if (error.code === 'permission-denied') {
          setError('You do not have permission to access the schedule history.');
        } else {
          setError(error.message || 'Failed to load schedule history. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = () => {
    setTasks([...tasks, { name: '', time: '' }]);
  };

  const handleRemoveTask = (index) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
    }
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const saveSchedule = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('Please sign in to save your schedule');
      return;
    }

    // Validate task data
    const validTasks = tasks.every(task => 
      task.name.trim() && 
      task.time && 
      !isNaN(parseFloat(task.time))
    );

    if (!validTasks) {
      setError('Please fill in all task information correctly');
      return;
    }

    try {
      const scheduleData = {
        tasks: tasks.map(task => ({
          name: task.name.trim(),
          time: parseFloat(task.time)
        })),
        timestamp: Date.now(),
        date: new Date().toISOString()
      };

      const userScheduleRef = collection(db, 'users', auth.currentUser.uid, 'studyScheduleHistory');
      const docRef = await addDoc(userScheduleRef, scheduleData);
      
      const updatedHistory = [{...scheduleData, id: docRef.id}, ...scheduleHistory];
      setScheduleHistory(updatedHistory);
      setTasks([{ name: '', time: '' }]);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule. Please try again.');
    }
  };

  const deleteScheduleRecord = async (id) => {
    if (!auth.currentUser) {
      setError('Please sign in to delete schedule records');
      return;
    }

    try {
      const scheduleRef = doc(db, 'users', auth.currentUser.uid, 'studyScheduleHistory', id);
      await deleteDoc(scheduleRef);
      const updatedHistory = scheduleHistory.filter(record => record.id !== id);
      setScheduleHistory(updatedHistory);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error removing schedule record:', error);
      setError('Failed to delete schedule record. Please try again.');
    }
  };

  const generateOptimization = async () => {
    const scheduleToAnalyze = selectedSchedule || tasks;
    if (!scheduleToAnalyze || (Array.isArray(scheduleToAnalyze) && scheduleToAnalyze.length === 0)) return;

    setIsGeneratingOptimization(true);
    try {
      // First generate the optimization
      const prompt = `
        As a study schedule optimization expert, analyze this schedule and previous performance to provide recommendations.
        Current/Selected Schedule: ${JSON.stringify(scheduleToAnalyze)}
        Previous Schedules: ${JSON.stringify(scheduleHistory.slice(0, 3))}

        Return a JSON response with EXACTLY this structure:
        {
          "overview": "Brief analysis comparing current schedule with past patterns",
          "optimization": "Specific suggestions based on historical performance",
          "breakSchedule": "Recommended break patterns between study sessions",
          "effectiveness": "Tips to maximize study effectiveness based on past success"
        }
        Requirements:
        1. Compare current schedule with past schedules
        2. Identify patterns of successful study sessions
        3. Suggest improvements based on historical data
        4. Provide personalized recommendations
      `;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || [null, text];
      const optimization = jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(text);

      setAiOptimization(optimization);

      // Then automatically highlight each section
      const sections = [
        { id: 'overview', content: optimization.overview },
        { id: 'optimization', content: optimization.optimization },
        { id: 'breakSchedule', content: optimization.breakSchedule },
        { id: 'effectiveness', content: optimization.effectiveness }
      ];

      for (const section of sections) {
        await highlightOptimization(section.id, section.content);
      }
    } catch (error) {
      console.error("Failed to generate optimization:", error);
      setError("Failed to generate AI optimization. Please try again.");
    } finally {
      setIsGeneratingOptimization(false);
    }
  };

  const highlightOptimization = async (sectionId, content) => {
    if (!content || isHighlighting) return;

    setIsHighlighting(true);
    try {
      const prompt = `
        Analyze this study schedule optimization content and highlight key points:
        "${content}"

        Return a JSON response with this structure:
        {
          "formattedContent": "The content with **key points** marked in bold and *important recommendations* in italics",
          "summary": "A 2-sentence summary of the main points"
        }
      `;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || [null, text];
      const analysis = jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(text);

      setHighlightedContent(prev => ({
        ...prev,
        [sectionId]: analysis
      }));
    } catch (error) {
      console.error('Failed to highlight content:', error);
      setError('Failed to analyze content. Please try again.');
    } finally {
      setIsHighlighting(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderOptimizationSection = () => (
    <div className={styles.aiOptimization}>
      <h2>AI Schedule Optimization</h2>
      <div className={styles.optimizationControls}>
        <select 
          className={styles.scheduleSelect}
          onChange={(e) => {
            const selected = e.target.value === 'current' 
              ? tasks 
              : scheduleHistory.find(s => s.id === e.target.value)?.tasks || tasks;
            setSelectedSchedule(selected);
          }}
        >
          <option value="current">Current Schedule</option>
          {scheduleHistory.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              Schedule from {new Date(schedule.date).toLocaleDateString()}
            </option>
          ))}
        </select>
        <button
          onClick={generateOptimization}
          className={styles.optimizeButton}
          disabled={isGeneratingOptimization || (!selectedSchedule && tasks.every(task => !task.name))}
        >
          {isGeneratingOptimization ? "Analyzing..." : "Optimize Schedule"}
        </button>
      </div>

      {aiOptimization && (
        <div className={styles.optimizationResults}>
          <div key="overview" className={styles.optimizationSection}>
            <div className={styles.sectionHeader}>
              <button onClick={() => toggleSection('overview')}>
                <h3>Schedule Analysis</h3>
                {expandedSections['overview'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections['overview'] && (
              <div className={styles.sectionContent}>
                {renderSectionContent('overview', aiOptimization.overview)}
              </div>
            )}
          </div>

          <div key="optimization" className={styles.optimizationSection}>
            <div className={styles.sectionHeader}>
              <button onClick={() => toggleSection('optimization')}>
                <h3>Optimization Recommendations</h3>
                {expandedSections['optimization'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections['optimization'] && (
              <div className={styles.sectionContent}>
                {renderSectionContent('optimization', aiOptimization.optimization)}
              </div>
            )}
          </div>

          <div key="breakSchedule" className={styles.optimizationSection}>
            <div className={styles.sectionHeader}>
              <button onClick={() => toggleSection('breakSchedule')}>
                <h3>Break Schedule Plan</h3>
                {expandedSections['breakSchedule'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections['breakSchedule'] && (
              <div className={styles.sectionContent}>
                {renderSectionContent('breakSchedule', aiOptimization.breakSchedule)}
              </div>
            )}
          </div>

          <div key="effectiveness" className={styles.optimizationSection}>
            <div className={styles.sectionHeader}>
              <button onClick={() => toggleSection('effectiveness')}>
                <h3>Study Effectiveness Strategies</h3>
                {expandedSections['effectiveness'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {expandedSections['effectiveness'] && (
              <div className={styles.sectionContent}>
                {renderSectionContent('effectiveness', aiOptimization.effectiveness)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionContent = (sectionId, content) => (
    highlightedContent[sectionId] ? (
      <div className={styles.highlightedContent}>
        <div 
          className={styles.formattedContent}
          dangerouslySetInnerHTML={{
            __html: highlightedContent[sectionId].formattedContent
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
          }}
        />
        <div className={styles.contentSummary}>
          <strong>Summary:</strong> {highlightedContent[sectionId].summary}
        </div>
      </div>
    ) : (
      <p>{content}</p>
    )
  );

  return (
    <div className={styles.container}>
      <div className={styles.containerInner}>
        <header className={styles.header}>
          <div className={styles["header-content"]}>
            <div className={styles["title-section"]}>
              <div className={styles["title-badge"]}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <path d="M3 12h6m6 0h6"/>
                </svg>
                Study Planning
              </div>
              <h1 className={styles.title}>Study Schedule</h1>
            </div>
            <Link to="/academic-planning" className={styles.backButton}>
              Back to Academic Planning
            </Link>
          </div>
        </header>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <form onSubmit={saveSchedule} className={styles.scheduleForm}>
        {tasks.map((task, index) => (
          <div key={index} className={styles.taskRow}>
            <input
              type="text"
              placeholder="Task Name"
              value={task.name}
              onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
              className={styles.taskInput}
              required
            />
            <input
              type="number"
              placeholder="Time (hours)"
              value={task.time}
              onChange={(e) => handleTaskChange(index, 'time', e.target.value)}
              className={styles.timeInput}
              min="0.5"
              step="0.5"
              required
            />
            {tasks.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveTask(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div className={styles.buttonGroup}>
          <button type="button" onClick={handleAddTask} className={styles.addButton}>
            Add Task
          </button>
          <button type="submit" className={styles.saveButton}>
            Save Schedule
          </button>
        </div>
      </form>

      {renderOptimizationSection()}

      <div className={styles.scheduleHistory}>
        <h2>Schedule History</h2>
        {isLoading ? (
          <p className={styles.loading}>Loading schedule history...</p>
        ) : scheduleHistory.length === 0 ? (
          <p className={styles.noHistory}>No schedule records found</p>
        ) : (
          <div className={styles.historyList}>
            {scheduleHistory.map((record) => (
              <div key={record.id} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <span className={styles.taskValue}>Tasks: {record.tasks.length}</span>
                  <span className={styles.taskDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteScheduleRecord(record.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
                <div className={styles.taskList}>
                  {record.tasks.map((task, index) => (
                    <div key={index} className={styles.historyTask}>
                      {task.name}: {task.time} hours
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StudySchedule;
