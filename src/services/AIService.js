import { GoogleGenerativeAI } from "@google/generative-ai";

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(
      import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
    );
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp" 
    });
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate a cache key based on prompt and options
   */
  generateCacheKey(prompt, options = {}) {
    const keyData = {
      prompt: prompt.trim(),
      ...options
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Check if cached response is still valid
   */
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  /**
   * Manage cache size by removing oldest entries
   */
  manageCacheSize() {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean JSON response from markdown code blocks and extra formatting
   */
  cleanJSONResponse(text) {
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    if (cleanedText.includes('```')) {
      const jsonMatch = cleanedText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1];
      }
    }
    
    // Remove any leading/trailing whitespace and newlines
    cleanedText = cleanedText.trim();
    
    return cleanedText;
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`AI Service: Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Core method to generate AI content with caching and error handling
   */
  async generateContent(prompt, options = {}) {
    const {
      enableCache = true,
      cacheTTL = this.defaultCacheTTL,
      expectJSON = false,
      maxRetries = 3,
      context = 'general'
    } = options;

    // Check cache first
    if (enableCache) {
      const cacheKey = this.generateCacheKey(prompt, options);
      const cachedResponse = this.cache.get(cacheKey);
      
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        console.log(`AI Service: Cache hit for ${context}`);
        return cachedResponse.data;
      }
    }

    try {
      const operation = async () => {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        if (expectJSON) {
          text = this.cleanJSONResponse(text);
          try {
            const parsedData = JSON.parse(text);
            return parsedData;
          } catch (parseError) {
            console.error('AI Service: JSON parsing failed:', parseError);
            throw new Error('Invalid JSON response from AI service');
          }
        }

        return text;
      };

      const data = await this.retryWithBackoff(operation, maxRetries);

      // Cache the response
      if (enableCache) {
        this.manageCacheSize();
        const cacheKey = this.generateCacheKey(prompt, options);
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL,
          context
        });
      }

      console.log(`AI Service: Generated content for ${context}`);
      return data;

    } catch (error) {
      console.error(`AI Service Error in ${context}:`, error);
      
      // Provide context-specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('AI service configuration error. Please check your API key.');
      } else if (error.message?.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      } else if (error.message?.includes('Invalid JSON')) {
        throw error; // Re-throw JSON parsing errors as-is
      } else {
        throw new Error(`AI service temporarily unavailable. Please try again. (${context})`);
      }
    }
  }

  /**
   * Enhanced College Selection Services with User Profile Integration
   */
  async generateCollegeRecommendations(preferences, userProfile = null) {
    // Merge preferences with user profile data if available
    const enhancedPreferences = this.enhanceWithProfile(preferences, userProfile, 'college');
    
    const prompt = `
      As an expert college counselor, generate a list of 6 college recommendations based on these student preferences:
      - Academic Interest: ${enhancedPreferences.academicInterest}
      - Preferred Location: ${enhancedPreferences.location}
      - Budget: $${enhancedPreferences.budget}
      - Campus Size: ${enhancedPreferences.campusSize}
      - Special Wants/Considerations: ${enhancedPreferences.specialNeeds}
      ${userProfile ? `
      - Additional Context from User Profile:
        - Academic Background: GPA ${userProfile.academic?.currentGPA || 'N/A'}, Major Interest: ${userProfile.academic?.major || 'N/A'}
        - Test Scores: ${userProfile.academic?.testScores?.sat || userProfile.academic?.testScores?.act || 'N/A'}
        - Extracurriculars: ${userProfile.extracurriculars?.activities?.slice(0, 3).join(', ') || 'N/A'}
        - Background: ${userProfile.background?.familyEducation || 'N/A'}` : ''}

      For each college, provide:
      1. College Name
      2. Precise match to student's preferences and profile
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

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'college-recommendations',
      cacheTTL: 10 * 60 * 1000 // 10 minutes cache
    });
  }

  async generateAdmissionTips(profile, userProfile = null) {
    // Enhanced profile data
    const enhancedProfile = userProfile ? {
      ...profile,
      academicBackground: userProfile.academic,
      extracurriculars: userProfile.extracurriculars,
      personalBackground: userProfile.background
    } : profile;

    const prompt = `
      As an expert college admissions counselor, provide 5 highly personalized 
      and strategic admission tips based on this student profile:
      - GPA: ${enhancedProfile.gpa}
      - Test Scores: ${enhancedProfile.testScores}
      - Extracurricular Activities: ${enhancedProfile.extracurriculars}
      - Academic Interest: ${enhancedProfile.academicInterest}
      - Challenged Background: ${enhancedProfile.challengedBackground}
      ${userProfile ? `
      - Additional Profile Data:
        - Academic Goals: ${userProfile.academic?.academicGoals || 'N/A'}
        - Leadership Experience: ${userProfile.extracurriculars?.leadership?.slice(0, 2).join(', ') || 'N/A'}
        - Unique Circumstances: ${userProfile.background?.uniqueCircumstances || 'N/A'}
        - Application Progress: ${Object.keys(userProfile.applicationProgress?.essayDrafts || {}).length} essays drafted` : ''}
      
      For each tip, provide:
      1. Specific, actionable advice
      2. Rationale behind the recommendation
      3. Potential impact on college applications
      
      Respond in a strict JSON format with these exact keys:
      [
        {
          "tipTitle": "",
          "tipDescription": "",
          "strategicRationale": "",
          "potentialImpact": ""
        }
      ]
      
      Ensure tips are highly specific and tailored to the student's unique profile.
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'admission-tips',
      cacheTTL: 15 * 60 * 1000 // 15 minutes cache
    });
  }

  async generateScholarshipRecommendations(preferences, userProfile = null) {
    const enhancedPreferences = this.enhanceWithProfile(preferences, userProfile, 'scholarship');
    
    const prompt = `
      As a scholarship advisor, generate a list of 6 scholarship opportunities tailored to these preferences:
      - Academic Field: ${enhancedPreferences.academicField}
      - Location: ${enhancedPreferences.location}
      - Financial Need: ${enhancedPreferences.financialNeed}
      - Merit-Based: ${enhancedPreferences.meritBased}
      - Minority Group Considerations: ${enhancedPreferences.minorityGroups}
      - Application Deadline Range: ${enhancedPreferences.deadlineRange}
      ${userProfile ? `
      - Student Profile Context:
        - Academic Performance: GPA ${userProfile.academic?.currentGPA || 'N/A'}
        - Financial Background: ${userProfile.background?.economicBackground || 'N/A'}
        - Activities: ${userProfile.extracurriculars?.activities?.slice(0, 3).join(', ') || 'N/A'}
        - Awards: ${userProfile.extracurriculars?.awards?.slice(0, 2).join(', ') || 'N/A'}` : ''}

      For each scholarship, provide:
      1. Scholarship Name
      2. Eligibility Criteria
      3. Award Amount
      4. Application Deadline
      5. Application Link

      Respond in a strict JSON format with these exact keys:
      [
        {
          "scholarshipName": "",
          "eligibilityCriteria": "",
          "awardAmount": 0,
          "applicationDeadline": "",
          "applicationLink": ""
        }
      ]
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'scholarship-recommendations',
      cacheTTL: 30 * 60 * 1000 // 30 minutes cache
    });
  }

  async generateEssayFeedback(essayDetails, userProfile = null) {
    const wordCount = essayDetails.draftContent
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const profileContext = userProfile ? `
      Student Background Context:
      - Academic Interest: ${userProfile.academic?.major || 'N/A'}
      - Personal Background: ${userProfile.background?.culturalBackground || 'N/A'}
      - Goals: ${userProfile.academic?.academicGoals || 'N/A'}
      - Unique Experiences: ${userProfile.extracurriculars?.activities?.slice(0, 2).join(', ') || 'N/A'}
    ` : '';

    const prompt = `
      As an expert college admissions counselor, analyze this Common App essay draft and provide detailed feedback:
      
      Essay Prompt: ${essayDetails.prompt}
      Draft Content: ${essayDetails.draftContent}
      Desired Tone: ${essayDetails.tone}
      Theme/Message: ${essayDetails.theme}
      Word Count: ${wordCount}
      ${profileContext}

      Provide 5 pieces of detailed feedback covering:
      1. Content strength and authenticity
      2. Structure and flow
      3. Language and tone
      4. Impact and memorability
      5. Specific improvement suggestions

      Respond ONLY with a valid JSON array. Format:
      [
        {
          "aspectTitle": "string",
          "analysis": "string",
          "strengthsIdentified": "string",
          "improvementSuggestions": "string",
          "examples": "string"
        }
      ]
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'essay-feedback',
      cacheTTL: 20 * 60 * 1000 // 20 minutes cache
    });
  }

  /**
   * Enhanced Academic Planning Services
   */
  async generateCourseRecommendations(preferences, userProfile = null) {
    const enhancedPreferences = userProfile ? {
      ...preferences,
      academicHistory: userProfile.academic?.coursework || {},
      strengths: userProfile.studyProfile?.strengths || [],
      weaknesses: userProfile.studyProfile?.weaknesses || []
    } : preferences;

    const prompt = `
      As an academic advisor, recommend 6 courses based on these student preferences:
      - Major/Field: ${enhancedPreferences.major}
      - Academic Year: ${enhancedPreferences.year}
      - Areas of Interest: ${enhancedPreferences.interests}
      - Academic Goals: ${enhancedPreferences.academicGoals}
      - Current GPA: ${enhancedPreferences.currentGPA}
      - Preferred Course Load: ${enhancedPreferences.courseLoad}
      ${userProfile ? `
      - Academic Strengths: ${enhancedPreferences.strengths.join(', ') || 'N/A'}
      - Areas for Improvement: ${enhancedPreferences.weaknesses.join(', ') || 'N/A'}
      - Completed Courses: ${enhancedPreferences.academicHistory.completed?.slice(0, 3).join(', ') || 'N/A'}
      - Study Preferences: ${userProfile.studyProfile?.learningStyle || 'N/A'} learner` : ''}

      For each course, provide:
      1. Course Name and Code
      2. Brief Description
      3. Key Learning Outcomes
      4. Prerequisites (if any)
      5. Relevance to Career Goals

      Respond in JSON format:
      [
        {
          "courseCode": "",
          "courseName": "",
          "description": "",
          "outcomes": "",
          "prerequisites": "",
          "careerRelevance": ""
        }
      ]
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'course-recommendations',
      cacheTTL: 60 * 60 * 1000 // 1 hour cache
    });
  }

  /**
   * User Profile Enhancement Utilities
   */
  enhanceWithProfile(preferences, userProfile, context) {
    if (!userProfile) return preferences;

    const enhanced = { ...preferences };

    switch (context) {
      case 'college':
        if (userProfile.collegePreferences) {
          enhanced.academicInterest = enhanced.academicInterest || userProfile.collegePreferences.academicInterest;
          enhanced.location = enhanced.location || userProfile.collegePreferences.preferredLocations[0];
          enhanced.budget = enhanced.budget || userProfile.collegePreferences.budgetRange.max;
          enhanced.campusSize = enhanced.campusSize || userProfile.collegePreferences.campusSize;
        }
        break;
      
      case 'scholarship':
        if (userProfile.scholarshipPreferences) {
          enhanced.academicField = enhanced.academicField || userProfile.scholarshipPreferences.academicField;
          enhanced.financialNeed = enhanced.financialNeed ?? userProfile.scholarshipPreferences.financialNeed;
          enhanced.meritBased = enhanced.meritBased ?? userProfile.scholarshipPreferences.meritBased;
        }
        break;
    }

    return enhanced;
  }

  /**
   * Profile-Aware Content Generation
   */
  async generatePersonalizedRecommendations(userProfile, context = 'general') {
    if (!userProfile) return [];

    const prompt = `
      Based on this comprehensive student profile, provide 5 personalized recommendations for ${context}:
      
      Profile Summary:
      - Academic: GPA ${userProfile.academic?.currentGPA}, Major ${userProfile.academic?.major}
      - Interests: ${userProfile.academic?.interests?.join(', ') || 'N/A'}
      - Extracurriculars: ${userProfile.extracurriculars?.activities?.slice(0, 3).join(', ') || 'N/A'}
      - Goals: ${userProfile.academic?.academicGoals || 'N/A'}
      - Background: ${userProfile.background?.familyEducation || 'N/A'}
      - Profile Completion: ${userProfile.metadata?.profileCompletion || 0}%

      Provide recommendations in JSON format:
      [
        {
          "type": "string",
          "priority": "high|medium|low",
          "title": "string",
          "description": "string",
          "actionSteps": ["step1", "step2", "step3"]
        }
      ]
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: `personalized-recommendations-${context}`,
      cacheTTL: 30 * 60 * 1000 // 30 minutes cache
    });
  }

  async generateHomeworkOverview(tasks) {
    const prompt = `
      As a homework analysis expert, analyze these assignments and provide insights.
      Tasks: ${JSON.stringify(tasks)}

      Return a JSON response with EXACTLY this structure:
      {
        "summary": "Brief overview analyzing total workload and upcoming deadlines",
        "urgentTasks": "List the most urgent tasks based on due dates and priority",
        "timeManagement": "Provide specific time management advice for these tasks",
        "studyTips": "Give subject-specific study strategies based on the tasks"
      }
      Requirements:
      1. All fields must be detailed text strings
      2. urgentTasks should list specific task names and deadlines
      3. Include concrete study strategies for each subject
      4. Keep responses focused and actionable and concise
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'homework-overview',
      cacheTTL: 10 * 60 * 1000 // 10 minutes cache
    });
  }

  async generateStudyScheduleOptimization(scheduleData, scheduleHistory) {
    const prompt = `
      As a study schedule optimization expert, analyze this schedule and previous performance to provide recommendations.
      Current/Selected Schedule: ${JSON.stringify(scheduleData)}
      Previous Schedules: ${JSON.stringify(scheduleHistory.slice(0, 3))}

      Return a JSON response with EXACTLY this structure:
      {
        "overview": "Brief analysis comparing current schedule with past patterns",
        "optimization": "Specific suggestions based on historical performance",
        "breakSchedule": "Recommended break patterns between study sessions",
        "effectiveness": "Tips to maximize study effectiveness based on past success"
      }
      Requirements:
      1. Compare current schedule with past schedules
      2. Identify patterns of successful study sessions
      3. Suggest improvements based on historical data
      4. Provide personalized recommendations
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'schedule-optimization',
      cacheTTL: 15 * 60 * 1000 // 15 minutes cache
    });
  }

  async generateTestPrepRecommendations(tests) {
    const prompt = `
      As a test preparation expert, analyze these upcoming tests and provide study recommendations.
      Tests: ${JSON.stringify(tests)}

      REQUIREMENTS:
      - PRIMARY KEEP RESPONSES LIMITED TO 4-5 SENTENCES
      - MAKE SURE to include a study plan based on test dates and difficulties
      - Provide specific study techniques for each subject
      - Recommend time allocation for optimal preparation

      Return a JSON response with EXACTLY this structure:
      {
        "overview": "Brief analysis of upcoming test load and priorities",
        "studyPlan": "Detailed study plan based on test dates and difficulties",
        "techniques": "Specific study techniques for each subject",
        "timeManagement": "Time allocation recommendations for optimal preparation"
      }
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: 'test-prep-recommendations',
      cacheTTL: 20 * 60 * 1000 // 20 minutes cache
    });
  }

  /**
   * Utility Services
   */
  async enhanceText(text, purpose = 'general') {
    const prompt = `
      Analyze and enhance this text for ${purpose}:
      "${text}"

      Return a JSON response with this structure:
      {
        "formattedText": "The text with **key terms** marked in bold and *important concepts* in italics",
        "summary": "A 2-sentence summary of the main points",
        "keyPoints": "Bullet points of the most important information"
      }
    `;

    return this.generateContent(prompt, {
      expectJSON: true,
      context: `text-enhancement-${purpose}`,
      cacheTTL: 30 * 60 * 1000 // 30 minutes cache
    });
  }

  /**
   * Cache Management
   */
  clearCache() {
    this.cache.clear();
    console.log('AI Service: Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        context: value.context,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp
      }))
    };
  }

  // Clean expired cache entries
  cleanExpiredCache() {
    let removedCount = 0;
    for (const [key, value] of this.cache.entries()) {
      if (!this.isCacheValid(value)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    console.log(`AI Service: Removed ${removedCount} expired cache entries`);
    return removedCount;
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
