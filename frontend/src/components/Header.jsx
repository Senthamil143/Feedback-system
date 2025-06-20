import React from 'react';

const Header = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <header>
      <h1>Feedback Portal</h1>
      <p>Welcome, {user?.name} ({user?.role})</p>
    </header>
  );
};

export default Header;