import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { 
  getValidationForCourse, 
  generateCompletionSuggestions 
} from '../utils/profileValidation';
import ProfileCompletionWarning from './ProfileCompletionWarning';
import PropTypes from 'prop-types';

/**
 * Route guard component that validates profile completion before allowing course access
 * Shows warning modal for incomplete profiles and optionally redirects
 */
const CourseRouteGuard = ({ children, redirectTo = '/learning' }) => {
  const location = useLocation();
  const { profile } = useUserProfile();
  const [showWarning, setShowWarning] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [allowAccess, setAllowAccess] = useState(false);

  useEffect(() => {
    // Only validate for course routes
    const coursePaths = ['/college-selection', '/academic-planning'];
    const isCoursePath = coursePaths.some(path => location.pathname.startsWith(path));
    
    if (!isCoursePath) {
      setAllowAccess(true);
      return;
    }

    // Get validation function for current route
    const validateProfile = getValidationForCourse(location.pathname);
    const validation = validateProfile(profile);

    if (validation.isValid) {
      setAllowAccess(true);
    } else {
      setValidationResult(validation);
      setShowWarning(true);
    }
  }, [location.pathname, profile]);

  const handleContinueAnyway = () => {
    setAllowAccess(true);
    setShowWarning(false);
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
    // Optionally redirect back to learning dashboard
    // This prevents users from accessing the route directly
  };

  // If validation hasn't run yet, show loading or allow access
  if (allowAccess || !validationResult) {
    return children;
  }

  // If validation failed and user hasn't chosen to continue, show warning
  if (showWarning && validationResult) {
    const courseName = location.pathname.includes('college-selection') 
      ? 'College Selection' 
      : 'Academic Planning';
    
    const suggestions = generateCompletionSuggestions(validationResult.missingFields);

    return (
      <>
        {children}
        <ProfileCompletionWarning
          isOpen={showWarning}
          onClose={handleCloseWarning}
          missingFields={validationResult.missingFields}
          suggestions={suggestions}
          courseName={courseName}
          onContinueAnyway={handleContinueAnyway}
        />
      </>
    );
  }

  // If validation failed and modal was closed without continuing, redirect
  return <Navigate to={redirectTo} replace />;
};

CourseRouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
};

export default CourseRouteGuard;
