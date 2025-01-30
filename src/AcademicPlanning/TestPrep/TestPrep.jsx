import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../../firebase';
import { loadTestPrep, addTestPrep, deleteTestPrep } from '../../../firebase';
import styles from './TestPrep.module.css';
import { Book, Calendar, Plus, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const TestPrep = () => {
  const [tests, setTests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTest, setNewTest] = useState({
    subject: '',
    topic: '',
    testDate: '',
    difficulty: 'medium',
    studyNotes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedTests = await loadTestPrep(auth.currentUser.uid);
      setTests(loadedTests);
    } catch (error) {
      setError('Failed to load tests');
      console.error('Error loading tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewTest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTest = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in to add tests');
      return;
    }

    try {
      const testData = {
        ...newTest,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addTestPrep(testData);
      setNewTest({
        subject: '',
        topic: '',
        testDate: '',
        difficulty: 'medium',
        studyNotes: ''
      });
      setShowForm(false);
      loadTests();
    } catch (error) {
      setError('Failed to add test');
      console.error('Error adding test:', error);
    }
  };

  const deleteTest = async (testId) => {
    try {
      await deleteTestPrep(auth.currentUser.uid, testId);
      loadTests();
    } catch (error) {
      setError('Failed to delete test');
      console.error('Error deleting test:', error);
    }
  };

  const generateRecommendations = async () => {
    if (tests.length === 0) return;

    setIsGeneratingRecommendations(true);
    try {
      const prompt = `
        As a test preparation expert, analyze these upcoming tests and provide study recommendations.
        Tests: ${JSON.stringify(tests)}

        Return a JSON response with EXACTLY this structure:
        {
          "overview": "Brief analysis of upcoming test load and priorities",
          "studyPlan": "Detailed study plan based on test dates and difficulties",
          "techniques": "Specific study techniques for each subject",
          "timeManagement": "Time allocation recommendations for optimal preparation"
        }
      `;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || [null, text];
      const recommendations = jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(text);

      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setError('Failed to generate AI recommendations. Please try again.');
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Test Preparation Manager</h1>
        <div className={styles.headerButtons}>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.addButton}
          >
            <Plus size={20} />
            Add Test
          </button>
          <Link to="/academic-planning" className={styles.backButton}>
            Back to Academic Planning
          </Link>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          {showForm && (
            <form onSubmit={addTest} className={styles.testForm}>
              <div className={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Subject"
                  value={newTest.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Topic"
                  value={newTest.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className={styles.formInput}
                  required
                />
                <input
                  type="datetime-local"
                  value={newTest.testDate}
                  onChange={(e) => handleInputChange('testDate', e.target.value)}
                  className={styles.formInput}
                  required
                />
                <select
                  value={newTest.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <textarea
                placeholder="Study Notes"
                value={newTest.studyNotes}
                onChange={(e) => handleInputChange('studyNotes', e.target.value)}
                className={styles.formTextarea}
                rows="3"
              />
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Add Test
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className={styles.loading}>Loading tests...</div>
          ) : (
            <div className={styles.testGrid}>
              {tests.map((test) => (
                <div key={test.id} className={styles.testCard}>
                  <div className={styles.testHeader}>
                    <div>
                      <h3 className={styles.testTitle}>{test.subject}</h3>
                      <div className={styles.testMeta}>
                        <div className={styles.testMetaItem}>
                          <Book size={16} />
                          <span>{test.topic}</span>
                        </div>
                        <div className={styles.testMetaItem}>
                          <Calendar size={16} />
                          <span>{new Date(test.testDate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTest(test.id)}
                      className={styles.deleteButton}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {test.studyNotes && (
                    <p className={styles.testNotes}>{test.studyNotes}</p>
                  )}
                  <div className={styles.difficultyBadge}>
                    <span className={styles[`difficulty-${test.difficulty}`]}>
                      {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)} Difficulty
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.aiSidebar}>
          <div className={styles.aiCard}>
            <h2>AI Study Recommendations</h2>
            <button
              onClick={generateRecommendations}
              className={styles.generateButton}
              disabled={isGeneratingRecommendations || tests.length === 0}
            >
              {isGeneratingRecommendations ? "Analyzing..." : "Generate Study Plan"}
            </button>

            {aiRecommendations && (
              <div className={styles.recommendationsContent}>
                {Object.entries(aiRecommendations).map(([key, value]) => (
                  <div key={key} className={styles.recommendationSection}>
                    <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPrep;
