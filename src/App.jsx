import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LearningDashboard from './LearningDashboard/LearningDashboard';
import CollegeSelection from './CollegeSelection/CollegeSelection';
import CollegeFinder from './CollegeSelection/CollegeFinder/CollegeFinder';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/learning" element={<LearningDashboard />} />
                <Route path="/college-selection" element={<CollegeSelection />} />
                <Route path="/college-selection/finder" element={<CollegeFinder />} />
            </Routes>
        </Router>
    );
}

export default App;
