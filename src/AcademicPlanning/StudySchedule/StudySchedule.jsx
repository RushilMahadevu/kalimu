import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, loadStudyScheduleHistory } from '../../../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import styles from './StudySchedule.module.css';

const StudySchedule = () => {
  const [tasks, setTasks] = useState([{ name: '', time: '' }]);
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Study Schedule</h1>
        <Link to="/academic-planning" className={styles.backButton}>
          Back to Academic Planning
        </Link>
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
  );
};

export default StudySchedule;
