import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Brain, Target, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Home.module.css';
import { useAuth } from './auth/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [activeFeature, setActiveFeature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: <Book className={styles.featureIcon} />,
      title: "Smart Learning",
      description: "Personalized learning paths tailored to your unique needs",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      icon: <Brain className={styles.featureIcon} />,
      title: "AI Powered",
      description: "Adaptive learning technology that grows with you",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      icon: <Target className={styles.featureIcon} />,
      title: "Goal Tracking",
      description: "Set, monitor, and achieve your learning objectives",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
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
      y: -10,
      transition: { duration: 0.3 }
    }
  };

  const handleStartPlanning = async () => {
    if (!user) {
      setIsLoading(true);
      try {
        await signInWithGoogle();
        navigate('/learning');
      } catch (error) {
        console.error('Sign in failed:', error);
        alert('Failed to sign in. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate('/learning');
    }
  };

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <motion.section 
        className={styles.heroSection}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className={styles.heroContent}>
          <motion.div className={styles.heroBadge} variants={itemVariants}>
            <Sparkles size={16} />
            <span>AI-Powered Learning Platform</span>
          </motion.div>
          
          <motion.h1 className={styles.heroTitle} variants={itemVariants}>
            Welcome to <span className={styles.brandName}>Kalimu</span>
          </motion.h1>
          
          <motion.p className={styles.heroSubtitle} variants={itemVariants}>
            Revolutionize your learning journey with personalized AI-driven education
          </motion.p>
          
          <motion.div className={styles.heroActions} variants={itemVariants}>
            <motion.button
              className={styles.ctaButton}
              onClick={handleStartPlanning}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  {user ? 'Start Learning' : 'Sign in to Start'}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
            
            <motion.button
              className={styles.secondaryButton}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
        
        <div className={styles.heroVisual}>
          <div className={styles.floatingElements}>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features"
        className={styles.featuresSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className={styles.sectionHeader} variants={itemVariants}>
          <h2 className={styles.sectionTitle}>Why Choose Kalimu?</h2>
          <p className={styles.sectionSubtitle}>
            Experience the future of learning with our cutting-edge features
          </p>
        </motion.div>
        
        <div className={styles.featuresGrid}>
          <AnimatePresence>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                variants={featureVariants}
                className={`${styles.featureCard} ${activeFeature === index ? styles.featureActive : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
                style={{ '--gradient': feature.gradient }}
              >
                <div className={styles.featureIconWrapper}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
                <div className={styles.featureOverlay}></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className={styles.ctaSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className={styles.ctaContent} variants={itemVariants}>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Learning?</h2>
          <p className={styles.ctaSubtitle}>
            Start your personalized learning journey with Kalimu today
          </p>
          <motion.button
            className={styles.ctaButton}
            onClick={handleStartPlanning}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <div className={styles.spinner} />
            ) : (
              <>
                Get Started Now
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;