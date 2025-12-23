import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Projects from './pages/Projects';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

const App: React.FC = () => {
  // Dummy admin state for now; swap for Amplify check later
  const [isAdmin] = useState(true); // TODO: Connect to real auth

  return (
    <Router>
      <Layout isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/admin"
            element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
