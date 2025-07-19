import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  AlertTriangle, 
  User, 
  CheckCircle, 
  ArrowRight, 
  X,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProfileCompletionWarning.module.css';

const ProfileCompletionWarning = ({ 
  isOpen, 
  onClose, 
  missingFields, 
  suggestions, 
  courseName,
  onContinueAnyway 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 50 }
  };

  const listVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div 
            className={styles.modal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.iconWrapper}>
                <AlertTriangle className={styles.warningIcon} size={24} />
              </div>
              <div className={styles.headerContent}>
                <h2 className={styles.title}>Complete Your Profile</h2>
                <p className={styles.subtitle}>
                  To get the best experience from <strong>{courseName}</strong>, 
                  please complete a few more profile fields.
                </p>
              </div>
              <button 
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {/* Quick summary */}
              <div className={styles.summary}>
                <div className={styles.summaryIcon}>
                  <User size={20} />
                </div>
                <div className={styles.summaryText}>
                  <strong>{missingFields.length} fields</strong> need to be completed 
                  for optimal course recommendations
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <h4>Why this helps:</h4>
                  <ul>
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <CheckCircle size={16} className={styles.suggestionIcon} />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing fields details */}
              <div className={styles.detailsSection}>
                <button 
                  className={styles.detailsToggle}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <span>View missing fields ({missingFields.length})</span>
                  <motion.div
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight size={16} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      className={styles.missingFieldsList}
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {missingFields.map((field, index) => (
                        <div key={index} className={styles.missingField}>
                          <div className={styles.fieldIcon}>
                            <AlertTriangle size={14} />
                          </div>
                          <span className={styles.fieldName}>
                            {field.displayName}
                          </span>
                          <span className={styles.fieldSection}>
                            {field.section}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Link 
                to="/profile-manager" 
                className={styles.primaryButton}
                onClick={onClose}
              >
                <User size={18} />
                Complete Profile
              </Link>
              
              <button 
                className={styles.secondaryButton}
                onClick={() => {
                  onContinueAnyway();
                  onClose();
                }}
              >
                <BookOpen size={18} />
                Continue Anyway
              </button>
            </div>

            {/* Footer note */}
            <div className={styles.footer}>
              <p>
                Don&apos;t worry - you can complete your profile anytime and 
                return to get personalized recommendations!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ProfileCompletionWarning.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  missingFields: PropTypes.arrayOf(PropTypes.shape({
    section: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  })).isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  courseName: PropTypes.string.isRequired,
  onContinueAnyway: PropTypes.func.isRequired
};

export default ProfileCompletionWarning;
