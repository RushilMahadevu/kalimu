import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db, loadUserVisits } from '../../../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import styles from './CollegeVisitPlanner.module.css';

const CollegeVisitPlanner = () => {
  const [selectedCollege, setSelectedCollege] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [interests, setInterests] = useState([]);
  const [plannedVisits, setPlannedVisits] = useState([]);

  const interestOptions = [
    'Campus Tour',
    'Academic Department',
    'Student Life',
    'Housing',
    'Athletics',
    'Financial Aid',
    'Admissions Interview'
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const visits = await loadUserVisits(user.uid);
          setPlannedVisits(visits);
        } catch (error) {
          console.error('Error loading visits:', error);
        }
      } else {
        setPlannedVisits([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to save visits');
      return;
    }

    if (selectedCollege && visitDate) {
      const newVisit = {
        college: selectedCollege,
        date: visitDate,
        interests: [...interests],
        createdAt: new Date().toISOString()
      };

      try {
        const userVisitsRef = collection(db, 'users', auth.currentUser.uid, 'plannedVisits');
        const docRef = await addDoc(userVisitsRef, newVisit);
        setPlannedVisits([...plannedVisits, { ...newVisit, id: docRef.id }]);
        setSelectedCollege('');
        setVisitDate('');
        setInterests([]);
      } catch (error) {
        console.error('Error adding visit:', error);
      }
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const removeVisit = async (id) => {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return;
    }

    try {
      const visitRef = doc(db, 'users', auth.currentUser.uid, 'plannedVisits', id);
      await deleteDoc(visitRef);
      setPlannedVisits(plannedVisits.filter(visit => visit.id !== id));
    } catch (error) {
      console.error('Error removing visit:', error);
      if (error.code === 'permission-denied') {
        console.error('Permission denied. Please check Firestore rules.');
      }
    }
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header 
        className={styles.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className={styles.title}>College Visit Planner</h1>
        <p className={styles.subtitle}>Plan and organize your college visits</p>
        <Link to="/college-selection" className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to College Selection
        </Link>
      </motion.header>

      <div className={styles.content}>
        <motion.form 
          className={styles.planForm}
          onSubmit={handleAddVisit}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={styles.sectionTitle}>
            <Plus size={24} />
            Add New Visit
          </h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="college">College Name</label>
            <input
              id="college"
              type="text"
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              placeholder="Enter college name"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="visitDate">Visit Date</label>
            <input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.interestsSection}>
            <label>Areas of Interest</label>
            <div className={styles.interestTags}>
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`${styles.interestTag} ${
                    interests.includes(interest) ? styles.selected : ''
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            <Plus size={20} />
            Add to Visit Schedule
          </button>
        </motion.form>

        <motion.div 
          className={styles.visitsTimeline}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>
            <Calendar size={24} />
            Planned Visits  
          </h2>
          {plannedVisits.length === 0 ? (
            <div className={styles.noVisits}>
              <Clock size={48} />
              <p>No visits planned yet</p>
              <p>Start by adding your first college visit above!</p>
            </div>
          ) : (
            <div className={styles.timelineItems}>
              {plannedVisits.map((visit, index) => (
                <motion.div 
                  key={visit.id} 
                  className={styles.timelineItem}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={styles.timelineDate}>
                    <MapPin size={20} />
                    {new Date(visit.date).toLocaleDateString(undefined, {
                      timeZone: 'UTC',
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.plannedVisitCard}>
                      <h3>{visit.college}</h3>
                      <div className={styles.visitDetails}>
                        <p><strong>Date:</strong> {new Date(visit.date).toLocaleDateString()}</p>
                        <div className={styles.visitInterests}>
                          <strong>Interests:</strong>
                          <div className={styles.interestBadges}>
                            {visit.interests.map((interest, i) => (
                              <span key={i} className={styles.interestBadge}>
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeVisit(visit.id)}
                        className={styles.removeButton}
                      >
                        <Trash2 size={16} />
                        Remove Visit
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CollegeVisitPlanner;
