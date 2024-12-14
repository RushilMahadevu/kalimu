import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CollegeFinder.module.css';

const CollegeFinder = () => {
    return (
        <div className={styles.finderContainer}>
            <header className={styles.finderHeader}>
                <h1>College Finder</h1>
                <div className={styles.navigationButtons}>
                    <Link to="/college-selection" className={styles.backButton}>Back to Resources</Link>

                    <Link to="/" className={styles.backButton}>Back to Home</Link>
                </div>
            </header>
            <section className={styles.finderContent}>
                <h2>Find Your Perfect College Match</h2>
                {/* Add college finder functionality here */}
            </section>
        </div>
    );
};

export default CollegeFinder;
