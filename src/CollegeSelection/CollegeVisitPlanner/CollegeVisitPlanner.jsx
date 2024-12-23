import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ClipboardCheck } from 'lucide-react';
import { auth, db, loadUserVisits } from '../../../firebase.js';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
    <div className={styles.plannerContainer}>
      <header className={styles.header}>
        <h1>College Visit Planner</h1>
        <Link to="/college-selection" className={styles.backButton}>
          Back to College Selection
        </Link>
      </header>

      <div className={styles.content}>
        <form className={styles.planForm} onSubmit={handleAddVisit}>
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
            Add to Visit Schedule
          </button>
        </form>

        <div className={styles.visitsTimeline}>
          <h2>
            <Calendar className={styles.timelineIcon} />
            Planned Visits
          </h2>
          {plannedVisits.length === 0 ? (
            <p className={styles.noVisits}>No visits planned yet</p>
          ) : (
            <div className={styles.timelineItems}>
              {plannedVisits.map((visit) => (
                <div key={visit.id} className={styles.timelineItem}>
                  <div className={styles.timelineDate}>
                    <MapPin className={styles.dateIcon} />
                    {new Date(visit.date).toLocaleDateString()}
                  </div>
                  <div className={styles.timelineContent}>
                    <h3>{visit.college}</h3>
                    <div className={styles.visitInterests}>
                      {visit.interests.map((interest) => (
                        <span key={interest} className={styles.interestBadge}>
                          {interest}
                        </span>
                      ))}
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeVisit(visit.id)}
                    >
                      Remove Visit
                    </button>
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

export default CollegeVisitPlanner;
