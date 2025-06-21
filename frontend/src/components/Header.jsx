import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px', 
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Feedback Portal</h1>
        <p style={{ margin: 0, color: '#6c757d' }}>Welcome, {user?.name} ({user?.role})</p>
      </div>
      <button onClick={onLogout} style={{
        padding: '8px 16px',
        fontSize: '14px',
        color: '#fff',
        backgroundColor: '#dc3545',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        Logout
      </button>
    </header>
  );
};

export default Header;