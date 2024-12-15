import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LearningDashboard from './LearningDashboard/LearningDashboard';
import CollegeSelection from './CollegeSelection/CollegeSelection';
import CollegeMatcher from './CollegeSelection/CollegeMatcher/CollegeMatcher';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/learning" element={<LearningDashboard />} />
                <Route path="/college-selection" element={<CollegeSelection />} />
                <Route path="/college-selection/matcher" element={<CollegeMatcher />} />
            </Routes>
        </Router>
    );
}

export default App;
