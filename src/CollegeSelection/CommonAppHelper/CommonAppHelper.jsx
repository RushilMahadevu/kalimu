import React, { useState } from "react";
import { Link } from "react-router-dom";
import { aiService } from "../../services/AIService";
import { ArrowLeft, Sparkles, FileText, Edit3, MessageCircle, CheckCircle, Lightbulb, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CommonAppHelper.module.css";

const CommonAppHelper = () => {
  // State for essay details
  const [essayDetails, setEssayDetails] = useState({
    prompt: "",
    draftContent: "",
    tone: "personal",
    theme: "",
  });

  // State for AI feedback
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for expanded cards
  const [expandedCard, setExpandedCard] = useState(null);

  // Calculate word count
  const wordCount = essayDetails.draftContent
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEssayDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate AI feedback
  const generateFeedback = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const feedbackData = await aiService.generateEssayFeedback(essayDetails);
      setFeedback(feedbackData);
    } catch (err) {
      console.error("Failed to generate feedback:", err);
      setError(err.message || "Failed to generate feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.commonAppContainer}>
      {/* Header */}
      <motion.header 
        className={styles.commonAppHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>AI-Powered Essay Analysis</span>
            </div>
            <h1 className={styles.commonAppTitle}>Common App Helper</h1>
            <p className={styles.commonAppSubtitle}>
              Get expert feedback on your Common Application essays
            </p>
          </div>
          
          <Link to="/college-selection" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to College Selection
          </Link>
        </div>
      </motion.header>

      {/* Essay Form */}
      <motion.section 
        className={styles.formSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Essay Details</h2>
          
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="prompt" className={styles.label}>
                <FileText size={18} />
                Selected Essay Prompt
              </label>
              <input
                id="prompt"
                type="text"
                className={styles.input}
                placeholder="Enter your chosen Common App prompt"
                value={essayDetails.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="tone" className={styles.label}>
                <MessageCircle size={18} />
                Desired Tone
              </label>
              <select
                id="tone"
                className={styles.select}
                value={essayDetails.tone}
                onChange={(e) => handleInputChange("tone", e.target.value)}
              >
                <option value="personal">Personal & Reflective</option>
                <option value="academic">Academic & Professional</option>
                <option value="narrative">Narrative & Storytelling</option>
                <option value="analytical">Analytical & Thoughtful</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="theme" className={styles.label}>
                <User size={18} />
                Main Theme/Message
              </label>
              <input
                id="theme"
                type="text"
                className={styles.input}
                placeholder="e.g., Personal growth through challenge"
                value={essayDetails.theme}
                onChange={(e) => handleInputChange("theme", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.essayGroup}>
            <label htmlFor="draftContent" className={styles.essayLabel}>
              <Edit3 size={18} />
              <span>Essay Draft</span>
              <div className={styles.wordCount}>
                Words: {wordCount}
              </div>
            </label>
            <textarea
              id="draftContent"
              className={styles.essayTextarea}
              placeholder="Paste your essay draft here..."
              value={essayDetails.draftContent}
              onChange={(e) => handleInputChange("draftContent", e.target.value)}
            />
          </div>

          <motion.button
            className={styles.submitButton}
            onClick={generateFeedback}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Analyzing Essay...
              </>
            ) : (
              <>
                <Lightbulb size={20} />
                Get Expert Feedback
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

      {/* Feedback */}
      <AnimatePresence>
        {feedback.length > 0 && (
          <motion.section 
            className={styles.feedbackSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.feedbackHeader}>
              <h2 className={styles.feedbackTitle}>Essay Analysis & Feedback</h2>
              <p className={styles.feedbackSubtitle}>
                Professional insights to improve your essay
              </p>
            </div>
            
            <div className={styles.feedbackGrid}>
              {feedback.map((item, index) => (
                <motion.div
                  key={index}
                  className={`${styles.feedbackCard} ${expandedCard === index ? styles.expanded : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.aspectTitle}>{item.aspectTitle}</h3>
                    <div className={styles.expandIcon}>
                      {expandedCard === index ? <CheckCircle size={20} /> : <Edit3 size={20} />}
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.analysisSection}>
                      <h4>Analysis</h4>
                      <p>{item.analysis}</p>
                    </div>
                    
                    <div className={styles.strengthsSection}>
                      <h4>Strengths</h4>
                      <p>{item.strengthsIdentified}</p>
                    </div>
                    
                    <div className={styles.suggestionsSection}>
                      <h4>Suggestions</h4>
                      <p>{item.improvementSuggestions}</p>
                    </div>
                    
                    {item.examples && item.examples.trim() !== "" && (
                      <div className={styles.examplesSection}>
                        <h4>Examples</h4>
                        <p>{item.examples}</p>
                      </div>
                    )}
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

export default CommonAppHelper;
