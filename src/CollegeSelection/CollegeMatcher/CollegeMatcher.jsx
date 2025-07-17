import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArrowLeft, Sparkles, Search, MapPin, DollarSign, Users, BookOpen, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CollegeMatcher.module.css";

const CollegeMatcher = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
  );

  // State for user preferences
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
        As an expert college counselor, generate a list of 6 college recommendations based on these student preferences:
        - Academic Interest: ${preferences.academicInterest}
        - Preferred Location: ${preferences.location}
        - Budget: $${preferences.budget}
        - Campus Size: ${preferences.campusSize}
        - Special Wants/Considerations: ${preferences.specialNeeds}

        For each college, provide:
        1. College Name
        2. Precise match to student's preferences
        3. Estimated annual cost
        4. Top 3 academic strengths
        5. Unique opportunities that align with the student's goals

        Respond in a strict JSON format with these exact keys:
        [
          {
            "collegeName": "",
            "matchReason": "",
            "estimatedCost": 0,
            "keyStrengths": "",
            "uniqueOpportunities": ""
          }
        ]
        
        Ensure all financial estimates are realistic and the recommendations are highly specific.
      `;

      // Generate content using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
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
                    <div className={styles.costBadge}>
                      ${college.estimatedCost.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.matchSection}>
                      <h4>Why It's a Great Match</h4>
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
