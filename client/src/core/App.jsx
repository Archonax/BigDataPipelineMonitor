import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from '../routes/Dashboard';
import Pipelines from '../routes/Pipelines';
import PipelineDetail from '../routes/PipelineDetail';
import Datasets from '../routes/Datasets';
import Runs from '../routes/Runs';
import RunDetail from '../routes/RunDetail';
import Alerts from '../routes/Alerts';
import AlertRules from '../routes/AlertRules';
function App() {
  return (
    <Router>
      <div className="app-container">
        
        {/* styl z index.css */}
        <nav>
          <h1>Big Data Pipeline Monitor</h1>
          <Link to="/">Dashboard</Link>
          <Link to="/pipelines">Pipeline</Link>
          <Link to="/datasets">Datasety</Link>
          <Link to="/runs">Běhy</Link>
          <Link to="/alerts">Alerty</Link>
          <Link to="/alert-rules">Pravidla Alertů</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/pipelines/:id" element={<PipelineDetail />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alert-rules" element={<AlertRules />} />
        </Routes>
        
      </div>
    </Router>
  );
}
export default App;