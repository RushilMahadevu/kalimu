import React from 'react';
import Home from './Home';
import LearningDashboard from './LearningDashboard/LearningDashboard';
import CollegeSelection from './CollegeSelection/CollegeSelection';
import CollegeMatcher from './CollegeSelection/CollegeMatcher/CollegeMatcher';
import AdmissionTips from './CollegeSelection/AdmissionTips/AdmissionTips';
import ScholarshipFinder from './CollegeSelection/ScholarshipFinder/ScholarshipFinder';
import CommonAppHelper from './CollegeSelection/CommonAppHelper/CommonAppHelper';
import AcademicPlanning from './AcademicPlanning/AcademicPlanning';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const PageWrapper = ({ children }) => {
  const pageVariants = {
    initial: { 
      opacity: 0,
      y: 20
    },
    in: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    out: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4,
        ease: 'easeIn'
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      // makes sure page doesnt get formatted wrong
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageWrapper>
            <Home />
          </PageWrapper>
        } />
        <Route path="/learning" element={
          <PageWrapper>
            <LearningDashboard />
          </PageWrapper>
        } />
        <Route path="/college-selection/*" element={
          <PageWrapper>
            <Routes>
              <Route path="" element={<CollegeSelection />} />
              <Route path="matcher" element={<CollegeMatcher />} />
              <Route path="admission-tips" element={<AdmissionTips />} />
              <Route path="scholarship-finder" element={< ScholarshipFinder />} />
              <Route path="common-app-helper" element={< CommonAppHelper />} />
            </Routes>
          </PageWrapper>
        } />
        <Route path="/academic-planning/*" element={
          <PageWrapper>
            <Routes>
              <Route path="" element={<AcademicPlanning />} />
            </Routes>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div style={{ position: 'relative' }}>
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;