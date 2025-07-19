import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { aiService } from "../../services/AIService";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ArrowLeft, Sparkles, Search, GraduationCap, MapPin, DollarSign, Users, Calendar, Award, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ScholarshipFinder.module.css";

const ScholarshipFinder = () => {
  const { profile, updateProfile, saveItem } = useUserProfile();

  // State for user preferences
  const [preferences, setPreferences] = useState({
    academicField: "",
    location: "",
    financialNeed: false,
    meritBased: false,
    minorityGroups: "",
    deadlineRange: "",
  });

  // State for AI recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedScholarships, setSavedScholarships] = useState(new Set());

  // Load preferences from user profile on mount
  useEffect(() => {
    if (profile.scholarshipPreferences) {
      setPreferences(prev => ({
        ...prev,
        academicField: profile.scholarshipPreferences.academicField || prev.academicField,
        location: profile.scholarshipPreferences.location || prev.location,
        financialNeed: profile.scholarshipPreferences.financialNeed ?? prev.financialNeed,
        meritBased: profile.scholarshipPreferences.meritBased ?? prev.meritBased,
        minorityGroups: profile.scholarshipPreferences.minorityGroups || prev.minorityGroups,
        deadlineRange: profile.scholarshipPreferences.applicationDeadlines || prev.deadlineRange,
      }));
    }

    // Initialize saved scholarships
    if (profile.scholarshipPreferences?.savedScholarships) {
      setSavedScholarships(new Set(profile.scholarshipPreferences.savedScholarships.map(s => s.scholarshipName)));
    }
  }, [profile]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate AI recommendations
  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save current preferences to user profile
      await updateProfile('scholarshipPreferences', {
        academicField: preferences.academicField,
        location: preferences.location,
        financialNeed: preferences.financialNeed,
        meritBased: preferences.meritBased,
        minorityGroups: preferences.minorityGroups,
        applicationDeadlines: preferences.deadlineRange
      }, { merge: true });

      const recommendationsData = await aiService.generateScholarshipRecommendations(preferences, profile);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError(err.message || "Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save/unsave scholarship
  const toggleSaveScholarship = async (scholarship) => {
    const isCurrentlySaved = savedScholarships.has(scholarship.scholarshipName);
    
    try {
      if (isCurrentlySaved) {
        // Remove from saved
        const updatedSaved = profile.scholarshipPreferences?.savedScholarships?.filter(
          s => s.scholarshipName !== scholarship.scholarshipName
        ) || [];
        await updateProfile('scholarshipPreferences', { savedScholarships: updatedSaved }, { merge: true });
        setSavedScholarships(prev => {
          const newSet = new Set(prev);
          newSet.delete(scholarship.scholarshipName);
          return newSet;
        });
      } else {
        // Add to saved
        await saveItem('scholarship', {
          ...scholarship,
          id: scholarship.scholarshipName.replace(/\s+/g, '-').toLowerCase(),
          scholarshipName: scholarship.scholarshipName
        });
        setSavedScholarships(prev => new Set([...prev, scholarship.scholarshipName]));
      }
    } catch (err) {
      console.error('Error saving/unsaving scholarship:', err);
    }
  };

  return (
    <div className={styles.scholarshipContainer}>
      {/* Header */}
      <motion.header 
        className={styles.scholarshipHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>AI-Powered Scholarship Discovery</span>
            </div>
            <h1 className={styles.scholarshipTitle}>Scholarship Finder</h1>
            <p className={styles.scholarshipSubtitle}>
              Discover personalized scholarship opportunities tailored to your profile
            </p>
          </div>
          
          <Link to="/college-selection" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to College Selection
          </Link>
        </div>
      </motion.header>

      {/* Preferences Form */}
      <motion.section 
        className={styles.formSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Tell Us About Your Preferences</h2>
          
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="academicField" className={styles.label}>
                <GraduationCap size={18} />
                Academic Field
              </label>
              <input
                id="academicField"
                type="text"
                className={styles.input}
                placeholder="e.g., Engineering, Medicine, Business"
                value={preferences.academicField}
                onChange={(e) => handleInputChange("academicField", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="location" className={styles.label}>
                <MapPin size={18} />
                Preferred Location
              </label>
              <input
                id="location"
                type="text"
                className={styles.input}
                placeholder="e.g., United States, California, International"
                value={preferences.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences.financialNeed}
                  onChange={(e) => handleInputChange("financialNeed", e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  <DollarSign size={16} />
                  Financial Need Based
                </span>
              </label>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences.meritBased}
                  onChange={(e) => handleInputChange("meritBased", e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  <Award size={16} />
                  Merit Based
                </span>
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="minorityGroups" className={styles.label}>
                <Users size={18} />
                Minority Groups
              </label>
              <input
                id="minorityGroups"
                type="text"
                className={styles.input}
                placeholder="e.g., Women, Hispanic, First-generation"
                value={preferences.minorityGroups}
                onChange={(e) => handleInputChange("minorityGroups", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="deadlineRange" className={styles.label}>
                <Calendar size={18} />
                Deadline Range
              </label>
              <input
                id="deadlineRange"
                type="text"
                className={styles.input}
                placeholder="e.g., Jan 2024 - Mar 2024"
                value={preferences.deadlineRange}
                onChange={(e) => handleInputChange("deadlineRange", e.target.value)}
              />
            </div>
          </div>

          <motion.button
            className={styles.submitButton}
            onClick={generateRecommendations}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Finding Scholarships...
              </>
            ) : (
              <>
                <Search size={20} />
                Find Scholarships
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

      {/* Recommendations */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.section 
            className={styles.recommendationsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.recommendationsHeader}>
              <h2 className={styles.recommendationsTitle}>Your Scholarship Recommendations</h2>
              <p className={styles.recommendationsSubtitle}>
                Personalized scholarship opportunities based on your profile
              </p>
            </div>
            
            <div className={styles.recommendationsGrid}>
              {recommendations.map((scholarship, index) => (
                <motion.div
                  key={index}
                  className={styles.recommendationCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.scholarshipName}>{scholarship.scholarshipName}</h3>
                    <div className={styles.amountBadge}>
                      ${scholarship.awardAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.eligibilitySection}>
                      <h4>Eligibility</h4>
                      <p>{scholarship.eligibilityCriteria}</p>
                    </div>
                    
                    <div className={styles.deadlineSection}>
                      <h4>Application Deadline</h4>
                      <p>{scholarship.applicationDeadline}</p>
                    </div>
                    
                    <div className={styles.linkSection}>
                      <a 
                        href={scholarship.applicationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.applicationLink}
                      >
                        Apply Now
                      </a>
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

export default ScholarshipFinder;
