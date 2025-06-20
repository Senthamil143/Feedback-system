import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    user = null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/manager" element={user && user.role === 'manager' ? <ManagerDashboard /> : <Navigate to="/" />} />
        <Route path="/employee" element={user && user.role === 'employee' ? <EmployeeDashboard /> : <Navigate to="/" />} />
        <Route path="*" element={<div style={{textAlign: 'center', marginTop: '2rem'}}>Page not found or you are not logged in.</div>} />
      </Routes>
    </Router>
  );
}

export default App;