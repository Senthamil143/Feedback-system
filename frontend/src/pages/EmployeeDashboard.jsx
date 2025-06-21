import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedbackForEmployee, acknowledgeFeedback, requestFeedback, exportFeedbackToPdf } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import Header from '../components/Header';

const EmployeeDashboard = ({ user, setUser }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState({});
  const [error, setError] = useState('');
  const [ackComment, setAckComment] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [activeTab, setActiveTab] = useState('feedback');
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const fetchTimeline = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    try {
      const data = await getFeedbackForEmployee(user.id);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchTimeline();
    }
  }, [user?.id]);

  const acknowledge = async (id, comment) => {
    setAcknowledging(prev => ({ ...prev, [id]: true }));
    try {
      const newAck = await acknowledgeFeedback(id, comment);
      setTimeline(prevTimeline => 
        prevTimeline.map(fb => 
          fb.id === id 
            ? { ...fb, acknowledgment: newAck }
            : fb
        )
      );
    } catch (error) {
      console.error('Error acknowledging feedback:', error);
      alert('Failed to acknowledge feedback. Please try again.');
    } finally {
      setAcknowledging(prev => ({ ...prev, [id]: false }));
    }
  };

  const isAcknowledged = (feedback) => {
    return feedback.acknowledgment && feedback.acknowledgment.acknowledged;
  };

  const handleRequestFeedback = async () => {
    try {
      await requestFeedback(requestMessage);
      setRequestStatus('Your request has been sent successfully!');
      setRequestMessage('');
      setTimeout(() => setRequestStatus(''), 5000); // Clear message after 5s
    } catch (error) {
      console.error("Failed to request feedback", error);
      setRequestStatus(`Error: ${error.detail || 'Could not send request.'}`);
    }
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Not logged in.</div>;

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9'
  };

  const feedbackCardStyle = {
    border: '1px solid #ddd',
    padding: '20px',
    marginBottom: '15px',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative'
  };

  const acknowledgedStyle = {
    border: '2px solid #28a745',
    backgroundColor: '#f8fff8'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px'
  };

  const acknowledgedButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  };

  const acknowledgmentBadgeStyle = {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const sentimentBadgeStyle = {
    padding: '6px 12px', 
    borderRadius: '20px', 
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const sentimentColors = {
    positive: '#28a745',
    neutral: '#ffc107',
    negative: '#dc3545'
  };

  const sentimentLabels = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative'
  };

  const sentimentDisplay = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative'
  };

  const tabStyles = {
    tab: {
      padding: '10px 20px',
      marginRight: '10px',
      border: '1px solid #ddd',
      backgroundColor: '#f8f9fa',
      color: '#333',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    activeTab: {
      padding: '10px 20px',
      marginRight: '10px',
      border: '1px solid #007bff',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    }
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('feedback')} style={activeTab === 'feedback' ? tabStyles.activeTab : tabStyles.tab}>My Feedback</button>
          <button onClick={() => setActiveTab('request')} style={activeTab === 'request' ? tabStyles.activeTab : tabStyles.tab}>Request Feedback</button>
        </div>

        {activeTab === 'feedback' && (
          <div style={containerStyle}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
            ) : (
              <div style={cardStyle}>
      {timeline.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h3>No feedback received yet</h3>
                    <p>Your manager will provide feedback here when available.</p>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ marginTop: 0, color: '#333', marginBottom: '20px' }}>
                      Your Feedback History ({timeline.length} feedback{timeline.length !== 1 ? 's' : ''})
                    </h2>
                    {timeline.map(fb => {
                      const acknowledged = isAcknowledged(fb);
                      const ackInfo = fb.acknowledgment;
                      
                      return (
                        <div key={fb.id} style={{
                          ...feedbackCardStyle,
                          ...(acknowledged ? acknowledgedStyle : {})
                        }}>
                          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {acknowledged && (
                              <div style={{...acknowledgmentBadgeStyle, position: 'static' }}>
                                ✓ Acknowledged
                              </div>
                            )}
                             <span style={{ 
                                ...sentimentBadgeStyle,
                                backgroundColor: sentimentColors[fb.sentiment],
                              }}>
                                {sentimentLabels[fb.sentiment]}
                              </span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '15px',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}>
                            <div>
                              <strong>Date:</strong> {new Date(fb.created_at + 'Z').toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}
                              {fb.updated_at && fb.created_at !== fb.updated_at && (
                                <div style={{ 
                                  marginTop: '5px', 
                                  fontSize: '12px', 
                                  color: '#17a2b8',
                                  fontWeight: 'bold'
                                }}>
                                  <small>
                                    (Updated: {new Date(fb.updated_at + 'Z').toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: 'Asia/Kolkata'
                                    }) + ' IST'})
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '15px', paddingTop: '20px' }}>
                            <h4 style={{ color: '#28a745', margin: '0 0 8px 0' }}>Strengths</h4>
                            <div style={{ paddingLeft: '15px' }}><ReactMarkdown>{fb.strengths}</ReactMarkdown></div>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ color: '#dc3545', margin: '0 0 8px 0' }}>Areas to Improve</h4>
                            <div style={{ paddingLeft: '15px' }}><ReactMarkdown>{fb.improvements}</ReactMarkdown></div>
                          </div>

                          {fb.tags && fb.tags.length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                  <strong>Tags:</strong>
                                  {fb.tags.map(tag => (
                                      <span key={tag.id} style={{
                                          backgroundColor: '#e0e0e0',
                                          color: '#333',
                                          borderRadius: '12px',
                                          padding: '3px 8px',
                                          margin: '0 5px',
                                          fontSize: '12px'
                                      }}>{tag.name}</span>
                                  ))}
                              </div>
                          )}
                          
                          {!acknowledged ? (
                            <div style={{ marginTop: '20px' }}>
                              <textarea
                                placeholder="Add an optional comment..."
                                onChange={(e) => setAckComment(e.target.value)}
                                style={{ width: '100%', minHeight: '60px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}
                              />
                              <button 
                                onClick={() => acknowledge(fb.id, ackComment)}
                                disabled={acknowledging[fb.id]}
                                style={buttonStyle}
                              >
                                {acknowledging[fb.id] ? 'Acknowledging...' : 'Acknowledge Feedback'}
                              </button>
                            </div>
                          ) : (
                            <div style={{ 
                              marginTop: '20px', 
                              padding: '10px', 
                              backgroundColor: '#e8f5e8', 
                              borderRadius: '4px',
                              border: '1px solid #c8e6c9'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
                                You acknowledged this on {ackInfo && new Date(ackInfo.acknowledged_at + 'Z').toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}.
                              </p>
                              {ackInfo && ackInfo.comment && (
                                <p style={{ margin: '8px 0 0', fontStyle: 'italic', color: '#555' }}>
                                  Your comment: "{ackInfo.comment}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'request' && (
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '40px',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{ marginTop: 0 }}>Request Feedback</h2>
            <p>You can proactively ask your manager for feedback here.</p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Optional: Add a message to your manager (e.g., 'I'd love feedback on my presentation skills.')"
              style={{ width: '100%', minHeight: '80px', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <button onClick={handleRequestFeedback} style={{ padding: '10px 20px' }}>Send Request</button>
            {requestStatus && <p style={{ marginTop: '10px', color: requestStatus.startsWith('Error') ? 'red' : 'green' }}>{requestStatus}</p>}
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default EmployeeDashboard;