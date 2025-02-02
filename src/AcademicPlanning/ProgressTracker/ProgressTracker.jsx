import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, TrendingUp, Target, Award, BookOpen } from "lucide-react";
import { Bar } from 'react-chartjs-2';
import { auth, loadSubjects, addSubject, updateSubject, deleteSubject } from "../../../firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import styles from "./ProgressTracker.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProgressTracker = () => {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    currentGrade: "",
    targetGrade: "",
    notes: "",
    tasks: [],
  });
  const [editingSubject, setEditingSubject] = useState(null);
  const [statistics, setStatistics] = useState({
    averageProgress: 0,
    totalSubjects: 0,
    onTrackSubjects: 0,
    needsImprovementSubjects: 0,
    highestGrade: 0,
    lowestGrade: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserSubjects();
  }, []);

  const loadUserSubjects = async () => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedSubjects = await loadSubjects(auth.currentUser.uid);
      setSubjects(loadedSubjects);
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = useCallback(() => {
    if (subjects.length === 0) return;

    const totalProgress = subjects.reduce((acc, subject) => acc + subject.progress, 0);
    const highest = Math.max(...subjects.map(s => Number(s.currentGrade)));
    const lowest = Math.min(...subjects.map(s => Number(s.currentGrade)));
    const onTrack = subjects.filter(s => Number(s.currentGrade) >= Number(s.targetGrade)).length;

    setStatistics({
      averageProgress: (totalProgress / subjects.length).toFixed(1),
      totalSubjects: subjects.length,
      onTrackSubjects: onTrack,
      needsImprovementSubjects: subjects.length - onTrack,
      highestGrade: highest,
      lowestGrade: lowest
    });
  }, [subjects]);

  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const subject = {
        ...newSubject,
        progress: calculateProgress(newSubject.currentGrade, newSubject.targetGrade)
      };
      await addSubject(auth.currentUser.uid, subject);
      await loadUserSubjects(); // Reload subjects after adding
      setNewSubject({
        name: "",
        currentGrade: "",
        targetGrade: "",
        notes: "",
        tasks: [],
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  };

  const calculateProgress = (current, target) => {
    const curr = parseFloat(current);
    const targ = parseFloat(target);
    if (isNaN(curr) || isNaN(targ)) return 0;
    return Math.min(100, (curr / targ) * 100);
  };

  const deleteSubjectHandler = async (id) => {
    if (!auth.currentUser) return;

    try {
      await deleteSubject(auth.currentUser.uid, id);
      await loadUserSubjects(); // Reload subjects after deletion
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const updateSubjectHandler = async (id, updatedData) => {
    if (!auth.currentUser) return;

    try {
      await updateSubject(auth.currentUser.uid, id, {
        ...updatedData,
        progress: calculateProgress(updatedData.currentGrade, updatedData.targetGrade)
      });
      await loadUserSubjects(); // Reload subjects after update
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  const chartData = {
    labels: subjects.map(subject => subject.name),
    datasets: [
      {
        label: 'Current Grade',
        data: subjects.map(subject => subject.currentGrade),
        backgroundColor: 'rgba(124, 58, 237, 0.5)',
        borderColor: 'rgba(124, 58, 237, 1)',
        borderWidth: 1
      },
      {
        label: 'Target Grade',
        data: subjects.map(subject => subject.targetGrade),
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f1f5f9'
        }
      },
      title: {
        display: true,
        text: 'Grade Comparison',
        color: '#f1f5f9'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#f1f5f9'
        }
      }
    }
  };

  return (
    <div className={styles["progress-tracker"]}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Progress Tracker</h1>
          <Link to="/academic-planning" className={styles.backButton}>
            Back to Academic Planning
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles["add-subject-button"]}
          >
            <Plus size={20} />
            Add Subject
          </button>
        </header>

        {isLoading ? (
          <div className={styles.loading}>Loading subjects...</div>
        ) : (
          <>
            <div className={styles["stats-dashboard"]}>
              <div className={styles["stat-card"]}>
                <TrendingUp size={24} />
                <h3>Average Progress</h3>
                <p>{statistics.averageProgress}%</p>
              </div>
              <div className={styles["stat-card"]}>
                <BookOpen size={24} />
                <h3>Total Subjects</h3>
                <p>{statistics.totalSubjects}</p>
              </div>
              <div className={styles["stat-card"]}>
                <Target size={24} />
                <h3>On Track</h3>
                <p>{statistics.onTrackSubjects}</p>
              </div>
              <div className={styles["stat-card"]}>
                <Award size={24} />
                <h3>Highest Grade</h3>
                <p>{statistics.highestGrade}%</p>
              </div>
            </div>

            <div className={styles["chart-container"]}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {showForm && (
              <form onSubmit={handleAddSubject} className={styles["subject-form"]}>
                <div className={styles["form-grid"]}>
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    className={styles["form-input"]}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Current Grade %"
                    value={newSubject.currentGrade}
                    onChange={(e) => setNewSubject({...newSubject, currentGrade: e.target.value})}
                    className={styles["form-input"]}
                    required
                    min="0"
                    max="100"
                  />
                  <input
                    type="number"
                    placeholder="Target Grade %"
                    value={newSubject.targetGrade}
                    onChange={(e) => setNewSubject({...newSubject, targetGrade: e.target.value})}
                    className={styles["form-input"]}
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <textarea
                  placeholder="Notes"
                  value={newSubject.notes}
                  onChange={(e) => setNewSubject({...newSubject, notes: e.target.value})}
                  className={styles["form-textarea"]}
                />
                <div className={styles["form-actions"]}>
                  <button type="button" onClick={() => setShowForm(false)} className={styles["cancel-button"]}>
                    Cancel
                  </button>
                  <button type="submit" className={styles["add-subject-button"]}>
                    Add Subject
                  </button>
                </div>
              </form>
            )}

            <div className={styles["subjects-grid"]}>
              {subjects.map((subject) => (
                <div key={subject.id} className={styles["subject-card"]}>
                  {editingSubject?.id === subject.id ? (
                    <div className={styles["edit-form"]}>
                      <input
                        type="text"
                        value={editingSubject.name}
                        onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                        className={styles["form-input"]}
                      />
                      <input
                        type="number"
                        value={editingSubject.currentGrade}
                        onChange={(e) => setEditingSubject({...editingSubject, currentGrade: e.target.value})}
                        className={styles["form-input"]}
                      />
                      <input
                        type="number"
                        value={editingSubject.targetGrade}
                        onChange={(e) => setEditingSubject({...editingSubject, targetGrade: e.target.value})}
                        className={styles["form-input"]}
                      />
                      <textarea
                        value={editingSubject.notes}
                        onChange={(e) => setEditingSubject({...editingSubject, notes: e.target.value})}
                        className={styles["form-textarea"]}
                      />
                      <div className={styles["edit-actions"]}>
                        <button onClick={() => setEditingSubject(null)} className={styles["cancel-button"]}>
                          Cancel
                        </button>
                        <button
                          onClick={() => updateSubjectHandler(subject.id, editingSubject)}
                          className={styles["save-button"]}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles["subject-header"]}>
                        <h3 className={styles["subject-title"]}>{subject.name}</h3>
                        <div className={styles["subject-actions"]}>
                          <button
                            onClick={() => setEditingSubject({...subject})}
                            className={styles["edit-button"]}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => deleteSubjectHandler(subject.id)}
                            className={styles["delete-button"]}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className={styles["progress-section"]}>
                        <div className={styles["progress-bar"]}>
                          <div
                            className={styles["progress-fill"]}
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                        <div className={styles["progress-stats"]}>
                          <span>Current: {subject.currentGrade}%</span>
                          <span>Target: {subject.targetGrade}%</span>
                        </div>
                      </div>
                      {subject.notes && (
                        <p className={styles["subject-notes"]}>{subject.notes}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
