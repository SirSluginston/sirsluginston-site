import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Projects from './pages/Projects';
import About from './pages/About';
import Account from './pages/Account';
import Treasury from './pages/Treasury';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppRoutes: React.FC = () => {
  const { isAdmin } = useAuth();

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

  // Don't block on auth loading - render immediately, auth checks in background
  return (
    <Router>
      <Layout isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
          <Route 
            path="/treasury" 
            element={isAdmin ? <Treasury /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
