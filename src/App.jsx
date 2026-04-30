import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import GameDashboard from './components/GameDashboard';
import AppSetup from './components/AppSetup';

// Check if setup is needed
const isSetupComplete = () => {
  return localStorage.getItem('SUPABASE_URL') && localStorage.getItem('SUPABASE_ANON_KEY') && localStorage.getItem('NIM_API_KEY');
};

const ProtectedRoute = ({ children }) => {
  if (!isSetupComplete()) {
    return <Navigate to="/setup" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/setup" element={<AppSetup />} />
        <Route path="/auth" element={<ProtectedRoute><Auth /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><GameDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
