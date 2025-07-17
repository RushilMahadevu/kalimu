import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Brain, ArrowLeft, Target, BookOpen, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./LearningDashboard.module.css";
import { useAuth } from "../auth/AuthContext";

const LearningDashboard = () => {
  const { user } = useAuth();
  const [activeCard, setActiveCard] = useState(null);

  const courses = [
    {
      id: 1,
      title: "College Selection",
      icon: <GraduationCap className={styles.courseIcon} />,
      description: "Find the right college for you with AI-powered recommendations",
      link: "/college-selection",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      progress: 0,
      status: "available"
    },
    {
      id: 2,
      title: "Academic Planning",
      icon: <Brain className={styles.courseIcon} />,
      description: "Plan your academic journey with personalized roadmaps",
      link: "/academic-planning",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      progress: 0,
      status: "available"
    }
  ];

  const stats = [
    { icon: <Target />, label: "Courses", value: "2" },
    { icon: <BookOpen />, label: "Progress", value: "0%" },
    { icon: <Zap />, label: "Streak", value: "0 days" }
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
        delay: custom * 0.2,
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
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <motion.header 
        className={styles.dashboardHeader}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className={styles.headerContent} variants={itemVariants}>
          <div className={styles.welcomeSection}>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className={styles.welcomeSubtitle}>
              Continue your learning journey with personalized courses
            </p>
          </div>
          
          <Link to="/" className={styles.homeLink}>
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div className={styles.statsContainer} variants={itemVariants}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.header>

      {/* Learning Path */}
      <motion.section 
        className={styles.learningPathSection}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className={styles.sectionHeader} variants={itemVariants}>
          <h2 className={styles.sectionTitle}>Your Learning Path</h2>
          <p className={styles.sectionSubtitle}>
            Follow your personalized roadmap to achieve your goals
          </p>
        </motion.div>

        <div className={styles.coursesContainer}>
          <motion.div 
            className={styles.startNode}
            variants={itemVariants}
          >
            <div className={styles.startIcon}>🎯</div>
            <span>Start Your Journey</span>
          </motion.div>
          
          <div className={styles.courseNodes}>
            <AnimatePresence>
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  variants={cardVariants}
                  className={`${styles.courseCard} ${activeCard === course.id ? styles.courseActive : ''}`}
                  onMouseEnter={() => setActiveCard(course.id)}
                  onMouseLeave={() => setActiveCard(null)}
                  style={{ '--course-gradient': course.color }}
                >
                  <Link to={course.link} className={styles.courseLink}>
                    <div className={styles.courseIconWrapper}>
                      {course.icon}
                    </div>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseDescription}>{course.description}</p>
                    
                    <div className={styles.courseProgress}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>{course.progress}% Complete</span>
                    </div>
                    
                    <div className={styles.courseStatus}>
                      <span className={`${styles.statusBadge} ${styles[course.status]}`}>
                        {course.status === 'available' ? 'Start Now' : course.status}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section 
        className={styles.quickActionsSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className={styles.sectionHeader} variants={itemVariants}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <p className={styles.sectionSubtitle}>
            Jump into your learning activities
          </p>
        </motion.div>

        <motion.div className={styles.quickActionsGrid} variants={itemVariants}>
          <div className={styles.quickActionCard}>
            <div className={styles.quickActionIcon}>
              <GraduationCap />
            </div>
            <h3>Resume Learning</h3>
            <p>Continue where you left off</p>
          </div>
          
          <div className={styles.quickActionCard}>
            <div className={styles.quickActionIcon}>
              <Target />
            </div>
            <h3>Set Goals</h3>
            <p>Define your learning objectives</p>
          </div>
          
          <div className={styles.quickActionCard}>
            <div className={styles.quickActionIcon}>
              <Brain />
            </div>
            <h3>AI Tutor</h3>
            <p>Get personalized help</p>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default LearningDashboard;