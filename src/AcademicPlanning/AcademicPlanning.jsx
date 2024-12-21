import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './AcademicPlanning.module.css';

const AcademicPlanning = () => {
    const navigate = useNavigate();
    const resources = [
        { 
            id: 1, 
            title: 'Course Planner', 
            description: 'Plan your courses for the upcoming semesters.', 
            icon: '📅',
            path: '/academic-planning/course-planner'
        },
        { 
            id: 2, 
            title: 'Study Resources', 
            description: 'Access study materials and resources.', 
            icon: '📚',
            path: '/academic-planning/study-resources'
        },
    ];

    return (
        <div className={styles.academicContainer}>
            <header className={styles.academicHeader}>
                <h1 className='academicTitle'>Academic Planning</h1>
                <div className={styles.navigationButtons}>
                    <Link to="/learning" className={styles.backButton}>Back to Dashboard</Link>
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

export default AcademicPlanning;