import React from "react";
import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import styles from "./LearningDashboard.module.css";

const LearningDashboard = () => {
  const courses = [
    {
      id: 1,
      title: "College Selection",
      icon: <Award className={styles.courseIcon} />,
      description: "Find the right college for you",
      link: "/college-selection",
    },
    {
      id: 2,
      title: "Academic Planning",
      icon: <Award className={styles.courseIcon} />,
      description: "Plan your academic journey",
      link: "/academic-planning",
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Your Learning Dashboard</h1>
        <Link to="/" className={styles.homeLink}>
          Back to Home
        </Link>
      </header>

          {courses.map((course) => (
            <Link key={course.id} to={course.link} className={`${styles.courseCard}`}>
              {course.icon}
              <h3>{course.title}</h3>
              <p>{course.description}</p>
            </Link>
          ))}
    </div>
);
};

export default LearningDashboard;
