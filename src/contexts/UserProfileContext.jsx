import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase';
import PropTypes from 'prop-types';

const UserProfileContext = createContext();

// Default user profile structure
const defaultProfile = {
  // Personal Information
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    graduationYear: new Date().getFullYear() + 4,
    schoolName: '',
    grade: '',
    dateOfBirth: '',
  },

  // Academic Profile
  academic: {
    currentGPA: 0,
    targetGPA: 0,
    major: '',
    interests: [],
    academicGoals: '',
    courseLoad: 'normal',
    testScores: {
      sat: '',
      act: '',
      ap: [],
      other: []
    },
    coursework: {
      completed: [],
      current: [],
      planned: []
    }
  },

  // College Selection Preferences
  collegePreferences: {
    academicInterest: '',
    preferredLocations: [],
    budgetRange: {
      min: 10000,
      max: 80000
    },
    campusSize: 'medium',
    specialNeeds: '',
    collegeType: [], // public, private, liberal arts, etc.
    importantFactors: [], // research opportunities, greek life, etc.
    savedColleges: [],
    appliedColleges: []
  },

  // Scholarship Preferences
  scholarshipPreferences: {
    academicField: '',
    financialNeed: false,
    meritBased: true,
    minorityGroups: '',
    applicationDeadlines: '',
    savedScholarships: [],
    appliedScholarships: []
  },

  // Extracurricular Activities
  extracurriculars: {
    activities: [],
    leadership: [],
    volunteering: [],
    awards: [],
    workExperience: []
  },

  // Personal Background
  background: {
    familyEducation: '', // first-gen, parents with college, etc.
    economicBackground: '',
    challenges: '',
    uniqueCircumstances: '',
    culturalBackground: ''
  },

  // Application Progress
  applicationProgress: {
    essayDrafts: {},
    applicationStatus: {}, // college -> status
    documentsCompleted: [],
    recommendationLetters: {
      requested: [],
      received: []
    },
    deadlines: []
  },

  // Study & Academic Management
  studyProfile: {
    preferredStudyTime: 'evening',
    studyMethods: [],
    strengths: [],
    weaknesses: [],
    learningStyle: 'visual', // visual, auditory, kinesthetic
    subjects: {},
    studyGoals: []
  },

  // Notes and Custom Data
  notes: {},
  customData: {},

  // Settings & Preferences
  settings: {
    notifications: {
      deadlines: true,
      recommendations: true,
      progress: true
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false
    },
    ai: {
      cachePreferences: true,
      personalizationLevel: 'high'
    }
  },

  // System Data
  metadata: {
    profileCompletion: 0,
    lastUpdated: null,
    createdAt: null,
    version: '1.0'
  }
};

