import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './AdmissionTips.css';

const AdmissionProfile = () => {
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
  );

  // State for user profile
  const [profile, setProfile] = useState({
    gpa: '',
    testScores: '',
    extracurriculars: '',
    academicInterest: '',
    challengedBackground: ''
  });

  // State for AI-generated tips
  const [admissionTips, setAdmissionTips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate personalized admission tips
  const generateAdmissionTips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construct a detailed prompt for AI
      const prompt = `
        As an expert college admissions counselor, provide 5 highly personalized 
        and strategic admission tips based on this student profile:
        - GPA: ${profile.gpa}
        - Test Scores: ${profile.testScores}
        - Extracurricular Activities: ${profile.extracurriculars}
        - Academic Interest: ${profile.academicInterest}
        - Challenged Background: ${profile.challengedBackground}

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

      // Generate content using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response (Gemini sometimes wraps JSON in markdown)
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/);
      const tipsData = jsonMatch
        ? JSON.parse(jsonMatch[1])
        : JSON.parse(text);

      // Set admission tips
      setAdmissionTips(tipsData);
    } catch (err) {
      console.error("Failed to generate admission tips", err);
      setError("Failed to generate tips. Please try again.");
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
      <h1 className="page-title">AI Admission Tips</h1>

      <div className="preferences-form">
        <h2 className="form-title">Your Profile</h2>

        <div className="input-row">
          <div className="input-group separated">
            <label htmlFor="gpa">Current GPA</label>
            <input
              id="gpa"
              type="text"
              placeholder="e.g., 3.7, 4.2"
              value={profile.gpa}
              onChange={(e) => handleInputChange("gpa", e.target.value)}
            />
          </div>

          <div className="input-group separated">
            <label htmlFor="testScores">Standardized Test Scores</label>
            <input
              id="testScores"
              type="text"
              placeholder="e.g., SAT 1450, ACT 32"
              value={profile.testScores}
              onChange={(e) => handleInputChange("testScores", e.target.value)}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group separated">
            <label htmlFor="extracurriculars">Key Extracurricular Activities</label>
            <input
              id="extracurriculars"
              type="text"
              placeholder="e.g., Debate Club President, Robotics Team"
              value={profile.extracurriculars}
              onChange={(e) => handleInputChange("extracurriculars", e.target.value)}
            />
          </div>

          <div className="input-group separated">
            <label htmlFor="academicInterest">Primary Academic Interest</label>
            <input
              id="academicInterest"
              type="text"
              placeholder="e.g., Computer Science, Biomedical Engineering"
              value={profile.academicInterest}
              onChange={(e) => handleInputChange("academicInterest", e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="challengedBackground">Any Unique Challenges?</label>
          <input
            id="challengedBackground"
            type="text"
            placeholder="e.g., First-generation student, Economic constraints"
            value={profile.challengedBackground}
            onChange={(e) => handleInputChange("challengedBackground", e.target.value)}
          />
        </div>

        <div className="button-group">
          <button
            className="submit-button"
            onClick={generateAdmissionTips}
            disabled={isLoading}
          >
            {isLoading ? "Generating Strategies..." : "Get My Admission Tips"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {admissionTips.length > 0 && (
        <div className="recommendations-section">
          <h2 className="recommendations-title">
            Personalized Admission Strategies
          </h2>
          <div className="recommendations-grid">
            {admissionTips.map((tip, index) => (
              <div key={index} className="recommendation-card">
                <h3>{tip.tipTitle}</h3>
                <p>
                  <strong>Tip:</strong> {tip.tipDescription}
                </p>
                <p>
                  <strong>Strategic Rationale:</strong> {tip.strategicRationale}
                </p>
                <p>
                  <strong>Potential Impact:</strong> {tip.potentialImpact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionProfile;