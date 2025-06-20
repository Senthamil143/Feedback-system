import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('manager');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Try to fetch user by email
    const userRes = await fetch(`http://localhost:8000/users/by_email/${encodeURIComponent(email)}`);
    if (userRes.ok) {
      const user = await userRes.json();
      if (user.role !== role) {
        alert('Email already registered with a different role.');
        return;
      }
      localStorage.setItem('user', JSON.stringify(user));
      role === 'manager' ? navigate('/manager') : navigate('/employee');
      return;
    }
    // Only register if GET returns 404
    if (userRes.status === 404) {
      const payload = { name, email, role };
      const response = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Login failed');
        return;
      }
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      role === 'manager' ? navigate('/manager') : navigate('/employee');
      return;
    }
    // Any other error
    alert('Login failed');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="manager">Manager</option>
        <option value="employee">Employee</option>
      </select>
      <button type="submit">Enter</button>
    </form>
  );
};

export default Login;