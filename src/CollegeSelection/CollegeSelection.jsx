import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './CollegeSelection.module.css';

const CollegeSelection = () => {
    const navigate = useNavigate();
    const resources = [
        { 
            id: 1, 
            title: 'College Matcher', 
            description: 'Find the best colleges for your goals.', 
            icon: '🎓',
            path: '/college-selection/matcher'
        },
        { 
            id: 2, 
            title: 'Admission Tips', 
            description: 'Obtain the best tips and strategies for you.', 
            icon: '📝',
            path: '/college-selection/admission-tips'
        },
    ];

    return (
        <div className={styles.collegeContainer}>
            <header className={styles.collegeHeader}>
                <h1 className='collegeTitle'>College Selection</h1>
                <div className={styles.navigationButtons}>
                    <Link to="/learning" className={styles.backButton}>Back to Courses</Link>
                </div>
            </header>
            <section className={styles.resourcesSection}>
                <h2>Resources</h2>
                <div className={styles.resourceList}>
                    {resources.map((resource) => (
                        <div 
                            key={resource.id} 
                            className={styles.resourceCard}
                            onClick={() => resource.path && navigate(resource.path)}
                            style={{ cursor: resource.path ? 'pointer' : 'default' }}
                        >
                            <div className={styles.resourceIcon}>{resource.icon}</div>
                            <h3>{resource.title}</h3>
                            <p>{resource.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default CollegeSelection;
