# AIService Migration Guide

This guide helps you migrate all your existing components from individual Gemini API calls to the centralized AIService.

## Overview

The new AIService provides:
- ✅ Centralized AI API management
- ✅ Response caching (5-60 minutes based on content type)
- ✅ Automatic retry with exponential backoff
- ✅ Consistent error handling
- ✅ JSON response cleaning and parsing
- ✅ Performance monitoring and cache statistics

## Migration Steps

### 1. Update Imports
**Before:**
```jsx
import { GoogleGenerativeAI } from "@google/generative-ai";
```

**After:**
```jsx
import aiService from "../../services/AIService"; // Adjust path as needed
```

### 2. Remove Individual AI Client Initialization
**Before:**
```jsx
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
);
```

**After:**
```jsx
// Remove this - AIService handles initialization
```

### 3. Replace Manual AI Calls with Service Methods

## Component Migration Examples

### ✅ CollegeMatcher (DONE)
**Before:**
```jsx
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const result = await model.generateContent(prompt);
// ... manual JSON parsing
```

**After:**
```jsx
const recommendationsData = await aiService.generateCollegeRecommendations(preferences);
```

### ✅ AdmissionTips (DONE)
**Before:**
```jsx
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const result = await model.generateContent(prompt);
// ... manual JSON parsing
```

**After:**
```jsx
const tipsData = await aiService.generateAdmissionTips(profile);
```

### 🔄 ScholarshipFinder (TO DO)
**Update:**
```jsx
// Replace generateRecommendations function with:
const generateRecommendations = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const recommendationsData = await aiService.generateScholarshipRecommendations(preferences);
    setRecommendations(recommendationsData);
  } catch (err) {
    console.error("Failed to generate scholarship recommendations", err);
    setError(err.message || "Failed to generate recommendations. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

### 🔄 CommonAppHelper (TO DO)
**Update:**
```jsx
// Replace generateFeedback function with:
const generateFeedback = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const feedbackData = await aiService.generateEssayFeedback(essayDetails);
    setFeedback(feedbackData);
  } catch (err) {
    console.error("Failed to generate essay feedback", err);
    setError(err.message || "Failed to generate feedback. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

### 🔄 CourseSelectionHelper (TO DO)
**Update:**
```jsx
// Replace generateRecommendations function with:
const generateRecommendations = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const recommendationsData = await aiService.generateCourseRecommendations(preferences);
    setRecommendations(recommendationsData);
  } catch (err) {
    console.error("Failed to generate course recommendations", err);
    setError(err.message || "Failed to generate recommendations. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

### 🔄 HomeworkManager (TO DO)
**Update:**
```jsx
// Replace generateOverview function with:
const generateOverview = async () => {
  if (tasks.length === 0) return;

  setIsGeneratingOverview(true);
  try {
    const overviewData = await aiService.generateHomeworkOverview(tasks);
    setAiOverview(overviewData);
  } catch (error) {
    console.error('Failed to generate overview:', error);
    setError(error.message || 'Failed to generate AI overview. Please try again.');
  } finally {
    setIsGeneratingOverview(false);
  }
};
```

### 🔄 StudySchedule (TO DO)
**Update:**
```jsx
// Replace generateOptimization function with:
const generateOptimization = async () => {
  const scheduleToAnalyze = selectedSchedule || tasks;
  if (!scheduleToAnalyze || (Array.isArray(scheduleToAnalyze) && scheduleToAnalyze.length === 0)) return;

  setIsGeneratingOptimization(true);
  try {
    const optimizationData = await aiService.generateStudyScheduleOptimization(scheduleToAnalyze, scheduleHistory);
    setAiOptimization(optimizationData);
    
    // Generate highlighting if needed
    await highlightOptimization('overview', optimizationData.overview);
  } catch (error) {
    console.error('Failed to generate optimization:', error);
    setError(error.message || 'Failed to generate AI optimization. Please try again.');
  } finally {
    setIsGeneratingOptimization(false);
  }
};
```

### 🔄 TestPrep (TO DO)
**Update:**
```jsx
// Replace generateRecommendations function with:
const generateRecommendations = async () => {
  if (tests.length === 0) return;

  setIsGeneratingRecommendations(true);
  try {
    const recommendationsData = await aiService.generateTestPrepRecommendations(tests);
    setAiRecommendations(recommendationsData);
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    setError(error.message || 'Failed to generate AI recommendations. Please try again.');
  } finally {
    setIsGeneratingRecommendations(false);
  }
};

// For highlightNotes function:
const highlightNotes = async (testId, notes) => {
  if (!notes || highlightingTestId) return;

  setHighlightingTestId(testId);
  try {
    const enhancedData = await aiService.enhanceText(notes, 'study-notes');
    setHighlightedNotes(prev => ({
      ...prev,
      [testId]: {
        formattedNotes: enhancedData.formattedNotes,
        summary: enhancedData.summary
      }
    }));
  } catch (error) {
    console.error('Failed to highlight notes:', error);
    setError(error.message || 'Failed to enhance notes. Please try again.');
  } finally {
    setHighlightingTestId(null);
  }
};
```

## Additional Features

### Cache Management
```jsx
// Clear all cached responses
aiService.clearCache();

// Get cache statistics
const stats = aiService.getCacheStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);

// Clean expired entries
const removedCount = aiService.cleanExpiredCache();
```

### Error Handling Benefits
The AIService provides better error messages:
- API key configuration issues
- Quota exceeded warnings
- Network connectivity problems
- JSON parsing errors

### Performance Benefits
- **Caching**: Responses are cached for 5-60 minutes depending on content type
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Request Deduplication**: Identical requests within cache period return cached results

## Migration Checklist

- [x] CollegeMatcher - Updated to use aiService.generateCollegeRecommendations()
- [x] AdmissionTips - Updated to use aiService.generateAdmissionTips()
- [ ] ScholarshipFinder - Update to use aiService.generateScholarshipRecommendations()
- [ ] CommonAppHelper - Update to use aiService.generateEssayFeedback()
- [ ] CourseSelectionHelper - Update to use aiService.generateCourseRecommendations()
- [ ] HomeworkManager - Update to use aiService.generateHomeworkOverview()
- [ ] StudySchedule - Update to use aiService.generateStudyScheduleOptimization()
- [ ] TestPrep - Update to use aiService.generateTestPrepRecommendations() and aiService.enhanceText()

## Next Steps

1. **Test the updated components** (CollegeMatcher and AdmissionTips) to ensure they work correctly
2. **Update remaining components** one by one using the examples above
3. **Remove all individual GoogleGenerativeAI imports** once migration is complete
4. **Add cache management** to your admin/settings page if desired

The AIService will significantly improve your app's reliability, performance, and maintainability!
