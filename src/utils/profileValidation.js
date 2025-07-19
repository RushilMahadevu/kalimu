/**
 * Profile validation utilities
 * Defines required fields and validation logic for course access
 */

// Define required fields for different course access levels
export const REQUIRED_FIELDS = {
  // Basic profile completion required for any course
  basic: {
    personalInfo: ['firstName', 'lastName', 'graduationYear', 'grade'],
    academic: ['major', 'currentGPA']
  },
  
  // Additional fields required for college selection course
  collegeSelection: {
    academic: ['interests', 'academicGoals'],
    collegePreferences: ['academicInterest', 'preferredLocations']
  },
  
  // Additional fields required for academic planning course
  academicPlanning: {
    academic: ['targetGPA', 'courseLoad']
  }
};

/**
 * Check if a field has a meaningful value
 */
function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * Validate a specific section of the profile
 */
function validateSection(profile, sectionName, requiredFields) {
  const section = profile[sectionName] || {};
  const missing = [];
  
  for (const field of requiredFields) {
    if (!hasValue(section[field])) {
      missing.push({
        section: sectionName,
        field,
        displayName: getFieldDisplayName(sectionName, field)
      });
    }
  }
  
  return missing;
}

/**
 * Get user-friendly display name for fields
 */
function getFieldDisplayName(section, field) {
  const displayNames = {
    personalInfo: {
      firstName: 'First Name',
      lastName: 'Last Name',
      graduationYear: 'Graduation Year',
      grade: 'Current Grade'
    },
    academic: {
      major: 'Major/Field of Study',
      currentGPA: 'Current GPA',
      targetGPA: 'Target GPA',
      interests: 'Academic Interests',
      academicGoals: 'Academic Goals',
      courseLoad: 'Course Load Preference'
    },
    collegePreferences: {
      academicInterest: 'Primary Academic Interest',
      preferredLocations: 'Preferred College Locations'
    }
  };
  
  return displayNames[section]?.[field] || field;
}

/**
 * Validate profile for basic course access
 */
export function validateBasicProfile(profile) {
  const missing = [];
  
  // Check basic requirements
  for (const [sectionName, fields] of Object.entries(REQUIRED_FIELDS.basic)) {
    missing.push(...validateSection(profile, sectionName, fields));
  }
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    completionLevel: 'basic'
  };
}

/**
 * Validate profile for college selection course access
 */
export function validateCollegeSelectionProfile(profile) {
  const basicValidation = validateBasicProfile(profile);
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  const missing = [];
  
  // Check college selection specific requirements
  for (const [sectionName, fields] of Object.entries(REQUIRED_FIELDS.collegeSelection)) {
    missing.push(...validateSection(profile, sectionName, fields));
  }
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    completionLevel: 'collegeSelection'
  };
}

/**
 * Validate profile for academic planning course access
 */
export function validateAcademicPlanningProfile(profile) {
  const basicValidation = validateBasicProfile(profile);
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  const missing = [];
  
  // Check academic planning specific requirements
  for (const [sectionName, fields] of Object.entries(REQUIRED_FIELDS.academicPlanning)) {
    missing.push(...validateSection(profile, sectionName, fields));
  }
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    completionLevel: 'academicPlanning'
  };
}

/**
 * Get validation function for a specific course
 */
export function getValidationForCourse(coursePath) {
  if (coursePath.includes('college-selection')) {
    return validateCollegeSelectionProfile;
  }
  if (coursePath.includes('academic-planning')) {
    return validateAcademicPlanningProfile;
  }
  // Default to basic validation
  return validateBasicProfile;
}

/**
 * Generate helpful suggestions for completing missing fields
 */
export function generateCompletionSuggestions(missingFields) {
  const suggestions = [];
  
  if (missingFields.some(f => f.section === 'personalInfo')) {
    suggestions.push("Complete your basic personal information to help us personalize your experience.");
  }
  
  if (missingFields.some(f => f.section === 'academic')) {
    suggestions.push("Add your academic details to get better course recommendations and planning tools.");
  }
  
  if (missingFields.some(f => f.section === 'collegePreferences')) {
    suggestions.push("Define your college preferences to unlock advanced college selection features.");
  }
  
  return suggestions;
}
