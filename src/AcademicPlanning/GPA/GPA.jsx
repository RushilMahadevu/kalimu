import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, loadGPAHistory } from '../../../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import styles from './GPA.module.css';

const GPA = () => {
  const [courses, setCourses] = useState([{ name: '', grade: '', credits: '' }]);
  const [gpaHistory, setGpaHistory] = useState([]);
  const [currentGPA, setCurrentGPA] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const history = await loadGPAHistory(user.uid);
          setGpaHistory(history);
        } catch (error) {
          console.error('Error loading GPA history:', error);
          setError('Failed to load GPA history');
        } finally {
          setIsLoading(false);
        }
      } else {
        setGpaHistory([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddCourse = () => {
    setCourses([...courses, { name: '', grade: '', credits: '' }]);
  };

  const handleRemoveCourse = (index) => {
    if (courses.length > 1) {
      const newCourses = courses.filter((_, i) => i !== index);
      setCourses(newCourses);
    }
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
  };

  const calculateGPA = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('Please sign in to save your GPA history');
      return;
    }

    try {
      let totalPoints = 0;
      let totalCredits = 0;

      courses.forEach(course => {
        if (course.grade && course.credits) {
          const credits = parseFloat(course.credits);
          totalPoints += gradePoints[course.grade] * credits;
          totalCredits += credits;
        }
      });

      const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      setCurrentGPA(gpa);

      const gpaData = {
        gpa: parseFloat(gpa),
        courses: courses.map(course => ({
          name: course.name.trim(),
          grade: course.grade,
          credits: parseFloat(course.credits)
        })),
        timestamp: Date.now(),
        date: new Date().toISOString()
      };

      const userGPARef = collection(db, 'users', auth.currentUser.uid, 'gpaHistory');
      const docRef = await addDoc(userGPARef, gpaData);
      setGpaHistory([{ ...gpaData, id: docRef.id }, ...gpaHistory]);
      
      // Reset form
      setCourses([{ name: '', grade: '', credits: '' }]);
    } catch (error) {
      console.error('Error saving GPA:', error);
      setError('Failed to save GPA calculation. Please try again.');
    }
  };

  const deleteGPARecord = async (id) => {
    if (!auth.currentUser) return;

    try {
      const gpaRef = doc(db, 'users', auth.currentUser.uid, 'gpaHistory', id);
      await deleteDoc(gpaRef);
      setGpaHistory(gpaHistory.filter(record => record.id !== id));
    } catch (error) {
      console.error('Error removing GPA record:', error);
      setError('Failed to delete GPA record. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>GPA Calculator</h1>
        <Link to="/academic-planning" className={styles.backButton}>
          Back to Academic Planning
        </Link>
      </header>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <form onSubmit={calculateGPA} className={styles.calculatorForm}>
        {courses.map((course, index) => (
          <div key={index} className={styles.courseRow}>
            <input
              type="text"
              placeholder="Course Name"
              value={course.name}
              onChange={(e) => handleCourseChange(index, 'name', e.target.value)}
              className={styles.courseInput}
              required
            />
            <select
              value={course.grade}
              onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
              className={styles.gradeSelect}
              required
            >
              <option value="">Grade</option>
              {Object.keys(gradePoints).map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Credits"
              value={course.credits}
              onChange={(e) => handleCourseChange(index, 'credits', e.target.value)}
              className={styles.creditsInput}
              min="0.5"
              step="0.5"
              required
            />
            {courses.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveCourse(index)}
                className={styles.removeButton}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div className={styles.buttonGroup}>
          <button type="button" onClick={handleAddCourse} className={styles.addButton}>
            Add Course
          </button>
          <button type="submit" className={styles.calculateButton}>
            Calculate GPA
          </button>
        </div>
      </form>

      {currentGPA && (
        <div className={styles.currentGPA}>
          <h2>Current GPA: {currentGPA}</h2>
        </div>
      )}

      <div className={styles.gpaHistory}>
        <h2>GPA History</h2>
        {isLoading ? (
          <p className={styles.loading}>Loading GPA history...</p>
        ) : gpaHistory.length === 0 ? (
          <p className={styles.noHistory}>No GPA records found</p>
        ) : (
          <div className={styles.historyList}>
            {gpaHistory.map((record) => (
              <div key={record.id} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <span className={styles.gpaValue}>GPA: {record.gpa.toFixed(2)}</span>
                  <span className={styles.gpaDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteGPARecord(record.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
                <div className={styles.courseList}>
                  {record.courses.map((course, index) => (
                    <div key={index} className={styles.historyCourse}>
                      {course.name}: {course.grade} ({course.credits} credits)
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

export default GPA;