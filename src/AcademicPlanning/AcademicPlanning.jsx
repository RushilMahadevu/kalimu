import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    Calculator, 
    Calendar, 
    ClipboardCheck, 
    BookOpenCheck,
    LineChart,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AcademicPlanning.module.css';

const AcademicPlanning = () => {
    const navigate = useNavigate();
    const [activeCard, setActiveCard] = useState(null);

    const resources = [
        { 
            id: 1, 
            title: 'Course Selection Helper', 
            description: 'Get personalized course recommendations based on your goals and interests.',
            icon: <BookOpen className={styles.resourceIcon} />,
            path: '/academic-planning/course-selection',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        { 
            id: 2, 
            title: 'GPA Calculator & Tracker', 
            description: 'Track your academic performance and calculate your GPA in real-time.',
            icon: <Calculator className={styles.resourceIcon} />,
            path: '/academic-planning/gpa',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        { 
            id: 3, 
            title: 'Study Schedule Optimizer', 
            description: 'Create optimized study schedules that fit your lifestyle and goals.',
            icon: <Calendar className={styles.resourceIcon} />,
            path: '/academic-planning/study-schedule',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            id: 4,
            title: 'Homework Manager',
            description: 'Organize and track your assignments with smart reminders.',
            icon: <ClipboardCheck className={styles.resourceIcon} />,
            path: '/academic-planning/homework-manager',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        },
        {
            id: 5,
            title: 'Test Prep Assistant',
            description: 'Prepare for exams with personalized study plans and practice tests.',
            icon: <BookOpenCheck className={styles.resourceIcon} />,
            path: '/academic-planning/test-prep',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        },
        {
            id: 6,
            title: 'Academic Progress Tracker',
            description: 'Monitor your academic journey and celebrate your achievements.',
            icon: <LineChart className={styles.resourceIcon} />,
            path: '/academic-planning/progress-tracker',
            gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
        }
    ];

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

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: (custom) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: custom * 0.1,
                duration: 0.5
            }
        }),
        hover: {
            scale: 1.05,
            y: -10,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={styles.academicContainer}>
            {/* Header */}
            <motion.header 
                className={styles.academicHeader}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div className={styles.headerContent} variants={itemVariants}>
                    <div className={styles.titleSection}>
                        <div className={styles.titleBadge}>
                            <Sparkles size={16} />
                            <span>AI-Powered Academic Tools</span>
                        </div>
                        <h1 className={styles.academicTitle}>Academic Planning</h1>
                        <p className={styles.academicSubtitle}>
                            Optimize your academic journey with intelligent planning tools and insights
                        </p>
                    </div>
                    
                    <Link to="/learning" className={styles.backButton}>
                        <ArrowLeft size={20} />
                        Back to Courses
                    </Link>
                </motion.div>
            </motion.header>

            {/* Resources Section */}
            <motion.section 
                className={styles.resourcesSection}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div className={styles.sectionHeader} variants={itemVariants}>
                    <h2 className={styles.sectionTitle}>Academic Tools</h2>
                    <p className={styles.sectionSubtitle}>
                        Access comprehensive tools to excel in your academic pursuits
                    </p>
                </motion.div>

                <div className={styles.resourceList}>
                    <AnimatePresence>
                        {resources.map((resource, index) => (
                            <motion.div
                                key={resource.id}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                variants={cardVariants}
                                className={`${styles.resourceCard} ${activeCard === resource.id ? styles.resourceActive : ''}`}
                                onClick={() => resource.path && navigate(resource.path)}
                                onMouseEnter={() => setActiveCard(resource.id)}
                                onMouseLeave={() => setActiveCard(null)}
                                style={{ '--resource-gradient': resource.gradient }}
                            >
                                <div className={styles.resourceIconWrapper}>
                                    {resource.icon}
                                </div>
                                <h3 className={styles.resourceTitle}>{resource.title}</h3>
                                <p className={styles.resourceDescription}>{resource.description}</p>
                                <div className={styles.resourceOverlay}></div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.section>

            {/* Progress Indicator */}
            <motion.section 
                className={styles.progressSection}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
            >
                <motion.div className={styles.progressCard} variants={itemVariants}>
                    <div className={styles.progressContent}>
                        <h3>Your Academic Progress</h3>
                        <p>Track your learning achievements and milestones</p>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '0%' }}></div>
                        </div>
                        <span className={styles.progressText}>0% Complete</span>
                    </div>
                </motion.div>
            </motion.section>
        </div>
    );
};

export default AcademicPlanning;