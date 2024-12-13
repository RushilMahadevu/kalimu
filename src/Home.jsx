import React, { useState } from 'react';
import { Book, Brain, Target } from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
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

  return (
    <div className={styles.homeContainer}>
      <header className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to Kalimu</h1>
          <p className={styles.heroSubtitle}>Revolutionize Your Learning Journey</p>
          <button className={styles.ctaButton}>Start Learning</button>
        </div>
      </header>

      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`${styles.featureCard} ${activeFeature === index ? styles.featureActive : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              {feature.icon}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;