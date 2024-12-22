import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./CommonAppHelper.module.css";

const CommonAppHelper = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    process.env.VITE_REACT_APP_GEMINI_API_KEY
  );

  // State for essay details
  const [essayDetails, setEssayDetails] = useState({
    prompt: "",
    draftContent: "",
    tone: "personal",
    theme: "",
  });

  // State for AI feedback
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for expanded cards
  const [expandedCard, setExpandedCard] = useState(null);

  // Calculate word count
  const wordCount = essayDetails.draftContent
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEssayDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate AI feedback
  const generateFeedback = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
        As an expert college admissions counselor, analyze this Common App essay draft and provide detailed feedback:
        
        Essay Prompt: ${essayDetails.prompt}
        Draft Content: ${essayDetails.draftContent}
        Desired Tone: ${essayDetails.tone}
        Theme/Message: ${essayDetails.theme}
        Word Count: ${wordCount}

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

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean and parse the JSON response
      let cleanedText = text;
      
      // Remove markdown code blocks if present
      if (text.includes('```')) {
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          cleanedText = jsonMatch[1];
        }
      }

      // Remove any potential leading/trailing whitespace
      cleanedText = cleanedText.trim();

      try {
        const feedbackData = JSON.parse(cleanedText);
        if (!Array.isArray(feedbackData)) {
          throw new Error('Response is not an array');
        }
        setFeedback(feedbackData);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.log("Attempted to parse:", cleanedText);
        setError("Failed to parse AI response. Please try again.");
      }
    } catch (err) {
      console.error("Failed to generate feedback:", err);
      setError("Failed to generate feedback. Please try again.");
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
      <h1 className="page-title">Common App Essay Helper</h1>

      <div className="preferences-form">
        <h2 className="form-title">Essay Details</h2>

        <div className="input-group">
          <label htmlFor="prompt">Selected Essay Prompt</label>
          <input
            id="prompt"
            type="text"
            placeholder="Enter your chosen Common App prompt"
            value={essayDetails.prompt}
            onChange={(e) => handleInputChange("prompt", e.target.value)}
          />
        </div>

        <div
          className="input-group"
          style={{ width: "100%", maxWidth: "900px", marginBottom: "1.5rem" }}
        >
          <label
            htmlFor="draftContent"
            style={{
              color: "var(--text-color)",
              fontSize: "1.1rem",
              marginBottom: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Essay Draft</span>
            <span
              style={{
                backgroundColor: "rgba(138, 43, 226, 0.2)",
                padding: "0.3rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.9rem",
                border: "1px solid rgba(138, 43, 226, 0.3)",
                boxShadow: "0 0 10px rgba(138, 43, 226, 0.1)",
              }}
            >
              Words: {wordCount}
            </span>
          </label>
          <textarea
            id="draftContent"
            className="essay-textarea"
            placeholder="Paste your essay draft here"
            value={essayDetails.draftContent}
            onChange={(e) => {
              handleInputChange("draftContent", e.target.value);
            }}
            style={{
              backgroundColor: "rgba(138, 43, 226, 0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "12px",
              padding: "1.25rem",
              fontSize: "1rem",
              lineHeight: "1.6",
              width: "95%",
              minHeight: "50px",
              boxShadow:
                "0 4px 15px rgba(0, 0, 0, 0.1), 0 0 20px rgba(138, 43, 226, 0.1)",
              "::placeholder": { color: "rgba(255, 255, 255, 0.7)" },
            }}
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label htmlFor="tone">Desired Tone</label>
            <select
              id="tone"
              value={essayDetails.tone}
              onChange={(e) => handleInputChange("tone", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="personal">Personal & Reflective</option>
              <option value="academic">Academic & Professional</option>
              <option value="narrative">Narrative & Storytelling</option>
              <option value="analytical">Analytical & Thoughtful</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="theme">Main Theme/Message</label>
          <input
            id="theme"
            type="text"
            placeholder="e.g., Personal growth through challenge"
            value={essayDetails.theme}
            onChange={(e) => handleInputChange("theme", e.target.value)}
          />
        </div>

        <button
          className="submit-button"
          onClick={generateFeedback}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing Essay..." : "Get Expert Feedback"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {feedback.length > 0 && (
        <div className="recommendations-section">
          <h2 className="recommendations-title">Essay Analysis & Feedback</h2>
          <div className="recommendations-grid">
            {feedback.map((item, index) => (
              <div
                key={index}
                className="recommendation-card"
                data-expanded={expandedCard === index}
                onClick={() =>
                  setExpandedCard(expandedCard === index ? null : index)
                }
                style={{ cursor: "pointer" }}
              >
                <h3>{item.aspectTitle}</h3>
                <div
                  className="card-content"
                  data-expanded={expandedCard === index}
                >
                  <p>
                    <strong>Analysis:</strong> {item.analysis}
                  </p>
                  <p>
                    <strong>Strengths:</strong> {item.strengthsIdentified}
                  </p>
                  <p>
                    <strong>Suggestions:</strong> {item.improvementSuggestions}
                  </p>
                  {item.examples && item.examples.trim() !== "" && (
                    <p>
                      <strong>Examples:</strong> {item.examples}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonAppHelper;
