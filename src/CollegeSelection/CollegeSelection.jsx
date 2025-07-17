import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Diameter, FileText, Coins, LayoutPanelLeft, MapPin, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CollegeSelection.module.css';

const CollegeSelection = () => {
    const navigate = useNavigate();
    const [activeCard, setActiveCard] = useState(null);

    const resources = [
        { 
            id: 1, 
            title: 'College Matcher', 
            description: 'Find the best colleges for your goals with AI-powered recommendations.', 
            icon: <Diameter className={styles.resourceIcon} />,
            path: '/college-selection/matcher',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        { 
            id: 2, 
            title: 'Admission Tips', 
            description: 'Get expert tips and strategies for successful college applications.', 
            icon: <FileText className={styles.resourceIcon} />,
            path: '/college-selection/admission-tips',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        { 
            id: 3, 
            title: 'Scholarship Finder', 
            description: 'Discover scholarships and financial aid opportunities.', 
            icon: <Coins className={styles.resourceIcon} />,
            path: '/college-selection/scholarship-finder',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            id: 4,
            title: 'Common App Helper',
            description: 'Navigate the Common Application with personalized guidance.',
            icon: <LayoutPanelLeft className={styles.resourceIcon} />,
            path: '/college-selection/common-app-helper',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        },
        {
            id: 5,
            title: 'College Visit Planner',
            description: 'Plan and organize your college visits efficiently.',
            icon: <MapPin className={styles.resourceIcon} />,
            path: '/college-selection/college-visit-planner',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
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
        <div className={styles.collegeContainer}>
            {/* Header */}
            <motion.header 
                className={styles.collegeHeader}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div className={styles.headerContent} variants={itemVariants}>
                    <div className={styles.titleSection}>
                        <div className={styles.titleBadge}>
                            <Sparkles size={16} />
                            <span>AI-Powered College Guidance</span>
                        </div>
                        <h1 className={styles.collegeTitle}>College Selection</h1>
                        <p className={styles.collegeSubtitle}>
                            Navigate your path to higher education with personalized tools and insights
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
                    <h2 className={styles.sectionTitle}>Choose Your Path</h2>
                    <p className={styles.sectionSubtitle}>
                        Access comprehensive tools to guide your college journey
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
                        <h3>Your Progress</h3>
                        <p>Track your college selection journey</p>
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

export default CollegeSelection;