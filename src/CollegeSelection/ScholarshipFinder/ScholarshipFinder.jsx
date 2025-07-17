import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArrowLeft, Sparkles, Search, GraduationCap, MapPin, DollarSign, Users, Calendar, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ScholarshipFinder.module.css";

const ScholarshipFinder = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
  );

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
      // Construct a detailed prompt for AI
      const prompt = `
        As a scholarship advisor, generate a list of 6 scholarship opportunities tailored to these preferences:
        - Academic Field: ${preferences.academicField}
        - Location: ${preferences.location}
        - Financial Need: ${preferences.financialNeed}
        - Merit-Based: ${preferences.meritBased}
        - Minority Group Considerations: ${preferences.minorityGroups}
        - Application Deadline Range: ${preferences.deadlineRange}

        For each scholarship, provide:
        1. Scholarship Name
        2. Eligibility Criteria
        3. Award Amount
        4. Application Deadline
        5. Application Link

        Respond in a strict JSON format with these exact keys:
        [
          {
            "scholarshipName": "",
            "eligibilityCriteria": "",
            "awardAmount": 0,
            "applicationDeadline": "",
            "applicationLink": ""
          }
        ]
      `;

      // Generate content using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response (Gemini sometimes wraps JSON in markdown)
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/);
      const recommendationsData = jsonMatch
        ? JSON.parse(jsonMatch[1])
        : JSON.parse(text);

      // Set recommendations
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
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
