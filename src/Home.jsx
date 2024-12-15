import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Brain, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      icon: <Book className={styles.featureIcon} />,
      title: "Smart Learning",
      description: "Personalized learning paths tailored to your unique needs"
    },
    {
      icon: <Brain className={styles.featureIcon} />,
      title: "AI Powered",
      description: "Adaptive learning technology that grows with you"
    },
    {
      icon: <Target className={styles.featureIcon} />,
      title: "Goal Tracking",
      description: "Set, monitor, and achieve your learning objectives"
    }
  ];

  // Hero section animation variants
  const heroVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Feature card animation variants
  const featureVariants = {
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
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className={styles.homeContainer}>
      <motion.header 
        className={styles.heroSection}
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <div className={styles.heroContent}>
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Welcome to Kalimu
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Revolutionize Your Learning Journey
          </motion.p>
          <motion.button
            className={styles.ctaButton}
            onClick={() => navigate('/learning')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Start Planning
          </motion.button>
        </div>
      </motion.header>

      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <AnimatePresence>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={featureVariants}
                className={`${styles.featureCard} ${activeFeature === index ? styles.featureActive : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                {feature.icon}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * (index + 1) }}
                >
                  {feature.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * (index + 1) }}
                >
                  {feature.description}
                </motion.p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default Home;