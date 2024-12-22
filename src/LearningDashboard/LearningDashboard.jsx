import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Brain, BookMarked, Bolt} from "lucide-react";
import Xarrow from "react-xarrows";
import styles from "./LearningDashboard.module.css";

const LearningDashboard = () => {
  const courses = [
    {
      id: 1,
      title: "College Selection",
      icon: <GraduationCap className={styles.courseIcon} />,
      description: "Find the right college for you",
      link: "/college-selection",
    },
    {
      id: 2,
      title: "Academic Planning",
      icon: <Brain className={styles.courseIcon} />,
      description: "Plan your academic journey",
      link: "/academic-planning",
    },
    {
      id: 3,
      title: "Student Life",
      icon: <BookMarked className={styles.courseIcon} />,
      description: "Explore student opportunities",
      link: "/student-life",
    },
    {
      id: 4,
      title: "Personal Development",
      icon: <Bolt className={styles.courseIcon} />,
      description: "Grow your skills and knowledge",
      link: "/personal-development",
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Your Learning Dashboard</h1>
        <Link to="/" className={styles.homeLink}>
          Back to Home
        </Link>
      </header>

      <div className={styles.treeContainer}>
        <div className={styles.treeStructure}>
          <div id="start" className={styles.startNode}>
            Roadmap
          </div>
          
          <div className={styles.courseNodes}>
            {courses.map((course) => (
              <Link 
                key={course.id}
                to={course.link} 
                className={styles.courseCard}
                id={`node-${course.id}`}
              >
                {course.icon}
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </Link>
            ))}
          </div>

          {courses.map((course) => (
            <Xarrow
              key={course.id}
              start="start"
              end={`node-${course.id}`}
              color="var(--accent-color)"
              strokeWidth={3}
              path="smooth"
              curveness={0.3}
              startAnchor="bottom"
              endAnchor="top"
              animateDrawing={1}
              headShape="circle"
              headSize={4}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
