import React, { useEffect, useState } from 'react';

const ManagerDashboard = () => {
  const [team, setTeam] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [dashboard, setDashboard] = useState({ feedback_count: 0, sentiment_trends: {} });
  const [form, setForm] = useState({ employee_id: '', strengths: '', improvements: '', sentiment: 'positive' });
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    user = null;
  }

  useEffect(() => {
    if (!user || !user.id) return;
    // Fetch team members
    fetch(`/manager/${user.id}/team`)
      .then(res => res.ok ? res.json() : [])
      .then(setTeam)
      .catch(() => setTeam([]));
    // Fetch feedbacks
    fetch(`/feedback/manager/${user.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(setFeedbacks)
      .catch(() => setFeedbacks([]));
    // Fetch dashboard data
    fetch(`/dashboard/manager/${user.id}`)
      .then(res => res.ok ? res.json() : { feedback_count: 0, sentiment_trends: {} })
      .then(setDashboard)
      .catch(() => setDashboard({ feedback_count: 0, sentiment_trends: {} }));
  }, [user && user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    await fetch('/feedback/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, manager_id: user.id })
    });
    alert('Feedback submitted');
    setForm({ employee_id: '', strengths: '', improvements: '', sentiment: 'positive' });
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Not logged in.</div>;

  return (
    <div>
      <h2>Manager Dashboard</h2>
      <div style={{marginBottom: '1rem'}}>
        <strong>Feedback Count:</strong> {dashboard.feedback_count} <br />
        <strong>Sentiment Trends:</strong>
        <ul>
          {dashboard.sentiment_trends && Object.entries(dashboard.sentiment_trends).map(([sentiment, count]) => (
            <li key={sentiment}>{sentiment}: {count}</li>
          ))}
        </ul>
      </div>
      <h3>Team Members</h3>
      <ul>
        {team.map(member => (
          <li key={member.id}>{member.name} ({member.email})</li>
        ))}
      </ul>
      <h3>Submit Feedback</h3>
      <form onSubmit={handleSubmit}>
        <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
          <option value="">Select Employee</option>
          {team.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <input placeholder="Strengths" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} required />
        <input placeholder="Improvements" value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} required />
        <select value={form.sentiment} onChange={e => setForm({ ...form, sentiment: e.target.value })}>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <button type="submit">Submit Feedback</button>
      </form>
      <h3>Submitted Feedbacks</h3>
      {feedbacks.length === 0 ? (
        <div>No feedbacks found.</div>
      ) : (
        <ul>
          {feedbacks.map(fb => (
            <li key={fb.id}>{fb.strengths} / {fb.improvements} / {fb.sentiment}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManagerDashboard;
