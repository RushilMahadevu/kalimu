import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  GraduationCap, 
  Target, 
  BookOpen, 
  Award, 
  Settings, 
  Download,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from './hooks/useUserProfile';
import styles from './ProfileManager.module.css';

const ProfileManager = () => {
  const { 
    profile, 
    updateProfile, 
    profileCompletion, 
    exportProfile,
    getRecommendations,
    loading 
  } = useUserProfile();

  const [activeSection, setActiveSection] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [savedFields, setSavedFields] = useState(new Set());
  const [localValues, setLocalValues] = useState({});
  const saveTimeouts = useRef({});

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = saveTimeouts.current;
    return () => {
      Object.values(timeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Handle field changes with debounced auto-save
  const handleFieldChange = useCallback((section, field, value) => {
    const fieldKey = `${section}.${field}`;
    
    // Update local state immediately for responsive UI
    setLocalValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear existing timeout
    if (saveTimeouts.current[fieldKey]) {
      clearTimeout(saveTimeouts.current[fieldKey]);
    }

    // Set new timeout for saving
    saveTimeouts.current[fieldKey] = setTimeout(async () => {
      setEditingField(fieldKey);
      setSaving(true);
      setSaveError(null);

      try {
        let valueToSave = value;
        
        // Handle array fields (tags)
        if (['interests', 'activities', 'preferredLocations', 'importantFactors', 'leadership', 'volunteering', 'awards'].includes(field)) {
          valueToSave = value.split(',').map(s => s.trim()).filter(Boolean);
        }
        
        // Handle numeric fields
        if (['currentGPA', 'targetGPA', 'graduationYear'].includes(field)) {
          valueToSave = value === '' ? 0 : parseFloat(value) || 0;
        }

        // Handle budget range (special case - already an object)
        if (field === 'budgetRange') {
          valueToSave = value; // Already formatted as { min, max }
        }

        await updateProfile(section, { [field]: valueToSave });
        
        // Show success feedback
        setSavedFields(prev => new Set([...prev, fieldKey]));
        setTimeout(() => {
          setSavedFields(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldKey);
            return newSet;
          });
        }, 2000);

        // Clear local value since it's now saved
        setLocalValues(prev => {
          const newValues = { ...prev };
          delete newValues[fieldKey];
          return newValues;
        });
      } catch (error) {
        console.error('Error saving field:', error);
        
        let errorMessage = `Failed to save ${field}.`;
        
        if (!isOnline) {
          errorMessage += ' You appear to be offline. Changes will sync when connection is restored.';
        } else if (error.code === 'permission-denied') {
          errorMessage += ' Permission denied. Please try signing out and signing back in.';
        } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
          errorMessage += ' Network request blocked (possibly by ad blocker). Please disable ad blocker for this site.';
        } else if (error.message.includes('network')) {
          errorMessage += ' Network connection issue. Please check your internet connection.';
        } else {
          errorMessage += ' Please try again in a moment.';
        }
        
        setSaveError(errorMessage);
      } finally {
        setSaving(false);
        setEditingField(null);
      }
    }, 2500); // Wait 1 second after user stops typing
  }, [updateProfile, isOnline]);

  // Handle blur events for immediate saving
  const handleFieldBlur = useCallback(async (section, field) => {
    const fieldKey = `${section}.${field}`;
    
    // If there's a pending save, execute it immediately
    if (saveTimeouts.current[fieldKey]) {
      clearTimeout(saveTimeouts.current[fieldKey]);
      
      const value = localValues[fieldKey];
      if (value !== undefined) {
        setEditingField(fieldKey);
        setSaving(true);
        setSaveError(null);

        try {
          let valueToSave = value;
          
          // Handle array fields (tags)
          if (['interests', 'activities', 'preferredLocations', 'importantFactors', 'leadership', 'volunteering', 'awards'].includes(field)) {
            valueToSave = value.split(',').map(s => s.trim()).filter(Boolean);
          }
          
          // Handle numeric fields
          if (['currentGPA', 'targetGPA', 'graduationYear'].includes(field)) {
            valueToSave = value === '' ? 0 : parseFloat(value) || 0;
          }

          // Handle budget range (special case - already an object)
          if (field === 'budgetRange') {
            valueToSave = value; // Already formatted as { min, max }
          }

          await updateProfile(section, { [field]: valueToSave });
          
          // Show success feedback
          setSavedFields(prev => new Set([...prev, fieldKey]));
          setTimeout(() => {
            setSavedFields(prev => {
              const newSet = new Set(prev);
              newSet.delete(fieldKey);
              return newSet;
            });
          }, 2000);

          // Clear local value since it's now saved
          setLocalValues(prev => {
            const newValues = { ...prev };
            delete newValues[fieldKey];
            return newValues;
          });
        } catch (error) {
          console.error('Error saving field on blur:', error);
          setSaveError(`Failed to save ${field}.`);
        } finally {
          setSaving(false);
          setEditingField(null);
        }
      }
    }
  }, [localValues, updateProfile]);

  // Retry saving a field
  const retrySave = async (section, field) => {
    const fieldKey = `${section}.${field}`;
    const value = localValues[fieldKey] ?? profile?.[section]?.[field] ?? '';
    const stringValue = Array.isArray(value) ? value.join(', ') : value;
    await handleFieldChange(section, field, stringValue);
  };

  // Profile sections configuration
  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic Profile', icon: GraduationCap },
    { id: 'college', label: 'College Preferences', icon: Target },
    { id: 'extracurriculars', label: 'Activities', icon: Award },
    { id: 'background', label: 'Background', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderField = (section, field, label, type = 'text', options = [], placeholder = '') => {
    const fieldKey = `${section}.${field}`;
    const profileValue = profile?.[section]?.[field] || '';
    const localValue = localValues[fieldKey];
    const value = localValue !== undefined ? localValue : profileValue;
    
    const hasError = saveError && editingField === fieldKey;
    const isSavingField = saving && editingField === fieldKey;
    const isRecentlySaved = savedFields.has(fieldKey);
    
    return (
      <div className={styles.fieldGroup} key={field}>
        <label className={styles.fieldLabel}>
          {label}
          {['firstName', 'lastName', 'email', 'currentGPA'].includes(field) && (
            <span className={styles.required}>*</span>
          )}
        </label>
        
        <div className={styles.inputContainer}>
          {type === 'select' ? (
            <select 
              value={value}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              onBlur={() => handleFieldBlur(section, field)}
              className={`${styles.selectInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
              disabled={isSavingField}
            >
              <option value="">Select {label}</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea 
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              onBlur={() => handleFieldBlur(section, field)}
              className={`${styles.textareaInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
              placeholder={placeholder}
              rows={3}
              disabled={isSavingField}
            />
          ) : type === 'number' ? (
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              onBlur={() => handleFieldBlur(section, field)}
              className={`${styles.numberInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
              placeholder={placeholder}
              step={field.includes('GPA') ? '0.01' : '1'}
              min={field.includes('GPA') ? '0' : undefined}
              max={field.includes('GPA') ? '4' : undefined}
              disabled={isSavingField}
            />
          ) : type === 'email' ? (
            <input
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              onBlur={() => handleFieldBlur(section, field)}
              className={`${styles.textInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
              placeholder={placeholder}
              disabled={isSavingField}
            />
          ) : type === 'tags' ? (
            <div className={styles.tagsInput}>
              <input
                type="text"
                value={Array.isArray(value) ? value.join(', ') : value}
                onChange={(e) => handleFieldChange(section, field, e.target.value)}
                onBlur={() => handleFieldBlur(section, field)}
                className={`${styles.textInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
                placeholder={placeholder}
                disabled={isSavingField}
              />
              <small className={styles.inputHint}>Separate multiple items with commas</small>
            </div>
          ) : (
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              onBlur={() => handleFieldBlur(section, field)}
              className={`${styles.textInput} ${hasError ? styles.error : ''} ${localValue !== undefined ? styles.modified : ''}`}
              placeholder={placeholder}
              disabled={isSavingField}
            />
          )}
          
          {isSavingField && (
            <div className={styles.savingIndicator}>
              <span className={styles.spinner}>⏳</span>
            </div>
          )}
          
          {isRecentlySaved && (
            <div className={styles.successIndicator}>
              <span>✅</span>
            </div>
          )}
        </div>
        
        {hasError && (
          <div className={styles.fieldError}>
            <span>{saveError}</span>
            <button 
              onClick={() => retrySave(section, field)}
              className={styles.retryButton}
              disabled={saving}
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPersonalSection = () => (
    <div className={styles.sectionContent}>
      <h3>Personal Information</h3>
      <div className={styles.formGrid}>
        {renderField('personalInfo', 'firstName', 'First Name', 'text', [], 'Enter your first name')}
        {renderField('personalInfo', 'lastName', 'Last Name', 'text', [], 'Enter your last name')}
        {renderField('personalInfo', 'email', 'Email Address', 'email', [], 'your.email@example.com')}
        {renderField('personalInfo', 'graduationYear', 'Expected Graduation Year', 'number', [], '2028')}
        {renderField('personalInfo', 'schoolName', 'School Name', 'text', [], 'Your High School Name')}
        {renderField('personalInfo', 'grade', 'Current Grade', 'select', ['9th Grade', '10th Grade', '11th Grade', '12th Grade'], 'Select your grade')}
      </div>
    </div>
  );

  const renderAcademicSection = () => (
    <div className={styles.sectionContent}>
      <h3>Academic Profile</h3>
      <div className={styles.formGrid}>
        {renderField('academic', 'currentGPA', 'Current GPA', 'number', [], '3.85')}
        {renderField('academic', 'targetGPA', 'Target GPA', 'number', [], '4.0')}
        {renderField('academic', 'major', 'Intended Major/Field of Study', 'text', [], 'Computer Science, Biology, etc.')}
        {renderField('academic', 'interests', 'Academic Interests', 'tags', [], 'Mathematics, Science, Literature, History')}
        {renderField('academic', 'academicGoals', 'Academic Goals', 'textarea', [], 'Describe your academic goals and aspirations...')}
        {renderField('academic', 'courseLoad', 'Preferred Course Load', 'select', ['Light', 'Normal', 'Heavy'], 'Select your preference')}
      </div>
    </div>
  );

  const renderCollegeSection = () => (
    <div className={styles.sectionContent}>
      <h3>College Preferences</h3>
      <div className={styles.formGrid}>
        {renderField('collegePreferences', 'academicInterest', 'Primary Academic Interest', 'text', [], 'Engineering, Liberal Arts, Business, etc.')}
        {renderField('collegePreferences', 'preferredLocations', 'Preferred Locations', 'tags', [], 'California, New York, Texas, International')}
        {renderField('collegePreferences', 'campusSize', 'Campus Size Preference', 'select', ['Small (< 5,000)', 'Medium (5,000 - 15,000)', 'Large (> 15,000)'], 'Select your preference')}
        {renderField('collegePreferences', 'importantFactors', 'Important Factors', 'tags', [], 'Academic reputation, Cost, Location, Campus culture')}
        
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Budget Range</label>
          <div className={styles.budgetInputs}>
            <div className={styles.budgetInput}>
              <label>Minimum ($)</label>
              <input
                type="number"
                value={localValues['collegePreferences.budgetRange']?.min ?? profile.collegePreferences?.budgetRange?.min ?? ''}
                onChange={(e) => {
                  const min = parseInt(e.target.value) || 0;
                  const max = localValues['collegePreferences.budgetRange']?.max ?? profile.collegePreferences?.budgetRange?.max ?? 0;
                  handleFieldChange('collegePreferences', 'budgetRange', { min, max });
                }}
                onBlur={() => handleFieldBlur('collegePreferences', 'budgetRange')}
                className={styles.numberInput}
                placeholder="0"
              />
            </div>
            <div className={styles.budgetInput}>
              <label>Maximum ($)</label>
              <input
                type="number"
                value={localValues['collegePreferences.budgetRange']?.max ?? profile.collegePreferences?.budgetRange?.max ?? ''}
                onChange={(e) => {
                  const max = parseInt(e.target.value) || 0;
                  const min = localValues['collegePreferences.budgetRange']?.min ?? profile.collegePreferences?.budgetRange?.min ?? 0;
                  handleFieldChange('collegePreferences', 'budgetRange', { min, max });
                }}
                onBlur={() => handleFieldBlur('collegePreferences', 'budgetRange')}
                className={styles.numberInput}
                placeholder="100000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExtracurricularsSection = () => (
    <div className={styles.sectionContent}>
      <h3>Extracurricular Activities</h3>
      <div className={styles.formGrid}>
        {renderField('extracurriculars', 'activities', 'Activities & Clubs', 'tags', [], 'Debate Team, Student Council, Drama Club, Sports')}
        {renderField('extracurriculars', 'leadership', 'Leadership Roles', 'tags', [], 'Class President, Team Captain, Club Leader')}
        {renderField('extracurriculars', 'volunteering', 'Volunteer Work', 'tags', [], 'Community Service, Tutoring, Environmental Projects')}
        {renderField('extracurriculars', 'awards', 'Awards & Recognition', 'tags', [], 'Academic Awards, Competition Wins, Honors')}
        {renderField('extracurriculars', 'workExperience', 'Work Experience', 'textarea', [], 'Describe any part-time jobs, internships, or work experience...')}
      </div>
    </div>
  );

  const renderBackgroundSection = () => (
    <div className={styles.sectionContent}>
      <h3>Personal Background</h3>
      <div className={styles.formGrid}>
        {renderField('background', 'familyEducation', 'Family Education Background', 'select', ['First Generation', 'Some College', 'College Graduate', 'Advanced Degree'], 'Select background')}
        {renderField('background', 'economicBackground', 'Economic Background', 'select', ['Low Income', 'Middle Income', 'Upper Middle Income', 'High Income'], 'Select background')}
        {renderField('background', 'challenges', 'Challenges & Obstacles', 'textarea', [], 'Describe any significant challenges you have overcome...')}
        {renderField('background', 'uniqueCircumstances', 'Unique Circumstances', 'textarea', [], 'Describe any unique circumstances that have shaped your experience...')}
        {renderField('background', 'culturalBackground', 'Cultural Background', 'text', [], 'Describe your cultural or ethnic background')}
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className={styles.sectionContent}>
      <h3>Settings & Preferences</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingGroup}>
          <h4>Notifications</h4>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={profile.settings?.notifications?.deadlines ?? true}
              onChange={(e) => updateProfile('settings', {
                notifications: { ...profile.settings?.notifications, deadlines: e.target.checked }
              }, { merge: true })}
            />
            Deadline Reminders
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={profile.settings?.notifications?.recommendations ?? true}
              onChange={(e) => updateProfile('settings', {
                notifications: { ...profile.settings?.notifications, recommendations: e.target.checked }
              }, { merge: true })}
            />
            AI Recommendations
          </label>
        </div>
        
        <div className={styles.settingGroup}>
          <h4>AI Preferences</h4>
          <label className={styles.selectLabel}>
            Personalization Level:
            <select
              value={profile.settings?.ai?.personalizationLevel || 'high'}
              onChange={(e) => updateProfile('settings', {
                ai: { ...profile.settings?.ai, personalizationLevel: e.target.value }
              }, { merge: true })}
              className={styles.settingSelect}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal': return renderPersonalSection();
      case 'academic': return renderAcademicSection();
      case 'college': return renderCollegeSection();
      case 'extracurriculars': return renderExtracurricularsSection();
      case 'background': return renderBackgroundSection();
      case 'settings': return renderSettingsSection();
      default: return null;
    }
  };

  const recommendations = getRecommendations();

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Network Status Indicator */}
      {!isOnline && (
        <motion.div 
          className={styles.offlineIndicator}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span>📡 You&apos;re currently offline. Changes will sync when connection is restored.</span>
        </motion.div>
      )}

      {/* Global Error Display */}
      {saveError && !editingField && (
        <motion.div 
          className={styles.globalError}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span>{saveError}</span>
          <button 
            onClick={() => setSaveError(null)}
            className={styles.dismissError}
            title="Dismiss"
          >
            ✗
          </button>
        </motion.div>
      )}

      {/* Header */}
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <Sparkles size={16} />
              <span>Profile Management</span>
            </div>
            <h1 className={styles.title}>Your Profile</h1>
            <p className={styles.subtitle}>
              Manage your information to get personalized recommendations
            </p>
          </div>
          
          <Link to="/learning" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
      </motion.header>

      {/* Progress & Actions */}
      <motion.section 
        className={styles.progressSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className={styles.progressCard}>
          <div className={styles.progressInfo}>
            <h3>Profile Completion</h3>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>{profileCompletion}% Complete</span>
          </div>
          
          <div className={styles.actions}>
            <button 
              onClick={exportProfile}
              className={styles.actionButton}
            >
              <Download size={20} />
              Export Profile
            </button>
            
            {recommendations.length > 0 && (
              <button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={styles.recommendationsButton}
              >
                <Target size={20} />
                Recommendations ({recommendations.length})
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Recommendations */}
      <AnimatePresence>
        {showRecommendations && recommendations.length > 0 && (
          <motion.section 
            className={styles.recommendationsSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Recommendations for You</h3>
            <div className={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <div key={index} className={`${styles.recommendation} ${styles[rec.priority]}`}>
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <motion.nav 
          className={styles.sidebar}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`${styles.navButton} ${activeSection === section.id ? styles.active : ''}`}
              >
                <Icon size={20} />
                {section.label}
              </button>
            );
          })}
        </motion.nav>

        {/* Content Area */}
        <motion.main 
          className={styles.content}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSectionContent()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
};

export default ProfileManager;
