import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { getCurrentUser } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
  } catch (e) {
          // Token is invalid or expired, clear it
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleSetUser = (userData) => {
    setUser(userData);
    if (userData) {
      // When user is set (e.g., after login), no need to store user object
      // The token is the source of truth, already in localStorage
    } else {
      // On logout, clear token
      localStorage.removeItem('token');
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} /> : <Login setUser={handleSetUser} />} />
        <Route path="/signup" element={user ? <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} /> : <Signup />} />
        <Route path="/manager" element={user && user.role === 'manager' ? <ManagerDashboard user={user} setUser={handleSetUser} /> : <Navigate to="/login" />} />
        <Route path="/employee" element={user && user.role === 'employee' ? <EmployeeDashboard user={user} setUser={handleSetUser} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;