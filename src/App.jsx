import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./Home";
import LearningDashboard from "./LearningDashboard";

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learning" element={<LearningDashboard />} />
      </Routes>
    </Router>
  );
}

export default App