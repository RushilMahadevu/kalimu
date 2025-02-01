import { useState, useEffect } from 'react';
import { auth, saveNotes, loadNotes } from '../firebase';
import PropTypes from 'prop-types';
import styles from './Notes.module.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

function Notes({ isOpen, onClose }) {
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [showFormatted, setShowFormatted] = useState(true);

  useEffect(() => {
    const loadUserNotes = async () => {
      if (auth.currentUser) {
        try {
          const savedNotes = await loadNotes(auth.currentUser.uid);
          setNotes(savedNotes);
        } catch (error) {
          console.error("Error loading notes:", error);
        }
      }
    };

    if (isOpen) {
      loadUserNotes();
    }
  }, [isOpen]);

  const handleNotesChange = async (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    if (auth.currentUser) {
      setIsSaving(true);
      try {
        await saveNotes(auth.currentUser.uid, newNotes);
      } catch (error) {
        console.error("Error saving notes:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const tidyUpNotes = async () => {
    if (!notes.trim()) return;
    
    setIsTidying(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `
        As a professional note organizer, please format and organize these notes:
        "${notes}"

        Please:
        1. Fix any spelling or grammar issues
        2. Organize content into logical sections
        3. Add bullet points where appropriate
        4. Add headers for different topics
        5. Keep all important information
        6. Make it more readable and structured
        7. Use markdown formatting

        Return only the formatted notes, no explanations or additional text.
      `;

      const result = await model.generateContent(prompt);
      const formattedNotes = await result.response.text();
      
      setNotes(formattedNotes);
      if (auth.currentUser) {
        await saveNotes(auth.currentUser.uid, formattedNotes);
      }
    } catch (error) {
      console.error("Error tidying notes:", error);
    } finally {
      setIsTidying(false);
    }
  };

  const convertMarkdownToHTML = (text) => {
    return text
      // Convert headers (# Header) to proper HTML headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Convert bold (**text**) to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italics (*text*) to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert bullet points
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/<li>.*<\/li>/g, match => `<ul>${match}</ul>`)
      // Convert line breaks to paragraphs
      .split('\n\n').map(para => `<p>${para}</p>`).join('');
  };

  const renderFormattedNotes = () => {
    return {
      __html: convertMarkdownToHTML(notes)
    };
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modal} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.notesContainer}>
        <div className={styles.header}>
          <h2>Notes {isSaving && <span className={styles.savingIndicator}>Saving...</span>}</h2>
          <div className={styles.headerButtons}>
            <button 
              className={styles.tidyButton} 
              onClick={tidyUpNotes}
              disabled={isTidying || !notes.trim()}
            >
              {isTidying ? "Tidying..." : "Tidy Up"}
            </button>
            <button
              className={styles.toggleButton}
              onClick={() => setShowFormatted(!showFormatted)}
            >
              {showFormatted ? "Hide Formatted" : "Show Formatted"}
            </button>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
          </div>
        </div>
        <div className={styles.notesContent}>
          {isTidying ? (
            <div className={styles.loadingIndicator}>Tidying up your notes...</div>
          ) : (
            <>
              {showFormatted && (
                <div 
                  className={styles.formattedNotes}
                  dangerouslySetInnerHTML={renderFormattedNotes()}
                />
              )}
              <textarea
                className={styles.notesArea}
                value={notes}
                onChange={handleNotesChange}
                placeholder="Type your notes here..."
                style={{ height: !showFormatted ? '100%' : undefined }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Notes.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default Notes;