export const UserProfileProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Initialize new user profile
  const initializeProfile = useCallback(async () => {
    if (!user) return;

    try {
      const newProfile = {
        ...defaultProfile,
        personalInfo: {
          ...defaultProfile.personalInfo,
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || ''
        },
        metadata: {
          ...defaultProfile.metadata,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };

      const userProfileRef = doc(db, 'users', user.uid, 'profile', 'main');
      await setDoc(userProfileRef, newProfile);
      setProfile(newProfile);
    } catch (err) {
      console.error('Error initializing profile:', err);
      setError('Failed to initialize profile');
    }
  }, [user]);

  // Load user profile from Firestore
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    const userProfileRef = doc(db, 'users', user.uid, 'profile', 'main');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      userProfileRef,
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            // Merge with default profile to ensure all fields exist
            const mergedProfile = mergeProfiles(defaultProfile, data);
            setProfile(mergedProfile);
          } else {
            // Create new profile if it doesn't exist
            initializeProfile();
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setError('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Profile listener error:', err);
        setError('Connection error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user, initializeProfile]);

  // Merge profiles ensuring all default fields exist
  const mergeProfiles = (defaultProf, userData) => {
    const merged = JSON.parse(JSON.stringify(defaultProf)); // Deep clone
    
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    deepMerge(merged, userData);
    return merged;
  };

  // Update profile section
  const updateProfile = async (section, data, options = {}) => {
    const { optimistic = true, merge = true } = options;

    try {
      const updatedProfile = {
        ...profile,
        [section]: merge ? { ...profile[section], ...data } : data,
        metadata: {
          ...profile.metadata,
          lastUpdated: new Date().toISOString(),
          profileCompletion: calculateProfileCompletion({
            ...profile,
            [section]: merge ? { ...profile[section], ...data } : data
          })
        }
      };

      // Optimistic update
      if (optimistic) {
        setProfile(updatedProfile);
        setUnsavedChanges(true);
      }

      // Save to Firestore
      if (user) {
        const userProfileRef = doc(db, 'users', user.uid, 'profile', 'main');
        await updateDoc(userProfileRef, {
          [section]: merge ? { ...profile[section], ...data } : data,
          'metadata.lastUpdated': new Date().toISOString(),
          'metadata.profileCompletion': updatedProfile.metadata.profileCompletion
        });
        setUnsavedChanges(false);
      }

      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      
      // Revert optimistic update on error
      if (optimistic) {
        setProfile(profile);
      }
      throw err;
    }
  };

  // Update specific field within a section
  const updateField = async (section, field, value) => {
    return updateProfile(section, { [field]: value });
  };

  // Add item to array field
  const addToArray = async (section, field, item) => {
    const currentArray = profile[section]?.[field] || [];
    const updatedArray = [...currentArray, item];
    return updateProfile(section, { [field]: updatedArray });
  };

  // Remove item from array field
  const removeFromArray = async (section, field, item) => {
    const currentArray = profile[section]?.[field] || [];
    const updatedArray = currentArray.filter(existing => 
      JSON.stringify(existing) !== JSON.stringify(item)
    );
    return updateProfile(section, { [field]: updatedArray });
  };

  // Save to saved items (colleges, scholarships, etc.)
  const saveItem = async (type, item) => {
    const section = type === 'college' ? 'collegePreferences' : 'scholarshipPreferences';
    const field = type === 'college' ? 'savedColleges' : 'savedScholarships';
    
    return addToArray(section, field, {
      ...item,
      savedAt: new Date().toISOString(),
      id: item.id || Date.now().toString()
    });
  };

  // Remove from saved items
  const unsaveItem = async (type, itemId) => {
    const section = type === 'college' ? 'collegePreferences' : 'scholarshipPreferences';
    const field = type === 'college' ? 'savedColleges' : 'savedScholarships';
    
    const currentItems = profile[section]?.[field] || [];
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    return updateProfile(section, { [field]: updatedItems });
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profileData) => {
    const weights = {
      personalInfo: 15,
      academic: 25,
      collegePreferences: 20,
      extracurriculars: 15,
      background: 10,
      studyProfile: 15
    };

    let totalCompletion = 0;
    let totalWeight = 0;

    for (const [section, weight] of Object.entries(weights)) {
      const sectionData = profileData[section];
      if (sectionData) {
        const sectionCompletion = calculateSectionCompletion(sectionData);
        totalCompletion += sectionCompletion * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalCompletion / totalWeight) : 0;
  };

  // Calculate completion for a profile section
  const calculateSectionCompletion = (sectionData) => {
    if (!sectionData || typeof sectionData !== 'object') return 0;

    const entries = Object.entries(sectionData);
    if (entries.length === 0) return 0;

    let filledFields = 0;
    let totalFields = 0;

    for (const [, value] of entries) {
      totalFields++;
      
      if (Array.isArray(value)) {
        if (value.length > 0) filledFields++;
      } else if (typeof value === 'object' && value !== null) {
        const subCompletion = calculateSectionCompletion(value);
        if (subCompletion > 0) filledFields++;
      } else if (value !== '' && value !== null && value !== undefined && value !== 0) {
        filledFields++;
      }
    }

    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  };

  // Get user preferences for AI services
  const getAIPreferences = () => {
    return {
      academic: profile.academic,
      collegePreferences: profile.collegePreferences,
      scholarshipPreferences: profile.scholarshipPreferences,
      background: profile.background,
      studyProfile: profile.studyProfile
    };
  };

  // Get recommendations based on profile
  const getRecommendations = () => {
    const recommendations = [];
    const completion = profile.metadata.profileCompletion;

    if (completion < 30) {
      recommendations.push({
        type: 'profile',
        priority: 'high',
        title: 'Complete Your Profile',
        description: 'Add more information to get personalized recommendations'
      });
    }

    if (!profile.academic.major) {
      recommendations.push({
        type: 'academic',
        priority: 'medium',
        title: 'Add Academic Interests',
        description: 'Help us understand your academic goals'
      });
    }

    if (profile.collegePreferences.savedColleges.length === 0) {
      recommendations.push({
        type: 'college',
        priority: 'medium',
        title: 'Explore Colleges',
        description: 'Start building your college list'
      });
    }

    return recommendations;
  };

  // Export profile data
  const exportProfile = () => {
    const exportData = {
      ...profile,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || 'anonymous'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalimu-profile-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const value = {
    // Profile data
    profile,
    loading,
    error,
    unsavedChanges,

    // Core methods
    updateProfile,
    updateField,
    addToArray,
    removeFromArray,

    // Convenience methods
    saveItem,
    unsaveItem,
    getAIPreferences,
    getRecommendations,
    exportProfile,

    // Computed values
    profileCompletion: profile.metadata.profileCompletion,
    isProfileComplete: profile.metadata.profileCompletion >= 80,

    // Helper methods
    calculateSectionCompletion: (section) => calculateSectionCompletion(profile[section])
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

UserProfileProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserProfileContext;
