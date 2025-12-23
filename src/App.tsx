import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Projects from './pages/Projects';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import Account from './pages/Account';
import Layout from './components/Layout';

const App: React.FC = () => {
  // Dummy admin state for now; swap for Amplify check later
  const [isAdmin] = useState(true); // TODO: Connect to real auth

  // Global styles to prevent horizontal scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router>
      <Layout isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
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
