import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    Calculator, 
    Calendar, 
    ClipboardCheck, 
    BookOpenCheck,
    LineChart 
} from 'lucide-react';
import styles from './AcademicPlanning.module.css';

const AcademicPlanning = () => {
    const navigate = useNavigate();
    const resources = [
        { 
            id: 1, 
            title: 'Course Selection Helper', 
            icon: <BookOpen size={48} />,
            path: '/academic-planning/course-selection'
        },
        { 
            id: 2, 
            title: 'GPA Calculator & Tracker', 
            icon: <Calculator size={48} />,
            path: '/academic-planning/gpa'
        },
        { 
            id: 3, 
            title: 'Study Schedule Optimizer', 
            icon: <Calendar size={48} />,
            path: '/academic-planning/study-schedule'
        },
        {
            id: 4,
            title: 'Homework Manager',
            icon: <ClipboardCheck size={48} />,
            path: '/academic-planning/homework-manager'
        },
        {
            id: 5,
            title: 'Test Prep Assistant',
            icon: <BookOpenCheck size={48} />,
            path: '/academic-planning/test-prep'
        },
        {
            id: 6,
            title: 'Academic Progress Tracker',
            icon: <LineChart size={48} />,
            path: '/academic-planning/progress-tracker'
        }
    ];

    return (
        <div className={styles.collegeContainer}>
            <header className={styles.collegeHeader}>
                <h1 className="collegeTitle">Academic Planning</h1>
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
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AcademicPlanning;