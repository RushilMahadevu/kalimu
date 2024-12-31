import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./CourseSelectionHelper.css";

const CourseSelectionHelper = () => {
  const genAI = new GoogleGenerativeAI(
    process.env.VITE_REACT_APP_GEMINI_API_KEY
  );

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
      const prompt = `
        As an academic advisor, recommend 6 courses based on these student preferences:
        - Major/Field: ${preferences.major}
        - Academic Year: ${preferences.year}
        - Areas of Interest: ${preferences.interests}
        - Academic Goals: ${preferences.academicGoals}
        - Current GPA: ${preferences.currentGPA}
        - Preferred Course Load: ${preferences.courseLoad}

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

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/);
      const recommendationsData = jsonMatch
        ? JSON.parse(jsonMatch[1])
        : JSON.parse(text);

      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="course-helper-container">
      <div className="header">
        <Link to="/academic-planning" className="back-button">
          Back
        </Link>
      </div>
      <h1 className="page-title">Course Selection Helper</h1>

      <div className="preferences-form">
        <h2 className="form-title">Tell Us About Your Academic Goals</h2>

        <div className="input-group">
          <label htmlFor="major">Major/Field of Study</label>
          <input
            id="major"
            type="text"
            placeholder="e.g., Computer Science"
            value={preferences.major}
            onChange={(e) => handleInputChange("major", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="year">Academic Year</label>
          <select
            id="year"
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
          <label htmlFor="interests">Areas of Interest</label>
          <input
            id="interests"
            type="text"
            placeholder="e.g., AI, Web Development, Data Science"
            value={preferences.interests}
            onChange={(e) => handleInputChange("interests", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="academicGoals">Academic Goals</label>
          <input
            id="academicGoals"
            type="text"
            placeholder="e.g., Prepare for graduate school, Focus on industry skills"
            value={preferences.academicGoals}
            onChange={(e) => handleInputChange("academicGoals", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="courseLoad">Preferred Course Load</label>
          <select
            id="courseLoad"
            value={preferences.courseLoad}
            onChange={(e) => handleInputChange("courseLoad", e.target.value)}
          >
            <option value="light">Light (12-13 credits)</option>
            <option value="normal">Normal (14-16 credits)</option>
            <option value="heavy">Heavy (17-18 credits)</option>
          </select>
        </div>

        <button
          className="submit-button"
          onClick={generateRecommendations}
          disabled={isLoading}
        >
          {isLoading ? "Generating Recommendations..." : "Get Course Recommendations"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2 className="recommendations-title">Recommended Courses</h2>
          <div className="recommendations-grid">
            {recommendations.map((course, index) => (
              <div key={index} className="recommendation-card">
                <h3>{course.courseName}</h3>
                <p className="course-code">{course.courseCode}</p>
                <p>{course.description}</p>
                <div className="course-details">
                  <p><strong>Learning Outcomes:</strong> {course.outcomes}</p>
                  <p><strong>Prerequisites:</strong> {course.prerequisites}</p>
                  <p><strong>Career Relevance:</strong> {course.careerRelevance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelectionHelper;
