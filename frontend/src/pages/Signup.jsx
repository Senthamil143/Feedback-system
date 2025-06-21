import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../utils/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      };
      
      const newUser = await createUser(userData);
      alert(`Account created successfully! Welcome ${newUser.name}. Please login to continue.`);
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.detail && error.detail.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Please login instead.' });
      } else {
        alert('Signup failed: ' + (error.detail || error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: '450px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  };

  const labelStyle = {
    fontWeight: '500',
    color: '#555',
    fontSize: '14px'
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '16px',
    transition: 'border-color 0.3s ease'
  };

  const errorInputStyle = {
    ...inputStyle,
    border: '1px solid #dc3545'
  };

  const errorTextStyle = {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '2px'
  };

  const selectStyle = {
    ...inputStyle,
    backgroundColor: 'white'
  };

  const buttonStyle = {
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'background-color 0.3s ease'
  };

  const linkStyle = {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '14px'
  };

  const linkTextStyle = {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Create Account</h2>
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Full Name</label>
          <input 
            type="text"
            name="name"
            placeholder="Enter your full name" 
            value={formData.name} 
            onChange={handleInputChange}
            style={errors.name ? errorInputStyle : inputStyle}
          />
          {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Email Address</label>
          <input 
            type="email"
            name="email"
            placeholder="Enter your email address" 
            value={formData.email} 
            onChange={handleInputChange}
            style={errors.email ? errorInputStyle : inputStyle}
          />
          {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password</label>
          <input 
            type="password"
            name="password"
            placeholder="Enter a secure password" 
            value={formData.password} 
            onChange={handleInputChange}
            style={errors.password ? errorInputStyle : inputStyle}
          />
          {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Role</label>
          <select 
            name="role"
            value={formData.role} 
            onChange={handleInputChange}
            style={selectStyle}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <small style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
            {formData.role === 'employee' 
              ? 'Employees can receive feedback and acknowledge it.' 
              : 'Managers can create teams, submit feedback, and view analytics.'}
          </small>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={linkStyle}>
        Already have an account?{' '}
        <Link to="/login" style={linkTextStyle}>
          Login here
        </Link>
      </div>
    </div>
  );
};

export default Signup; 