import { useState, useEffect, useRef } from 'react';
import { auth, saveNotes, loadNotes } from '../firebase';
import { useUserProfile } from './hooks/useUserProfile';
import PropTypes from 'prop-types';
import styles from './Notes.module.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

function Notes({ isOpen, onClose }) {
  const { updateProfile } = useUserProfile();
  const [notes, setNotes] = useState({});
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [formattedNotes, setFormattedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [showFormatted, setShowFormatted] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [draggedNote, setDraggedNote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const titleInputRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 350); // Match the new 0.35s transition duration
  };

  useEffect(() => {
    const loadUserNotes = async () => {
      if (auth.currentUser) {
        try {
          const savedNotes = await loadNotes(auth.currentUser.uid);
          if (!savedNotes || Object.keys(savedNotes).length === 0) {
            const defaultNote = { 
              id: Date.now().toString(),
              title: 'New Note',
              content: '',
              lastModified: Date.now()
            };
            setNotes({ [defaultNote.id]: defaultNote });
            setActiveNoteId(defaultNote.id);
          } else {
            setNotes(savedNotes);
            setActiveNoteId(Object.keys(savedNotes)[0]);
          }
        } catch (error) {
          console.error("Error loading notes:", error);
          // Create a default note on error
          const defaultNote = {
            id: Date.now().toString(),
            title: 'New Note',
            content: '',
            lastModified: Date.now()
          };
          setNotes({ [defaultNote.id]: defaultNote });
          setActiveNoteId(defaultNote.id);
        }
      }
    };

    if (isOpen) {
      loadUserNotes();
    }
  }, [isOpen]);

  const handleNotesChange = async (content) => {
    if (!activeNoteId) return;

    const updatedNotes = {
      ...notes,
      [activeNoteId]: {
        ...notes[activeNoteId],
        content,
        lastModified: Date.now()
      }
    };

    setNotes(updatedNotes);
    setFormattedNotes('');
    
    if (auth.currentUser) {
      setIsSaving(true);
      try {
        // Save to both Firebase and user profile
        await saveNotes(auth.currentUser.uid, updatedNotes);
        await updateProfile('notes', updatedNotes);
      } catch (error) {
        console.error("Error saving notes:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: `New Note ${Object.keys(notes).length + 1}`,
      content: '',
      lastModified: Date.now()
    };

    setNotes(prev => ({
      ...prev,
      [newNote.id]: newNote
    }));
    setActiveNoteId(newNote.id);
  };

  const deleteNote = async (noteId) => {
    if (Object.keys(notes).length <= 1) return; // Prevent deleting last note

    const updatedNotes = { ...notes };
    delete updatedNotes[noteId];

    setNotes(updatedNotes);
    if (noteId === activeNoteId) {
      setActiveNoteId(Object.keys(updatedNotes)[0]);
    }

    if (auth.currentUser) {
      try {
        await saveNotes(auth.currentUser.uid, updatedNotes);
      } catch (error) {
        console.error("Error saving notes after deletion:", error);
      }
    }
  };

  const tidyUpNotes = async () => {
    const currentNote = notes[activeNoteId];
    if (!currentNote || !currentNote.content || !currentNote.content.trim()) return;
    
    setIsTidying(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `
        As a professional note organizer, please format and organize these notes:
        "${notes[activeNoteId].content}"

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
      const tidiedNotes = await result.response.text();
      
      setFormattedNotes(tidiedNotes); // Store formatted version separately
    } catch (error) {
      console.error("Error tidying notes:", error);
    } finally {
      setIsTidying(false);
    }
  };

  const convertMarkdownToHTML = (text) => {
    if (!text) return '';
    
    return text
      // Handle headers first with more specific regex
      .replace(/^###\s+(.*?)$/gm, (_, content) => `<h3>${content.trim()}</h3>`)
      .replace(/^##\s+(.*?)$/gm, (_, content) => `<h2>${content.trim()}</h2>`)
      .replace(/^#\s+(.*?)$/gm, (_, content) => `<h1>${content.trim()}</h1>`)
      
      // Handle lists
      .replace(/^\* (.*?):/gm, '<strong>$1:</strong>')
      .replace(/^\* ([^:]*?)$/gm, '<li>$1</li>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(?:<li>.*?<\/li>\n*)+/gs, match => `<ul>${match}</ul>`)
      
      // Handle inline formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<![*\w])\*([^*]+)\*(?![*\w])/g, '<em>$1</em>')
      
      // Handle paragraphs
      .split('\n\n')
      .map(para => {
        if (!para.trim()) return '';
        if (!para.includes('<ul>') && !para.includes('<h')) {
          return `<p>${para.trim()}</p>`;
        }
        return para.trim();
      })
      .filter(Boolean)
      .join('\n');
  };

  const renderFormattedNotes = () => {
    const textToFormat = formattedNotes || (activeNoteId ? notes[activeNoteId].content : '');
    return {
      __html: convertMarkdownToHTML(textToFormat)
    };
  };

  const handleDragStart = (e, noteId) => {
    setDraggedNote(noteId);
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(styles.dragging);
    setDraggedNote(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedNote || draggedNote === targetId) return;

    const orderedIds = Object.keys(notes);
    const draggedIdx = orderedIds.indexOf(draggedNote);
    const targetIdx = orderedIds.indexOf(targetId);

    orderedIds.splice(draggedIdx, 1);
    orderedIds.splice(targetIdx, 0, draggedNote);

    const reorderedNotes = {};
    orderedIds.forEach(id => {
      reorderedNotes[id] = notes[id];
    });

    setNotes(reorderedNotes);
    if (auth.currentUser) {
      saveNotes(auth.currentUser.uid, reorderedNotes);
    }
  };

  const startTitleEdit = (noteId) => {
    setEditingTitleId(noteId);
  };

  const handleTitleChange = async (noteId, newTitle) => {
    if (!newTitle.trim()) return;

    const updatedNotes = {
      ...notes,
      [noteId]: {
        ...notes[noteId],
        title: newTitle,
        lastModified: Date.now()
      }
    };

    setNotes(updatedNotes);
    setEditingTitleId(null);

    if (auth.currentUser) {
      try {
        await saveNotes(auth.currentUser.uid, updatedNotes);
      } catch (error) {
        console.error("Error saving note title:", error);
      }
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = showFormatted && formattedNotes ? formattedNotes : (activeNoteId ? notes[activeNoteId].content : '');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const pasteFromClipboard = async () => {
    if (!activeNoteId) return;
    
    try {
      const text = await navigator.clipboard.readText();
      const currentContent = notes[activeNoteId].content;
      const newContent = currentContent + (currentContent ? '\n\n' : '') + text;
      handleNotesChange(newContent);
    } catch (err) {
      console.error('Failed to paste text: ', err);
    }
  };

  const handleTitleKeyDown = (e, noteId) => {
    if (e.key === 'Enter') {
      handleTitleChange(noteId, e.target.value);
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modal} ${isVisible ? styles.visible : ''}`}>
      <div className={`${styles.notesContainer} ${isVisible ? styles.visible : ''}`}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>
              <span className={styles.titleIcon}>📝</span>
              My Notes
            </h3>
            <button className={styles.newNoteButton} onClick={createNewNote}>
              <span className={styles.buttonIcon}>+</span>
              New Note
            </button>
          </div>
          
          <div className={styles.notesListContainer}>
            {Object.entries(notes).map(([id, note]) => (
              <div
                key={`note-${id}`}
                className={`${styles.noteCard} ${id === activeNoteId ? styles.active : ''}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, id)}
                onClick={() => setActiveNoteId(id)}
              >
                <div className={styles.noteCardHeader}>
                  <span className={styles.dragHandle}>⋮⋮</span>
                  {editingTitleId === id ? (
                    <input
                      ref={titleInputRef}
                      className={styles.noteTitleEdit}
                      defaultValue={note.title}
                      onBlur={(e) => handleTitleChange(id, e.target.value)}
                      onKeyDown={(e) => handleTitleKeyDown(e, id)}
                      autoFocus
                    />
                  ) : (
                    <h4
                      className={styles.noteTitle}
                      onDoubleClick={() => startTitleEdit(id)}
                    >
                      {note.title}
                    </h4>
                  )}
                  <button
                    className={styles.deleteNoteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(id);
                    }}
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
                
                <div className={styles.notePreview}>
                  {note.content.slice(0, 80)}{note.content.length > 80 ? '...' : ''}
                </div>
                
                <div className={styles.noteMetadata}>
                  <span className={styles.lastModified}>
                    {new Date(note.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.titleSection}>
                <h2 className={styles.mainTitle}>
                  {activeNoteId ? notes[activeNoteId].title : 'Select a Note'}
                </h2>
                {isSaving && (
                  <div className={styles.savingIndicator}>
                    <div className={styles.savingSpinner}></div>
                    <span>Saving...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.headerActions}>
              <button 
                className={`${styles.actionButton} ${styles.tidyButton}`}
                onClick={tidyUpNotes}
                disabled={isTidying || !activeNoteId || !notes[activeNoteId]?.content?.trim()}
                title="AI-powered note organization"
              >
                <span className={styles.buttonIcon}>✨</span>
                {isTidying ? "Organizing..." : "Tidy Up"}
              </button>
              
              <button
                className={`${styles.actionButton} ${styles.toggleButton}`}
                onClick={() => setShowFormatted(!showFormatted)}
                disabled={!formattedNotes}
                title={showFormatted ? "Show original notes" : "Show formatted notes"}
              >
                <span className={styles.buttonIcon}>
                  {showFormatted ? "📝" : "📖"}
                </span>
                {showFormatted ? "Original" : "Formatted"}
              </button>
              
              <button
                className={`${styles.actionButton} ${styles.copyButton}`}
                onClick={copyToClipboard}
                disabled={!activeNoteId || (!notes[activeNoteId]?.content?.trim() && !formattedNotes)}
                title="Copy current notes to clipboard"
              >
                <span className={styles.buttonIcon}>
                  {copySuccess ? "✓" : "📋"}
                </span>
                {copySuccess ? "Copied!" : "Copy"}
              </button>
              
              <button
                className={`${styles.actionButton} ${styles.pasteButton}`}
                onClick={pasteFromClipboard}
                disabled={!activeNoteId}
                title="Paste from clipboard"
              >
                <span className={styles.buttonIcon}>📥</span>
                Paste
              </button>
              
              <button 
                className={styles.closeButton} 
                onClick={handleClose}
                title="Close notes"
              >
                ×
              </button>
            </div>
          </div>

          <div className={styles.contentArea}>
            {isTidying ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>AI is organizing your notes...</p>
                <span className={styles.loadingSubtext}>This may take a few moments</span>
              </div>
            ) : (
              <>
                {showFormatted && formattedNotes ? (
                  <div className={styles.formattedView}>
                    <div className={styles.formattedHeader}>
                      <span className={styles.formatBadge}>✨ AI Organized</span>
                    </div>
                    <div 
                      className={styles.formattedContent}
                      dangerouslySetInnerHTML={renderFormattedNotes()}
                    />
                  </div>
                ) : (
                  <div className={styles.editorContainer}>
                    <textarea
                      className={styles.noteEditor}
                      value={activeNoteId ? notes[activeNoteId].content : ''}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder={activeNoteId ? "Start writing your thoughts..." : "Select a note to begin editing"}
                      disabled={!activeNoteId}
                    />
                  </div>
                )}
              </>
            )}
          </div>
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