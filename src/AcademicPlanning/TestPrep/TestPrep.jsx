import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../../firebase';
import { loadTestPrep, addTestPrep, deleteTestPrep, updateTestPrep } from '../../../firebase';
import styles from './TestPrep.module.css';
import { Book, Calendar, Plus, Trash2, Pencil, ArrowLeft, Sparkles, BookOpenCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [highlightedNotes, setHighlightedNotes] = useState({});
  const [highlightingTestId, setHighlightingTestId] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [filter, setFilter] = useState('all');

  const safeRenderText = (text) => {
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return text.toString();
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text); // Converts object to string representation
    }
    return '';
  };

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

  const updateTest = async (testId, updatedData) => {
    if (!auth.currentUser) {
      setError('Please sign in to update tests');
      return;
    }

    try {
      await updateTestPrep(auth.currentUser.uid, testId, updatedData);
      setEditingTest(null);
      loadTests();
    } catch (error) {
      setError('Failed to update test');
      console.error('Error updating test:', error);
    }
  };

  const generateRecommendations = async () => {
    if (tests.length === 0) return;

    setIsGeneratingRecommendations(true);
    try {
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

  const highlightNotes = async (testId, notes) => {
    if (!notes || highlightingTestId) return;

    setHighlightingTestId(testId); // Set which test is being analyzed
    try {
      const prompt = `
        Analyze these study notes and highlight key concepts:
        "${notes}"

        Return a JSON response with this structure:
        {
          "formattedNotes": "The notes with **key terms** marked in bold and *important concepts* in italics",
          "summary": "A 2-sentence summary of the main points"
        }
      `;

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || [null, text];
      const analysis = jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(text);

      setHighlightedNotes(prev => ({
        ...prev,
        [testId]: analysis
      }));
    } catch (error) {
      console.error('Failed to highlight notes:', error);
      setError('Failed to analyze notes. Please try again.');
    } finally {
      setHighlightingTestId(null); // Clear the highlighting state
    }
  };

  // Get upcoming tests (next 7 days)
  const getUpcomingTests = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return tests.filter(test => {
      const testDate = new Date(test.testDate);
      return testDate >= new Date() && testDate <= nextWeek;
    }).sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
  };

  // Get filtered tests
  const getFilteredTests = () => {
    if (filter === 'all') return tests;
    if (filter === 'upcoming') return getUpcomingTests();
    if (filter === 'past') {
      return tests.filter(test => new Date(test.testDate) < new Date());
    }
    return tests.filter(test => test.difficulty === filter);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleBadge}>
              <BookOpenCheck size={18} />
              Academic Planning
            </div>
            <h1 className={styles.title}>Test Preparation</h1>
            <p className={styles.subtitle}>
              Organize your exam schedule and create effective study plans
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowForm(!showForm)}
              className={styles.addButton}
            >
              <Plus size={20} />
              Add Test
            </button>
            <Link to="/academic-planning" className={styles.backButton}>
              <ArrowLeft size={20} />
              Back to Academic Planning
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className={styles.error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={styles.content}>
        <motion.div 
          className={styles.mainContent}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <motion.div className={styles.statCard} variants={itemVariants}>
              <div className={styles.statValue}>{tests.length}</div>
              <div className={styles.statLabel}>Total Tests</div>
            </motion.div>
            <motion.div className={styles.statCard} variants={itemVariants}>
              <div className={styles.statValue}>{getUpcomingTests().length}</div>
              <div className={styles.statLabel}>Upcoming</div>
            </motion.div>
            <motion.div className={styles.statCard} variants={itemVariants}>
              <div className={styles.statValue}>
                {tests.filter(test => test.difficulty === 'hard').length}
              </div>
              <div className={styles.statLabel}>High Priority</div>
            </motion.div>
          </div>

          {/* Filter Bar */}
          <motion.div className={styles.filterBar} variants={itemVariants}>
            <div className={styles.filterButtons}>
              {['all', 'upcoming', 'easy', 'medium', 'hard'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`${styles.filterButton} ${filter === filterType ? styles.active : ''}`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Add Test Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                className={styles.formContainer}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={addTest} className={styles.testForm}>
                  <div className={styles.formHeader}>
                    <h3>Add New Test</h3>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className={styles.closeButton}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Subject</label>
                      <input
                        type="text"
                        placeholder="e.g., Mathematics"
                        value={newTest.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Topic</label>
                      <input
                        type="text"
                        placeholder="e.g., Calculus"
                        value={newTest.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Test Date</label>
                      <input
                        type="datetime-local"
                        value={newTest.testDate}
                        onChange={(e) => handleInputChange('testDate', e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Difficulty</label>
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
                  </div>
                  <div className={styles.formGroup}>
                    <label>Study Notes</label>
                    <textarea
                      placeholder="Add your study notes, key concepts, or reminders..."
                      value={newTest.studyNotes}
                      onChange={(e) => handleInputChange('studyNotes', e.target.value)}
                      className={styles.formTextarea}
                      rows="4"
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Add Test
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tests Grid */}
          {isLoading ? (
            <motion.div className={styles.loading} variants={itemVariants}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading tests...</p>
            </motion.div>
          ) : (
            <motion.div className={styles.testGrid} variants={containerVariants}>
              <AnimatePresence>
                {getFilteredTests().map((test, index) => (
                  <motion.div
                    key={test.id}
                    className={`${styles.testCard} ${styles[`difficulty-${test.difficulty}`]}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    custom={index}
                    layout
                  >
                    {editingTest?.id === test.id ? (
                      <div className={styles.editForm}>
                        <div className={styles.editHeader}>
                          <h3>Edit Test</h3>
                          <button
                            onClick={() => setEditingTest(null)}
                            className={styles.closeButton}
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label>Subject</label>
                            <input
                              type="text"
                              value={editingTest.subject}
                              onChange={(e) => setEditingTest({...editingTest, subject: e.target.value})}
                              className={styles.formInput}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Topic</label>
                            <input
                              type="text"
                              value={editingTest.topic}
                              onChange={(e) => setEditingTest({...editingTest, topic: e.target.value})}
                              className={styles.formInput}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Test Date</label>
                            <input
                              type="datetime-local"
                              value={editingTest.testDate}
                              onChange={(e) => setEditingTest({...editingTest, testDate: e.target.value})}
                              className={styles.formInput}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Difficulty</label>
                            <select
                              value={editingTest.difficulty}
                              onChange={(e) => setEditingTest({...editingTest, difficulty: e.target.value})}
                              className={styles.formSelect}
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Study Notes</label>
                          <textarea
                            value={editingTest.studyNotes}
                            onChange={(e) => setEditingTest({...editingTest, studyNotes: e.target.value})}
                            className={styles.formTextarea}
                            rows="4"
                          />
                        </div>
                        <div className={styles.formActions}>
                          <button
                            onClick={() => setEditingTest(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateTest(test.id, editingTest)}
                            className={styles.submitButton}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.testHeader}>
                          <div className={styles.testInfo}>
                            <div className={styles.testTitle}>{safeRenderText(test.subject)}</div>
                            <div className={styles.testTopic}>{safeRenderText(test.topic)}</div>
                            <div className={styles.testMeta}>
                              <div className={styles.testMetaItem}>
                                <Calendar size={16} />
                                <span>
                                  {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'No date set'}
                                </span>
                              </div>
                              <div className={styles.testMetaItem}>
                                <Clock size={16} />
                                <span>
                                  {test.testDate ? new Date(test.testDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No time set'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.testActions}>
                            <button
                              onClick={() => setEditingTest({...test})}
                              className={styles.editButton}
                              title="Edit test"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteTest(test.id)}
                              className={styles.deleteButton}
                              title="Delete test"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {test.studyNotes && (
                          <div className={styles.notesSection}>
                            <div className={styles.notesHeader}>
                              <h4>Study Notes</h4>
                              <button
                                onClick={() => highlightNotes(test.id, test.studyNotes)}
                                className={styles.aiButton}
                                disabled={highlightingTestId === test.id}
                              >
                                <Sparkles size={14} />
                                {highlightingTestId === test.id ? 'Analyzing...' : 'Highlight Key Points'}
                              </button>
                            </div>
                            {highlightedNotes[test.id] ? (
                              <div className={styles.highlightedNotes}>
                                <div className={styles.formattedNotes} 
                                     dangerouslySetInnerHTML={{ 
                                       __html: highlightedNotes[test.id].formattedNotes
                                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                     }} 
                                />
                                <div className={styles.notesSummary}>
                                  <strong>Summary:</strong> {highlightedNotes[test.id].summary}
                                </div>
                              </div>
                            ) : (
                              <div className={styles.testNotes}>{safeRenderText(test.studyNotes)}</div>
                            )}
                          </div>
                        )}

                        <div className={styles.testFooter}>
                          <div className={styles.difficultyBadge}>
                            <span className={styles[`badge-${test.difficulty}`]}>
                              {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                            </span>
                          </div>
                          {test.testDate && (
                            <div className={styles.timeRemaining}>
                              {new Date(test.testDate) > new Date() ? 
                                `${Math.ceil((new Date(test.testDate) - new Date()) / (1000 * 60 * 60 * 24))} days left` :
                                'Past due'
                              }
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* AI Sidebar */}
        <motion.div className={styles.sidebar} variants={itemVariants}>
          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <Sparkles size={20} />
              <h3>AI Study Assistant</h3>
            </div>
            <button
              onClick={generateRecommendations}
              className={styles.generateButton}
              disabled={isGeneratingRecommendations || tests.length === 0}
            >
              {isGeneratingRecommendations ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Study Plan
                </>
              )}
            </button>

            {aiRecommendations && (
              <div className={styles.recommendationsContent}>
                {Object.entries(aiRecommendations).map(([key, value]) => (
                  <div key={key} className={styles.recommendationSection}>
                    <h4>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h4>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {tests.length === 0 && (
              <div className={styles.emptyState}>
                <BookOpenCheck size={48} />
                <p>Add your first test to get started with AI-powered study recommendations!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestPrep;
