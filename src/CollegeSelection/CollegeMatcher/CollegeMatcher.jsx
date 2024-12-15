import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./CollegeMatcher.css";

const CollegeMatcher = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    process.env.VITE_REACT_APP_GEMINI_API_KEY
  );

  // State for user preferences
  const [preferences, setPreferences] = useState({
    academicInterest: "",
    location: "",
    budget: 50000,
    campusSize: "medium",
    specialNeeds: "",
  });

  // State for AI recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate AI recommendations
  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construct a detailed prompt for AI
      const prompt = `
        As an expert college counselor, generate a list of 6 college recommendations based on these student preferences:
        - Academic Interest: ${preferences.academicInterest}
        - Preferred Location: ${preferences.location}
        - Budget: $${preferences.budget}
        - Campus Size: ${preferences.campusSize}
        - Special Wants/Considerations: ${preferences.specialNeeds}

        For each college, provide:
        1. College Name
        2. Precise match to student's preferences
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

      // Generate content using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response (Gemini sometimes wraps JSON in markdown)
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/);
      const recommendationsData = jsonMatch
        ? JSON.parse(jsonMatch[1])
        : JSON.parse(text);

      // Set recommendations
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to generate recommendations", err);
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="college-matcher-container">
      <div className="header">
        <Link to="/college-selection" className="back-button">
          Back
        </Link>
      </div>
      <h1 className="page-title">AI College Matcher</h1>

      <div className="preferences-form">
        <h2 className="form-title">Tell Us About Your College Preferences</h2>

        <div className="input-group">
          <label htmlFor="academicInterest">Academic Interest</label>
          <input
            id="academicInterest"
            type="text"
            placeholder="e.g., Computer Science, Biology"
            value={preferences.academicInterest}
            onChange={(e) =>
              handleInputChange("academicInterest", e.target.value)
            }
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Preferred Location</label>
          <select
            id="location"
            value={preferences.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          >
            <option value="">Select Region</option>
            <option value="Northeast">Northeast</option>
            <option value="Southeast">Southeast</option>
            <option value="Midwest">Midwest</option>
            <option value="West">West Coast</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="budget">
            Annual Budget: ${preferences.budget.toLocaleString()}
          </label>
          <input
            id="budget"
            type="range"
            min="10000"
            max="100000"
            step="1000"
            value={preferences.budget}
            onChange={(e) =>
              handleInputChange("budget", Number(e.target.value))
            }
          />
        </div>

        <div className="input-group">
          <label htmlFor="campusSize">Campus Size</label>
          <select
            id="campusSize"
            value={preferences.campusSize}
            onChange={(e) => handleInputChange("campusSize", e.target.value)}
          >
            <option value="small">Small (&lt; 5,000 students)</option>
            <option value="medium">Medium (5,000-15,000 students)</option>
            <option value="large">Large (&gt; 15,000 students)</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="specialNeeds">Specific Wants/Needs</label>
          <input
            id="specialNeeds"
            type="text"
            placeholder="e.g., Need-based aid, Research opportunities"
            value={preferences.specialNeeds}
            onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
          />
        </div>

        <button
          className="submit-button"
          onClick={generateRecommendations}
          disabled={isLoading}
        >
          {isLoading ? "Generating Recommendations..." : "Find My Colleges"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2 className="recommendations-title">
            Your College Recommendations
          </h2>
          <div className="recommendations-grid">
            {recommendations.map((college, index) => (
              <div key={index} className="recommendation-card">
                <h3>{college.collegeName}</h3>
                <p>
                  <strong>Why a Good Match:</strong> {college.matchReason}
                </p>
                <p>
                  <strong>Estimated Annual Cost:</strong>
                  {college.estimatedCost.toLocaleString()}
                </p>
                <p>
                  <strong>Key Strengths:</strong> {college.keyStrengths}
                </p>
                <p>
                  <strong>Unique Opportunities:</strong>{" "}
                  {college.uniqueOpportunities}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeMatcher;
