import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { 
  getValidationForCourse, 
  generateCompletionSuggestions 
} from '../utils/profileValidation';

/**
 * Custom hook for handling course access validation
 * Checks if user has completed required profile fields before accessing courses
 */
export const useCourseAccess = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    courseName: '',
    targetPath: '',
    missingFields: [],
    suggestions: []
  });

  /**
   * Attempt to navigate to a course, showing warning if profile incomplete
   */
  const navigateWithValidation = useCallback((coursePath, courseName) => {
    // Get appropriate validation function for this course
    const validateProfile = getValidationForCourse(coursePath);
    const validation = validateProfile(profile);

    if (validation.isValid) {
      // Profile is complete, navigate directly
      navigate(coursePath);
    } else {
      // Profile is incomplete, show warning modal
      const suggestions = generateCompletionSuggestions(validation.missingFields);
      
      setWarningModal({
        isOpen: true,
        courseName,
        targetPath: coursePath,
        missingFields: validation.missingFields,
        suggestions
      });
    }
  }, [profile, navigate]);

  /**
   * Close the warning modal
   */
  const closeWarningModal = useCallback(() => {
    setWarningModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Continue to course despite incomplete profile
   */
  const continueAnyway = useCallback(() => {
    if (warningModal.targetPath) {
      navigate(warningModal.targetPath);
    }
  }, [warningModal.targetPath, navigate]);

  /**
   * Check if a specific course path requires validation
   */
  const requiresValidation = useCallback((coursePath) => {
    return coursePath.includes('college-selection') || 
           coursePath.includes('academic-planning');
  }, []);

  /**
   * Get validation status for a course without showing modal
   */
  const getValidationStatus = useCallback((coursePath) => {
    const validateProfile = getValidationForCourse(coursePath);
    return validateProfile(profile);
  }, [profile]);

  return {
    navigateWithValidation,
    warningModal,
    closeWarningModal,
    continueAnyway,
    requiresValidation,
    getValidationStatus
  };
};
