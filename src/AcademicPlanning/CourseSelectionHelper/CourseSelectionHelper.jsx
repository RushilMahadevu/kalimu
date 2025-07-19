import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { aiService } from "../../services/AIService";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ArrowLeft, Sparkles, Search, BookOpen, GraduationCap, Target, Brain, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./CourseSelectionHelper.css";

const CourseSelectionHelper = () => {
  const { profile, updateProfile } = useUserProfile();

  const [preferences, setPreferences] = useState({
    major: "",
    year: "freshman",
    interests: "",
    academicGoals: "",
    currentGPA: 4.0,
    courseLoad: "normal",
  });

  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load preferences from user profile on mount
  useEffect(() => {
    if (profile.academic || profile.studyProfile) {
      setPreferences(prev => ({
        ...prev,
        major: profile.academic?.major || prev.major,
        interests: profile.academic?.interests?.join(', ') || prev.interests,
        academicGoals: profile.academic?.academicGoals || prev.academicGoals,
        currentGPA: profile.academic?.currentGPA || prev.currentGPA,
        courseLoad: profile.academic?.courseLoad || prev.courseLoad,
      }));
    }
  }, [profile]);

  const handleInputChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save current preferences to user profile
      await updateProfile('academic', {
        major: preferences.major,
        interests: preferences.interests ? preferences.interests.split(',').map(s => s.trim()) : [],
        academicGoals: preferences.academicGoals,
        currentGPA: preferences.currentGPA,
        courseLoad: preferences.courseLoad
      }, { merge: true });

      const recommendationsData = await aiService.generateCourseRecommendations(preferences, profile);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError(err.message || "Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="course-helper-container">
      {/* Header */}
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="title-section">
            <div className="title-badge">
              <Sparkles size={16} />
              <span>AI-Powered Course Selection</span>
            </div>
            <h1 className="page-title">Course Selection Helper</h1>
            <p className="page-subtitle">
              Get personalized course recommendations based on your academic goals and interests
            </p>
          </div>
          
          <Link to="/academic-planning" className="back-button">
            <ArrowLeft size={20} />
            Back to Academic Planning
          </Link>
        </div>
      </motion.header>

      {/* Form Section */}
      <motion.section 
        className="form-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="preferences-form">
          <h2 className="form-title">Tell Us About Your Academic Goals</h2>
          
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="major">
                <GraduationCap size={18} />
                Major/Field of Study
              </label>
              <input
                id="major"
                type="text"
                className="input"
                placeholder="e.g., Computer Science, Biology, Psychology"
                value={preferences.major}
                onChange={(e) => handleInputChange("major", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="year">
                <BookOpen size={18} />
                Academic Year
              </label>
              <select
                id="year"
                className="select"
                value={preferences.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
              >
                <option value="freshman">Freshman</option>
                <option value="sophomore">Sophomore</option>
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="interests">
                <Brain size={18} />
                Areas of Interest
              </label>
              <input
                id="interests"
                type="text"
                className="input"
                placeholder="e.g., AI, Web Development, Data Science"
                value={preferences.interests}
                onChange={(e) => handleInputChange("interests", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="academicGoals">
                <Target size={18} />
                Academic Goals
              </label>
              <input
                id="academicGoals"
                type="text"
                className="input"
                placeholder="e.g., Prepare for graduate school, Focus on industry skills"
                value={preferences.academicGoals}
                onChange={(e) => handleInputChange("academicGoals", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="courseLoad">
                <Clock size={18} />
                Preferred Course Load
              </label>
              <select
                id="courseLoad"
                className="select"
                value={preferences.courseLoad}
                onChange={(e) => handleInputChange("courseLoad", e.target.value)}
              >
                <option value="light">Light (12-13 credits)</option>
                <option value="normal">Normal (14-16 credits)</option>
                <option value="heavy">Heavy (17-18 credits)</option>
              </select>
            </div>
          </div>

          <motion.button
            className="submit-button"
            onClick={generateRecommendations}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Generating Recommendations...
              </>
            ) : (
              <>
                <Search size={20} />
                Get Course Recommendations
              </>
            )}
          </motion.button>

          {error && (
            <motion.div 
              className="error-message"
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
            className="recommendations-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="recommendations-header">
              <h2 className="recommendations-title">Recommended Courses</h2>
              <p className="recommendations-subtitle">
                Based on your preferences, here are your personalized course recommendations
              </p>
            </div>
            
            <div className="recommendations-grid">
              {recommendations.map((course, index) => (
                <motion.div
                  key={index}
                  className="recommendation-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <h3>{course.courseName}</h3>
                  <div className="course-code">{course.courseCode}</div>
                  <p>{course.description}</p>
                  
                  <div className="course-details">
                    <div className="course-section">
                      <h4>Learning Outcomes</h4>
                      <p>{course.outcomes}</p>
                    </div>
                    
                    <div className="course-section">
                      <h4>Prerequisites</h4>
                      <p>{course.prerequisites}</p>
                    </div>
                    
                    <div className="course-section">
                      <h4>Career Relevance</h4>
                      <p>{course.careerRelevance}</p>
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

export default CourseSelectionHelper;
