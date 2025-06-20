import React, { useEffect, useState } from 'react';

const EmployeeDashboard = () => {
  const [timeline, setTimeline] = useState([]);
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    user = null;
  }

  useEffect(() => {
    if (!user || !user.id) return;
    fetch(`/dashboard/employee/${user.id}`)
      .then(res => res.ok ? res.json() : { timeline: [] })
      .then(data => setTimeline(data.timeline || []))
      .catch(() => setTimeline([]));
  }, [user && user.id]);

  const acknowledge = async (id) => {
    if (!user || !user.id) return;
    await fetch(`/feedback/${id}/acknowledge?employee_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Got it!' })
    });
    alert('Acknowledged');
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Not logged in.</div>;

  return (
    <div>
      <h2>Employee Feedback Timeline</h2>
      {timeline.length === 0 ? (
        <div>No feedbacks found.</div>
      ) : (
        <ul>
          {timeline.map(fb => (
            <li key={fb.id}>
              {fb.created_at ? fb.created_at.split('T')[0] : ''}: {fb.strengths} / {fb.improvements} / {fb.sentiment}
              <button onClick={() => acknowledge(fb.id)} style={{marginLeft: '1rem'}}>Acknowledge</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeeDashboard;