import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./ScholarshipFinder.css";

const ScholarshipFinder = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
  );

  // State for user preferences
  const [preferences, setPreferences] = useState({
    academicField: "",
    location: "",
    financialNeed: false,
    meritBased: false,
    minorityGroups: "",
    deadlineRange: "",
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
        As a scholarship advisor, generate a list of 6 scholarship opportunities tailored to these preferences:
        - Academic Field: ${preferences.academicField}
        - Location: ${preferences.location}
        - Financial Need: ${preferences.financialNeed}
        - Merit-Based: ${preferences.meritBased}
        - Minority Group Considerations: ${preferences.minorityGroups}
        - Application Deadline Range: ${preferences.deadlineRange}

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
    <div className="scholarship-finder-container">
      <div className="header">
        <Link to="/college-selection" className="back-button">
          Back
        </Link>
      </div>
      <h1 className="page-title">AI Scholarship Finder</h1>

      <div className="preferences-form">
        <h2 className="form-title">Tell Us About Your Preferences</h2>

        <div className="input-group">
          <label htmlFor="academicField">Academic Field</label>
          <input
            id="academicField"
            type="text"
            placeholder="e.g., Engineering, Medicine"
            value={preferences.academicField}
            onChange={(e) =>
              handleInputChange("academicField", e.target.value)
            }
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Preferred Location</label>
          <input
            id="location"
            type="text"
            placeholder="e.g., United States, California"
            value={preferences.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </div>

        <div className="input-group-checkbox">
          <label>
            Financial Need
            <input
              type="checkbox"
              checked={preferences.financialNeed}
              onChange={(e) =>
                handleInputChange("financialNeed", e.target.checked)
              }
            />
          </label>
        </div>

        <div className="input-group-checkbox">
          <label>
            Merit-Based
            <input
              type="checkbox"
              checked={preferences.meritBased}
              onChange={(e) =>
                handleInputChange("meritBased", e.target.checked)
              }
            />
          </label>
        </div>

        <div className="input-group">
          <label htmlFor="minorityGroups">Minority Groups</label>
          <input
            id="minorityGroups"
            type="text"
            placeholder="e.g., Women, Hispanic"
            value={preferences.minorityGroups}
            onChange={(e) =>
              handleInputChange("minorityGroups", e.target.value)
            }
          />
        </div>

        <div className="input-group">
          <label htmlFor="deadlineRange">Deadline Range</label>
          <input
            id="deadlineRange"
            type="text"
            placeholder="e.g., Jan 2024 - Mar 2024"
            value={preferences.deadlineRange}
            onChange={(e) =>
              handleInputChange("deadlineRange", e.target.value)
            }
          />
        </div>

        <button
          className="submit-button"
          onClick={generateRecommendations}
          disabled={isLoading}
        >
          {isLoading ? "Finding Scholarships..." : "Find Scholarships"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2 className="recommendations-title">
            Your Scholarship Recommendations
          </h2>
          <div className="recommendations-grid">
            {recommendations.map((scholarship, index) => (
              <div key={index} className="recommendation-card">
                <h3>{scholarship.scholarshipName}</h3>
                <p>
                  <strong>Eligibility:</strong> {scholarship.eligibilityCriteria}
                </p>
                <p>
                  <strong>Award Amount:</strong> ${scholarship.awardAmount.toLocaleString()}
                </p>
                <p>
                  <strong>Deadline:</strong> {scholarship.applicationDeadline}
                </p>
                <p>
                  <strong>Apply Here:</strong>{" "}
                  <a href={scholarship.applicationLink} target="_blank" rel="noopener noreferrer">
                    {scholarship.applicationLink}
                  </a>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipFinder;
