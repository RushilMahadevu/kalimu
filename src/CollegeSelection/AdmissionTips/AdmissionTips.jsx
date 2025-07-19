import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, User, Award, BookOpen, Target, Lightbulb, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import aiService from "../../services/AIService";
import { useUserProfile } from "../../hooks/useUserProfile";
import styles from './AdmissionTips.module.css';

const AdmissionProfile = () => {
  const { profile, updateProfile } = useUserProfile();

  // State for user profile
  const [profileData, setProfileData] = useState({
    gpa: '',
    testScores: '',
    extracurriculars: '',
    academicInterest: '',
    challengedBackground: ''
  });

  // State for AI-generated tips
  const [admissionTips, setAdmissionTips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data from user profile on mount
  useEffect(() => {
    if (profile.academic || profile.extracurriculars || profile.background) {
      setProfileData(prev => ({
        ...prev,
        gpa: profile.academic?.currentGPA?.toString() || prev.gpa,
        testScores: [
          profile.academic?.testScores?.sat && `SAT ${profile.academic.testScores.sat}`,
          profile.academic?.testScores?.act && `ACT ${profile.academic.testScores.act}`
        ].filter(Boolean).join(', ') || prev.testScores,
        extracurriculars: profile.extracurriculars?.activities?.slice(0, 3).join(', ') || prev.extracurriculars,
        academicInterest: profile.academic?.major || profile.collegePreferences?.academicInterest || prev.academicInterest,
        challengedBackground: profile.background?.challenges || prev.challengedBackground,
      }));
    }
  }, [profile]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate personalized admission tips
  const generateAdmissionTips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save current profile data back to user profile
      await updateProfile('academic', {
        currentGPA: parseFloat(profileData.gpa) || 0,
        major: profileData.academicInterest,
        testScores: {
          ...profile.academic?.testScores,
          sat: profileData.testScores.match(/SAT (\d+)/)?.[1] || profile.academic?.testScores?.sat,
          act: profileData.testScores.match(/ACT (\d+)/)?.[1] || profile.academic?.testScores?.act,
        }
      }, { merge: true });

      await updateProfile('extracurriculars', {
        activities: profileData.extracurriculars ? profileData.extracurriculars.split(',').map(s => s.trim()) : []
      }, { merge: true });

      await updateProfile('background', {
        challenges: profileData.challengedBackground
      }, { merge: true });

      const tipsData = await aiService.generateAdmissionTips(profileData, profile);
      setAdmissionTips(tipsData);
    } catch (err) {
      console.error("Failed to generate admission tips", err);
      setError(err.message || "Failed to generate tips. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.admissionContainer}>
      {/* Header */}
      <motion.header 
        className={styles.admissionHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>AI-Powered Admission Strategy</span>
            </div>
            <h1 className={styles.admissionTitle}>Admission Tips</h1>
            <p className={styles.admissionSubtitle}>
              Get personalized strategies to strengthen your college application
            </p>
          </div>
          
          <Link to="/college-selection" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to College Selection
          </Link>
        </div>
      </motion.header>

      {/* Profile Form */}
      <motion.section 
        className={styles.formSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Tell Us About Your Academic Profile</h2>
          
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="gpa" className={styles.label}>
                <TrendingUp size={18} />
                Current GPA
              </label>
              <input
                id="gpa"
                type="text"
                className={styles.input}
                placeholder="e.g., 3.7, 4.2"
                value={profileData.gpa}
                onChange={(e) => handleInputChange("gpa", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="testScores" className={styles.label}>
                <Award size={18} />
                Standardized Test Scores
              </label>
              <input
                id="testScores"
                type="text"
                className={styles.input}
                placeholder="e.g., SAT 1450, ACT 32"
                value={profileData.testScores}
                onChange={(e) => handleInputChange("testScores", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="extracurriculars" className={styles.label}>
                <User size={18} />
                Key Extracurricular Activities
              </label>
              <input
                id="extracurriculars"
                type="text"
                className={styles.input}
                placeholder="e.g., Debate Club President, Robotics Team"
                value={profileData.extracurriculars}
                onChange={(e) => handleInputChange("extracurriculars", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="academicInterest" className={styles.label}>
                <BookOpen size={18} />
                Primary Academic Interest
              </label>
              <input
                id="academicInterest"
                type="text"
                className={styles.input}
                placeholder="e.g., Computer Science, Biomedical Engineering"
                value={profileData.academicInterest}
                onChange={(e) => handleInputChange("academicInterest", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="challengedBackground" className={styles.label}>
                <Target size={18} />
                Any Unique Challenges?
              </label>
              <input
                id="challengedBackground"
                type="text"
                className={styles.input}
                placeholder="e.g., First-generation student, Economic constraints"
                value={profileData.challengedBackground}
                onChange={(e) => handleInputChange("challengedBackground", e.target.value)}
              />
            </div>
          </div>

          <motion.button
            className={styles.submitButton}
            onClick={generateAdmissionTips}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Generating Strategies...
              </>
            ) : (
              <>
                <Lightbulb size={20} />
                Get My Admission Tips
              </>
            )}
          </motion.button>

          {error && (
            <motion.div 
              className={styles.errorMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Tips */}
      <AnimatePresence>
        {admissionTips.length > 0 && (
          <motion.section 
            className={styles.tipsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.tipsHeader}>
              <h2 className={styles.tipsTitle}>Personalized Admission Strategies</h2>
              <p className={styles.tipsSubtitle}>
                Tailored strategies to strengthen your college applications
              </p>
            </div>
            
            <div className={styles.tipsGrid}>
              {admissionTips.map((tip, index) => (
                <motion.div
                  key={index}
                  className={styles.tipCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.tipHeader}>
                    <h3 className={styles.tipTitle}>{tip.tipTitle}</h3>
                  </div>
                  
                  <div className={styles.tipContent}>
                    <div className={styles.tipSection}>
                      <h4>Strategy</h4>
                      <p>{tip.tipDescription}</p>
                    </div>
                    
                    <div className={styles.tipSection}>
                      <h4>Why This Works</h4>
                      <p>{tip.strategicRationale}</p>
                    </div>
                    
                    <div className={styles.impactSection}>
                      <h4>Potential Impact</h4>
                      <p>{tip.potentialImpact}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdmissionProfile;