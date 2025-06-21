import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTeamMembers, 
  getAvailableEmployees, 
  assignEmployeeToManager, 
  submitFeedback, 
  getManagerDashboard, 
  updateFeedback, 
  getTags, 
  getFeedbackRequests, 
  getFeedbackForManager, 
  getPendingRequests, 
  createFeedback, 
  addComment, 
  createTag, 
  exportFeedbackToPdf, 
  approveRequest, 
  denyRequest 
} from '../utils/api';
import ReactMarkdown from 'react-markdown';
import Header from '../components/Header';

const ManagerDashboard = ({ user, setUser }) => {
  const [team, setTeam] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [dashboard, setDashboard] = useState({ feedback_count: 0, sentiment_trends: {} });
  const [form, setForm] = useState({ employee_id: '', strengths: '', improvements: '', sentiment: 'positive', request_id: null });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  
  // Edit feedback state
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editForm, setEditForm] = useState({ strengths: '', improvements: '', sentiment: 'positive' });
  const [updating, setUpdating] = useState(false);
  
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const [editingStrengths, setEditingStrengths] = useState('');
  const [editingImprovements, setEditingImprovements] = useState('');
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  
  const [activeTab, setActiveTab] = useState('feedback');
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    if (!user || !user.id) return;
    setLoading(true);
    try {
      const [teamData, availableData, feedbackData, dashboardData, requestsData] = await Promise.all([
        getTeamMembers(user.id),
        getAvailableEmployees(user.id),
        getFeedbackForManager(user.id),
        getManagerDashboard(user.id),
        getFeedbackRequests()
      ]);
      setTeam(teamData);
      setAvailableEmployees(availableData);
      setFeedbacks(feedbackData);
      setDashboard(dashboardData);
      setFeedbackRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTags = async () => {
    try {
      const tagsData = await getTags();
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTags();
  }, [fetchData]);

  const handleRefreshAvailable = async () => {
    await fetchAvailableEmployees();
    alert("Refreshed available employee list.");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    setSubmitting(true);
    
    try {
      const feedbackData = {
        strengths: form.strengths,
        improvements: form.improvements,
        sentiment: form.sentiment,
        employee_id: form.employee_id,
        tag_ids: selectedTags,
      };
      
      const url = form.request_id ? `/feedback/?request_id=${form.request_id}` : '/feedback/';

      await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });

      alert('Feedback submitted successfully!');
      setForm({ employee_id: '', strengths: '', improvements: '', sentiment: 'positive', request_id: null });
      setSelectedTags([]);
      fetchData(); // Refresh all dashboard data
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    if (!user || !user.id) return;
    
    try {
      await assignEmployeeToManager(user.id, employeeId);
      alert('Employee assigned successfully!');
      
      // Manually update the state to reflect the change immediately
      const assignedEmployee = availableEmployees.find(emp => emp.id === employeeId);
      if (assignedEmployee) {
        setTeam([...team, assignedEmployee]);
        setAvailableEmployees(availableEmployees.filter(emp => emp.id !== employeeId));
      }
      
    } catch (error) {
      alert('Failed to assign employee. Please try again.');
    }
  };

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback.id);
    setEditForm({
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      sentiment: feedback.sentiment
    });
  };

  const handleSaveEdit = async () => {
    if (!user || !user.id || !editingFeedback) return;
    setUpdating(true);
    
    try {
      await updateFeedback(editingFeedback, editForm, user.id);
      alert('Feedback updated successfully!');
      setEditingFeedback(null);
      setEditForm({ strengths: '', improvements: '', sentiment: 'positive' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setEditForm({ strengths: '', improvements: '', sentiment: 'positive' });
  };

  const handleRespondToRequest = (request) => {
    setForm(prevForm => ({ ...prevForm, employee_id: request.employee.id, request_id: request.id }));
    setActiveTab('feedback');
    // Optional: scroll to the feedback form
    setTimeout(() => {
      document.getElementById('submit-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Not logged in.</div>;

  const containerStyle = {
    maxWidth: '1200px',
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

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px'
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: submitting ? 0.7 : 1
  };

  const sentimentColors = {
    positive: '#28a745',
    neutral: '#ffc107',
    negative: '#dc3545'
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
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button onClick={() => setActiveTab('feedback')} style={activeTab === 'feedback' ? tabStyles.activeTab : tabStyles.tab}>All Feedback</button>
            <button onClick={() => setActiveTab('requests')} style={activeTab === 'requests' ? tabStyles.activeTab : tabStyles.tab}>Pending Requests</button>
          </div>
          <button onClick={fetchData} style={{ ...buttonStyle, backgroundColor: '#17a2b8' }}>
            Refresh Dashboard
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          <>
            {activeTab === 'feedback' && (
              <>
                {/* Dashboard Overview */}
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: '#333' }}>Dashboard Overview</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                      <strong>Total Feedback Count:</strong> {dashboard.feedback_count}
                    </div>
                    <div>
                      <strong>Team Size:</strong> {team.length} employee{team.length !== 1 ? 's' : ''}
                    </div>
                    <div>
                      <strong>Acknowledged:</strong> {dashboard.acknowledged_count || 0} / {dashboard.feedback_count}
                      <br />
                      <small style={{ color: '#28a745' }}>
                        {dashboard.acknowledgment_rate || 0}% acknowledgment rate
                      </small>
                    </div>
                    <div>
                      <strong>Pending Acknowledgment:</strong> {dashboard.pending_acknowledgment || 0}
                      <br />
                      <small style={{ color: '#ffc107' }}>
                        {dashboard.pending_acknowledgment > 0 ? 'Requires attention' : 'All acknowledged'}
                      </small>
                    </div>
                    <div>
            <strong>Sentiment Trends:</strong>
                      <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              {dashboard.sentiment_trends && Object.entries(dashboard.sentiment_trends).map(([sentiment, count]) => (
                          <li key={sentiment} style={{ color: sentimentColors[sentiment] }}>
                            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: {count}
                          </li>
              ))}
            </ul>
          </div>
                  </div>
                </div>

                {/* Team Management */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ marginTop: 0, color: '#333' }}>Team Management</h2>
                    <button 
                      onClick={() => setShowTeamManagement(!showTeamManagement)}
                      style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
                    >
                      {showTeamManagement ? 'Hide' : 'Show'} Team Management
                    </button>
                  </div>
                  
                  {showTeamManagement && (
                    <div>
                      {/* Current Team Members */}
                      <div style={{ marginBottom: '20px' }}>
                        <h3>Current Team Members ({team.length})</h3>
                        {team.length === 0 ? (
                          <p>No team members assigned yet.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0 }}>
            {team.map(member => (
                              <li key={member.id} style={{ 
                                padding: '10px', 
                                border: '1px solid #ddd', 
                                marginBottom: '10px', 
                                borderRadius: '4px',
                                backgroundColor: 'white'
                              }}>
                                <strong>{member.name}</strong> ({member.email})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Available Employees */}
                      <div>
                        <h3>Available Employees ({availableEmployees.length})</h3>
                        {availableEmployees.length === 0 ? (
                          <p>No available employees to assign.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {availableEmployees.map(member => (
                              <li key={member.id} style={{ 
                                padding: '10px', 
                                border: '1px solid #ddd', 
                                marginBottom: '10px', 
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <strong>{member.name}</strong> ({member.email})
                                </div>
                                <button 
                                  onClick={() => handleAssignEmployee(member.id)}
                                  style={{ ...buttonStyle, padding: '8px 12px', fontSize: '12px' }}
                                >
                                  Assign to Team
                                </button>
                              </li>
            ))}
          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Feedback */}
                <div id="submit-feedback-section" style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: '#333' }}>Submit Feedback</h2>
                  <form onSubmit={handleSubmit} style={formStyle}>
                    <select 
                      value={form.employee_id} 
                      onChange={e => setForm({ ...form, employee_id: e.target.value })} 
                      required
                      style={inputStyle}
                    >
              <option value="">Select Employee</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
                    <textarea 
                      placeholder="Strengths" 
                      value={form.strengths} 
                      onChange={e => setForm({ ...form, strengths: e.target.value })} 
                      required
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    />
                    <textarea 
                      placeholder="Areas to Improve" 
                      value={form.improvements} 
                      onChange={e => setForm({ ...form, improvements: e.target.value })} 
                      required
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    />
                    <select 
                      value={form.sentiment} 
                      onChange={e => setForm({ ...form, sentiment: e.target.value })}
                      style={inputStyle}
                    >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
                    <div style={{ marginBottom: '15px' }}>
                      <label>Tags</label>
                      <select 
                        multiple 
                        value={selectedTags} 
                        onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                        style={{ width: '100%', minHeight: '100px', padding: '8px' }}
                      >
                        {tags.map(tag => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      style={buttonStyle}
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
          </form>
                </div>

                {/* Submitted Feedbacks */}
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: '#333' }}>Submitted Feedbacks</h2>
          {feedbacks.length === 0 ? (
                    <p>No feedbacks submitted yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {feedbacks.map(fb => {
                        const hasAcknowledgement = fb.acknowledgment && fb.acknowledgment.acknowledged;
                        const isEditing = editingFeedback === fb.id;
                        
                        return (
                          <div key={fb.id} style={{ 
                            border: hasAcknowledgement ? '2px solid #28a745' : '1px solid #ddd', 
                            padding: '15px', 
                            borderRadius: '4px',
                            backgroundColor: hasAcknowledgement ? '#f8fff8' : 'white',
                            position: 'relative'
                          }}>
                            {hasAcknowledgement && (
                              <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                ✓ Acknowledged
                              </div>
                            )}
                            
                            <div style={{ marginBottom: '10px' }}>
                              <strong>Employee:</strong> {fb.employee?.name || 'Unknown Employee'}
                              <br />
                              <strong>Date:</strong> {new Date(fb.created_at + 'Z').toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Kolkata'
                              }) + ' IST'}
                              {fb.updated_at !== fb.created_at && (
                                <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                  (Updated: {new Date(fb.updated_at + 'Z').toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Kolkata'
                                  }) + ' IST'})
                                </span>
                              )}
                              <span style={{ 
                                marginLeft: '10px', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                backgroundColor: sentimentColors[fb.sentiment],
                                color: 'white',
                                fontSize: '12px'
                              }}>
                                {fb.sentiment}
                              </span>
                            </div>
                            
                            {isEditing ? (
                              // Edit form
                              <div style={{ marginBottom: '15px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Strengths:
                                  </label>
                                  <textarea 
                                    value={editForm.strengths} 
                                    onChange={e => setEditForm({ ...editForm, strengths: e.target.value })} 
                                    required
                                    style={{ 
                                      width: '100%', 
                                      padding: '8px', 
                                      borderRadius: '4px', 
                                      border: '1px solid #ddd',
                                      minHeight: '60px',
                                      resize: 'vertical'
                                    }}
                                  />
                                </div>
                                
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Areas to Improve:
                                  </label>
                                  <textarea 
                                    value={editForm.improvements} 
                                    onChange={e => setEditForm({ ...editForm, improvements: e.target.value })} 
                                    required
                                    style={{ 
                                      width: '100%', 
                                      padding: '8px', 
                                      borderRadius: '4px', 
                                      border: '1px solid #ddd',
                                      minHeight: '60px',
                                      resize: 'vertical'
                                    }}
                                  />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Sentiment:
                                  </label>
                                  <select 
                                    value={editForm.sentiment} 
                                    onChange={e => setEditForm({ ...editForm, sentiment: e.target.value })}
                                    style={{ 
                                      padding: '8px', 
                                      borderRadius: '4px', 
                                      border: '1px solid #ddd',
                                      width: '200px'
                                    }}
                                  >
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                  </select>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button 
                                    onClick={handleSaveEdit}
                                    disabled={updating}
                                    style={{ 
                                      ...buttonStyle, 
                                      backgroundColor: '#28a745',
                                      padding: '8px 16px',
                                      fontSize: '12px',
                                      opacity: updating ? 0.7 : 1
                                    }}
                                  >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit}
                                    disabled={updating}
                                    style={{ 
                                      ...buttonStyle, 
                                      backgroundColor: '#6c757d',
                                      padding: '8px 16px',
                                      fontSize: '12px',
                                      opacity: updating ? 0.7 : 1
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display mode
                              <>
                                <div style={{ marginBottom: '8px' }}>
                                  <strong>Strengths:</strong> <ReactMarkdown>{fb.strengths}</ReactMarkdown>
                                </div>
                                
                                <div style={{ marginBottom: '10px' }}>
                                  <strong>Areas to Improve:</strong> <ReactMarkdown>{fb.improvements}</ReactMarkdown>
                                </div>
                                
                                {fb.tags && fb.tags.length > 0 && (
                                  <div style={{ marginTop: '15px', marginBottom: '15px' }}>
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
                                
                                <button 
                                  onClick={() => handleEditFeedback(fb)}
                                  style={{ 
                                    ...buttonStyle, 
                                    backgroundColor: '#17a2b8',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    marginBottom: '10px'
                                  }}
                                >
                                  Edit Feedback
                                </button>
                              </>
                            )}
                            
                            {hasAcknowledgement && (
                              <div style={{ 
                                marginTop: '10px', 
                                padding: '10px', 
                                backgroundColor: '#e8f5e8', 
                                borderRadius: '4px',
                                border: '1px solid #28a745'
                              }}>
                                <strong>Acknowledged on:</strong> {new Date(fb.acknowledgment.acknowledged_at + 'Z').toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Kolkata'
                                }) + ' IST'}
                                {fb.acknowledgment.comment && (
                                  <div style={{ marginTop: '5px' }}>
                                    <strong>Comment:</strong> <ReactMarkdown>{fb.acknowledgment.comment}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!hasAcknowledgement && (
                              <div style={{ 
                                marginTop: '10px', 
                                padding: '8px', 
                                backgroundColor: '#fff3cd', 
                                borderRadius: '4px',
                                border: '1px solid #ffeaa7',
                                color: '#856404'
                              }}>
                                <strong>Status:</strong> Pending acknowledgment from employee
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Pending Feedback Requests */}
            {activeTab === 'requests' && (
              <div style={cardStyle}>
                {feedbackRequests.length > 0 ? (
                  <div>
                      <h2 style={{ marginTop: 0 }}>Pending Feedback Requests</h2>
                      {feedbackRequests.map(req => (
                          <div key={req.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                              <div><strong>From:</strong> {req.employee.email}</div>
                              {req.message && <div style={{ margin: '8px 0', fontStyle: 'italic' }}>"{req.message}"</div>}
                              <button 
                                  onClick={() => handleRespondToRequest(req)}
                                  style={{ ...buttonStyle, marginTop: '10px' }}
                              >
                                  Give Feedback
                              </button>
                          </div>
                      ))}
                  </div>
                ) : (
                  <p>No pending feedback requests.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
