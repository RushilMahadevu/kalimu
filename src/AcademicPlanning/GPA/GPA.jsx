import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, loadGPAHistory } from '../../../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ArrowLeft, Calculator, Plus, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GPA.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const GPA = () => {
  const [courses, setCourses] = useState([{ name: '', grade: '', credits: '' }]);
  const [gpaHistory, setGpaHistory] = useState([]);
  const [currentGPA, setCurrentGPA] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const calculateOverallGPA = (history) => {
      let totalPoints = 0;
      let totalCredits = 0;

      history.forEach(record => {
        record.courses.forEach(course => {
          const credits = parseFloat(course.credits);
          totalPoints += gradePoints[course.grade] * credits;
          totalCredits += credits;
        });
      });

      const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      setCurrentGPA(overallGPA);

      const gpaValue = parseFloat(overallGPA);
      const maxGPA = 4.0;

      setChartData({
        labels: ['Current GPA', 'Remaining'],
        datasets: [
          {
            data: [gpaValue, maxGPA - gpaValue],
            backgroundColor: ['#8B5CF6', '#374151'],
            hoverBackgroundColor: ['#7C3AED', '#4B5563'],
            borderWidth: 0,
          },
        ],
      });
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      setError(null);
      try {
        if (user) {
          const history = await loadGPAHistory(user.uid);
          setGpaHistory(history);
          calculateOverallGPA(history);
        } else {
          setGpaHistory([]);
        }
      } catch (error) {
        console.error('Error loading GPA history:', error);
        if (error.code === 'permission-denied') {
          setError('You do not have permission to access the GPA history.');
        } else {
          setError('Failed to load GPA history. Please try again.');
        }
      } finally {
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

    // Validate course data
    const validCourses = courses.every(course => 
      course.name.trim() && 
      course.grade && 
      course.credits && 
      !isNaN(parseFloat(course.credits))
    );

    if (!validCourses) {
      setError('Please fill in all course information correctly');
      return;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const credits = parseFloat(course.credits);
      totalPoints += gradePoints[course.grade] * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    setCurrentGPA(gpa);

    try {
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
      
      const updatedHistory = [{...gpaData, id: docRef.id}, ...gpaHistory];
      setGpaHistory(updatedHistory);
      
      // Recalculate overall GPA with updated history
      let overallTotalPoints = 0;
      let overallTotalCredits = 0;

      updatedHistory.forEach(record => {
        record.courses.forEach(course => {
          const credits = parseFloat(course.credits);
          overallTotalPoints += gradePoints[course.grade] * credits;
          overallTotalCredits += credits;
        });
      });

      const overallGPA = overallTotalCredits > 0 ? (overallTotalPoints / overallTotalCredits).toFixed(2) : '0.00';
      setCurrentGPA(overallGPA);

      const gpaValue = parseFloat(overallGPA);
      const maxGPA = 4.0;

      setChartData({
        labels: ['Current GPA', 'Remaining'],
        datasets: [
          {
            data: [gpaValue, maxGPA - gpaValue],
            backgroundColor: ['#8B5CF6', '#374151'],
            hoverBackgroundColor: ['#7C3AED', '#4B5563'],
            borderWidth: 0,
          },
        ],
      });
      
      setCourses([{ name: '', grade: '', credits: '' }]);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error saving GPA:', error);
      setError('Failed to save GPA calculation. Please try again.');
    }
  };

  const deleteGPARecord = async (id) => {
    if (!auth.currentUser) {
      setError('Please sign in to delete GPA records');
      return;
    }

    try {
      const gpaRef = doc(db, 'users', auth.currentUser.uid, 'gpaHistory', id);
      await deleteDoc(gpaRef);
      const updatedHistory = gpaHistory.filter(record => record.id !== id);
      setGpaHistory(updatedHistory);
      
      // Recalculate overall GPA with updated history
      let overallTotalPoints = 0;
      let overallTotalCredits = 0;

      updatedHistory.forEach(record => {
        record.courses.forEach(course => {
          const credits = parseFloat(course.credits);
          overallTotalPoints += gradePoints[course.grade] * credits;
          overallTotalCredits += credits;
        });
      });

      const overallGPA = overallTotalCredits > 0 ? (overallTotalPoints / overallTotalCredits).toFixed(2) : '0.00';
      setCurrentGPA(overallGPA);

      const gpaValue = parseFloat(overallGPA);
      const maxGPA = 4.0;

      setChartData({
        labels: ['Current GPA', 'Remaining'],
        datasets: [
          {
            data: [gpaValue, maxGPA - gpaValue],
            backgroundColor: ['#8B5CF6', '#374151'],
            hoverBackgroundColor: ['#7C3AED', '#4B5563'],
            borderWidth: 0,
          },
        ],
      });
      
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error removing GPA record:', error);
      setError('Failed to delete GPA record. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>Academic Performance Tracker</span>
            </div>
            <h1 className={styles.title}>GPA Calculator</h1>
            <p className={styles.subtitle}>
              Calculate and track your academic performance with detailed GPA analysis
            </p>
          </div>
          
          <Link to="/academic-planning" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Academic Planning
          </Link>
        </div>
      </motion.header>

      {error && (
        <motion.div 
          className={styles.error}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Calculator Form */}
      <motion.section 
        className={styles.calculatorSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <form onSubmit={calculateGPA} className={styles.calculatorForm}>
          <h2 className={styles.formTitle}>Enter Your Courses</h2>
          
          {courses.map((course, index) => (
            <motion.div 
              key={index} 
              className={styles.courseRow}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
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
                <motion.button
                  type="button"
                  onClick={() => handleRemoveCourse(index)}
                  className={styles.removeButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={16} />
                </motion.button>
              )}
            </motion.div>
          ))}

          <div className={styles.buttonGroup}>
            <motion.button 
              type="button" 
              onClick={handleAddCourse} 
              className={styles.addButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={20} />
              Add Course
            </motion.button>
            <motion.button 
              type="submit" 
              className={styles.calculateButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calculator size={20} />
              Calculate GPA
            </motion.button>
          </div>
        </form>
      </motion.section>

      {/* Current GPA Display */}
      <AnimatePresence>
        {currentGPA && chartData && (
          <motion.section 
            className={styles.currentGPASection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.currentGPA}>
              <h2>Overall GPA: {currentGPA}</h2>
              <div className={styles.chartContainer}>
                <Pie data={chartData} />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* GPA History */}
      <motion.section 
        className={styles.gpaHistorySection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className={styles.gpaHistory}>
          <h2>GPA History</h2>
          {isLoading ? (
            <p className={styles.loading}>Loading GPA history...</p>
          ) : gpaHistory.length === 0 ? (
            <p className={styles.noHistory}>No GPA records found. Start by calculating your first GPA above!</p>
          ) : (
            <div className={styles.historyList}>
              {gpaHistory.map((record, index) => (
                <motion.div 
                  key={record.id} 
                  className={styles.historyItem}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.historyHeader}>
                    <span className={styles.gpaValue}>GPA: {record.gpa.toFixed(2)}</span>
                    <span className={styles.gpaDate}>
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                    <motion.button
                      onClick={() => deleteGPARecord(record.id)}
                      className={styles.deleteButton}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </motion.button>
                  </div>
                  <div className={styles.courseList}>
                    {record.courses.map((course, courseIndex) => (
                      <motion.div 
                        key={courseIndex} 
                        className={styles.historyCourse}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: courseIndex * 0.05 }}
                      >
                        <BookOpen size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        {course.name}: {course.grade} ({course.credits} credits)
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default GPA;