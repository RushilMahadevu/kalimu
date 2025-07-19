import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Search, MapPin, DollarSign, Users, BookOpen, Star, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import aiService from "../../services/AIService";
import { useUserProfile } from "../../hooks/useUserProfile";
import styles from "./CollegeMatcher.module.css";

const CollegeMatcher = () => {
  const { profile, updateProfile, saveItem } = useUserProfile();

  // Initialize preferences from user profile
  const [preferences, setPreferences] = useState({
    academicInterest: "",
    location: "",
    budget: 50000,
    campusSize: "medium",
    specialNeeds: "",
  });

  // State for AI recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedColleges, setSavedColleges] = useState(new Set());

  // Load preferences from user profile on mount
  useEffect(() => {
    if (profile.collegePreferences) {
      setPreferences(prev => ({
        ...prev,
        academicInterest: profile.collegePreferences.academicInterest || prev.academicInterest,
        location: profile.collegePreferences.preferredLocations?.[0] || prev.location,
        budget: profile.collegePreferences.budgetRange?.max || prev.budget,
        campusSize: profile.collegePreferences.campusSize || prev.campusSize,
        specialNeeds: profile.collegePreferences.importantFactors?.join(', ') || prev.specialNeeds,
      }));
    }

    // Initialize saved colleges
    if (profile.collegePreferences?.savedColleges) {
      setSavedColleges(new Set(profile.collegePreferences.savedColleges.map(c => c.collegeName)));
    }
  }, [profile]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate AI recommendations with profile integration
  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save current preferences to user profile
      await updateProfile('collegePreferences', {
        academicInterest: preferences.academicInterest,
        preferredLocations: preferences.location ? [preferences.location] : [],
        budgetRange: { ...profile.collegePreferences?.budgetRange, max: preferences.budget },
        campusSize: preferences.campusSize,
        importantFactors: preferences.specialNeeds ? preferences.specialNeeds.split(',').map(s => s.trim()) : []
      }, { merge: true });

      // Generate recommendations with user profile context
      const recommendationsData = await aiService.generateCollegeRecommendations(preferences, profile);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError(err.message || "Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save/unsave college
  const toggleSaveCollege = async (college) => {
    const isCurrentlySaved = savedColleges.has(college.collegeName);
    
    try {
      if (isCurrentlySaved) {
        // Remove from saved
        const updatedSaved = profile.collegePreferences?.savedColleges?.filter(
          c => c.collegeName !== college.collegeName
        ) || [];
        await updateProfile('collegePreferences', { savedColleges: updatedSaved }, { merge: true });
        setSavedColleges(prev => {
          const newSet = new Set(prev);
          newSet.delete(college.collegeName);
          return newSet;
        });
      } else {
        // Add to saved
        await saveItem('college', {
          ...college,
          id: college.collegeName.replace(/\s+/g, '-').toLowerCase(),
          collegeName: college.collegeName
        });
        setSavedColleges(prev => new Set([...prev, college.collegeName]));
      }
    } catch (err) {
      console.error('Error saving/unsaving college:', err);
    }
  };

  return (
    <div className={styles.matcherContainer}>
      {/* Header */}
      <motion.header 
        className={styles.matcherHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>AI-Powered College Matching</span>
            </div>
            <h1 className={styles.matcherTitle}>College Matcher</h1>
            <p className={styles.matcherSubtitle}>
              Find your perfect college match with personalized AI recommendations
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
              <label htmlFor="academicInterest" className={styles.label}>
                <BookOpen size={18} />
                Academic Interest
              </label>
              <input
                id="academicInterest"
                type="text"
                className={styles.input}
                placeholder="e.g., Computer Science, Biology, Psychology"
                value={preferences.academicInterest}
                onChange={(e) => handleInputChange("academicInterest", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="location" className={styles.label}>
                <MapPin size={18} />
                Preferred Location
              </label>
              <select
                id="location"
                className={styles.select}
                value={preferences.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              >
                <option value="">Select Region</option>
                <option value="Northeast">Northeast</option>
                <option value="Southeast">Southeast</option>
                <option value="Midwest">Midwest</option>
                <option value="West">West Coast</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="budget" className={styles.label}>
                <DollarSign size={18} />
                Annual Budget: ${preferences.budget.toLocaleString()}
              </label>
              <input
                id="budget"
                type="range"
                className={styles.slider}
                min="10000"
                max="100000"
                step="1000"
                value={preferences.budget}
                onChange={(e) => handleInputChange("budget", Number(e.target.value))}
              />
              <div className={styles.sliderLabels}>
                <span>$10K</span>
                <span>$100K</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="campusSize" className={styles.label}>
                <Users size={18} />
                Campus Size
              </label>
              <select
                id="campusSize"
                className={styles.select}
                value={preferences.campusSize}
                onChange={(e) => handleInputChange("campusSize", e.target.value)}
              >
                <option value="small">Small (&lt; 5,000 students)</option>
                <option value="medium">Medium (5,000-15,000 students)</option>
                <option value="large">Large (&gt; 15,000 students)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="specialNeeds" className={styles.label}>
                <Star size={18} />
                Specific Wants/Needs
              </label>
              <input
                id="specialNeeds"
                type="text"
                className={styles.input}
                placeholder="e.g., Need-based aid, Research opportunities, Greek life"
                value={preferences.specialNeeds}
                onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
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
                Generating Recommendations...
              </>
            ) : (
              <>
                <Search size={20} />
                Find My Perfect Colleges
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
              <h2 className={styles.recommendationsTitle}>Your College Recommendations</h2>
              <p className={styles.recommendationsSubtitle}>
                Based on your preferences, here are your personalized matches
              </p>
            </div>
            
            <div className={styles.recommendationsGrid}>
              {recommendations.map((college, index) => (
                <motion.div
                  key={index}
                  className={styles.recommendationCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.collegeName}>{college.collegeName}</h3>
                    <div className={styles.headerActions}>
                      <div className={styles.costBadge}>
                        ${college.estimatedCost.toLocaleString()}
                      </div>
                      <motion.button
                        className={`${styles.saveButton} ${savedColleges.has(college.collegeName) ? styles.saved : ''}`}
                        onClick={() => toggleSaveCollege(college)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={savedColleges.has(college.collegeName) ? 'Remove from saved' : 'Save college'}
                      >
                        <Heart 
                          size={20} 
                          fill={savedColleges.has(college.collegeName) ? 'currentColor' : 'none'} 
                        />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.matchSection}>
                      <h4>Why It&apos;s a Great Match</h4>
                      <p>{college.matchReason}</p>
                    </div>
                    
                    <div className={styles.strengthsSection}>
                      <h4>Key Strengths</h4>
                      <p>{college.keyStrengths}</p>
                    </div>
                    
                    <div className={styles.opportunitiesSection}>
                      <h4>Unique Opportunities</h4>
                      <p>{college.uniqueOpportunities}</p>
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

export default CollegeMatcher;
