    import React, { useState } from 'react';
    import { Link } from 'react-router-dom';
    import { Book, Target, Award } from 'lucide-react';
    import styles from './LearningDashboard.module.css';

    const LearningDashboard = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);

    const courses = [
        {
        id: 1,
        title: "Introduction to Programming",
        icon: <Book className={styles.courseIcon} />,
        description: "Learn the fundamentals of programming",
        progress: 45
        },
        {
        id: 2,
        title: "Data Science Basics",
        icon: <Target className={styles.courseIcon} />,
        description: "Understand core data science concepts",
        progress: 30
        },
        {
        id: 3,
        title: "AI and Machine Learning",
        icon: <Award className={styles.courseIcon} />,
        description: "Dive into artificial intelligence principles",
        progress: 15
        }
    ];

    return (
        <div className={styles.dashboardContainer}>
        <header className={styles.dashboardHeader}>
            <h1>Your Learning Dashboard</h1>
            <Link to="/" className={styles.homeLink}>Back to Home</Link>
        </header>

        <section className={styles.coursesSection}>
            <h2>Your Courses</h2>
            <div className={styles.courseGrid}>
            {courses.map((course) => (
                <div 
                key={course.id} 
                className={`${styles.courseCard} ${selectedCourse === course.id ? styles.courseActive : ''}`}
                onClick={() => setSelectedCourse(course.id)}
                >
                {course.icon}
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className={styles.progressBar}>
                    <div 
                    className={styles.progress} 
                    style={{width: `${course.progress}%`}}
                    ></div>
                </div>
                <span className={styles.progressText}>{course.progress}% Complete</span>
                </div>
            ))}
            </div>
        </section>
        </div>
    );
    };

    export default LearningDashboard;