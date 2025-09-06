import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Sources from './pages/Sources';
import TokenConfigs from './pages/TokenConfigs';
import Schedules from './pages/Schedules';
import History from './pages/History';
import Settings from './pages/Settings';

// Wizard
import WizardContainer from './components/wizard/WizardContainer';
import EditWizardContainer from './components/wizard/EditWizardContainer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sources" element={<Sources />} />
          <Route path="sources/new" element={<WizardContainer />} />
          <Route path="sources/edit/:id" element={<EditWizardContainer />} />
          <Route path="token-configs" element={<TokenConfigs />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;