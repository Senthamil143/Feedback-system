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
    fetchTimeline();
  }, [user && user.id]);

  const acknowledge = async (id) => {
    if (!user || !user.id) return;
    setAcknowledging(prev => ({ ...prev, [id]: true }));
    
    try {
      await acknowledgeFeedback(id, user.id, 'Got it!');
      alert('Feedback acknowledged successfully!');
      fetchTimeline(); // Refresh timeline
    } catch (error) {
      console.error('Error acknowledging feedback:', error);
      alert('Failed to acknowledge feedback. Please try again.');
    } finally {
      setAcknowledging(prev => ({ ...prev, [id]: false }));
    }
  };

  const isAcknowledged = (feedback) => {
    if (!feedback.acknowledgements || feedback.acknowledgements.length === 0) {
      return false;
    }
    // Check if current user has acknowledged this feedback
    return feedback.acknowledgements.some(ack => ack.employee_id === user?.id && ack.acknowledged);
  };

  const getAcknowledgmentInfo = (feedback) => {
    if (!feedback.acknowledgements || feedback.acknowledgements.length === 0) {
      return null;
    }
    return feedback.acknowledgements.find(ack => ack.employee_id === user?.id);
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
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
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
                      const ackInfo = getAcknowledgmentInfo(fb);
                      
                      return (
                        <div key={fb.id} style={{
                          ...feedbackCardStyle,
                          ...(acknowledged ? acknowledgedStyle : {})
                        }}>
                          {acknowledged && (
                            <div style={acknowledgmentBadgeStyle}>
                              ✓ Acknowledged
                            </div>
                          )}
                          
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
                            <span style={{ 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              backgroundColor: sentimentColors[fb.sentiment],
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {sentimentLabels[fb.sentiment]}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
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
                          
                          {acknowledged && ackInfo && (
                            <div style={{ 
                              marginBottom: '15px', 
                              padding: '10px', 
                              backgroundColor: '#e8f5e8', 
                              borderRadius: '4px',
                              border: '1px solid #28a745'
                            }}>
                              <strong>Acknowledged on:</strong> {ackInfo.acknowledged_at ? 
                                new Date(ackInfo.acknowledged_at + 'Z').toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Kolkata'
                                }) + ' IST' : 'Unknown date'}
                              {ackInfo.comment && (
                                <div style={{ marginTop: '5px' }}>
                                  <strong>Comment:</strong>
                                  <div style={{ paddingLeft: '15px' }}><ReactMarkdown>{ackInfo.comment}</ReactMarkdown></div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div style={{ marginTop: '20px' }}>
                              <button 
                                  onClick={() => exportFeedbackToPdf(fb.id)}
                                  style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                  Export to PDF
                              </button>
                          </div>
                          
                          <button 
                            onClick={() => acknowledge(fb.id)}
                            disabled={acknowledging[fb.id] || acknowledged}
                            style={{
                              ...(acknowledged ? acknowledgedButtonStyle : buttonStyle),
                              opacity: acknowledging[fb.id] ? 0.7 : 1,
                              cursor: (acknowledging[fb.id] || acknowledged) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {acknowledging[fb.id] ? 'Acknowledging...' : 
                             acknowledged ? 'Already Acknowledged' : 'Acknowledge Feedback'}
                          </button>
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