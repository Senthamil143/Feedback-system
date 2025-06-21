import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(config => {
  console.log('API file loaded successfully');

  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

async function handleResponse(response) {
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    try {
      const errorData = await response.json();
      error.detail = errorData.detail;
    } catch (e) {
      // If we can't parse the error response, that's okay
    }
    throw error;
  }
  return response.json();
}

export async function login(email, password) {
  console.log('Login function called with:', email);
  const response = await api.post('/token', {
    username: email,
    password: password,
  });
  return handleResponse(response);
}

export async function createUser(data) {
  const response = await api.post('/users/', data);
  return handleResponse(response);
}

export async function getUserByEmail(email) {
  const response = await api.get('/users/by_email/' + encodeURIComponent(email));
  return handleResponse(response);
}

export async function submitFeedback(feedback, request_id = null) {
  return api.post('/feedback/', feedback);
}

export async function getFeedbackForEmployee() {
  return api.get('/feedback/employee/');
}

export async function getFeedbackForManager() {
  return api.get('/feedback/manager/');
}

export async function getFeedbackById(feedbackId) {
  return api.get('/feedback/' + feedbackId);
}

export async function updateFeedback(feedbackId, feedbackData) {
  return api.put('/feedback/' + feedbackId, feedbackData);
}

export async function acknowledgeFeedback(feedbackId, comment) {
  return api.post('/feedback/' + feedbackId + '/acknowledge', { comment });
}

export async function getAcknowledgementStatus(feedbackId, employeeId) {
  return api.get('/feedback/' + feedbackId + '/acknowledgement/' + employeeId);
}

export async function getTeamMembers(managerId) {
  return api.get('/manager/' + managerId + '/team');
}

export async function getAvailableEmployees(managerId) {
  return api.get('/manager/' + managerId + '/available-employees');
}

export async function assignEmployeeToManager(managerId, employeeId) {
  return api.post('/manager/' + managerId + '/assign-employee/' + employeeId);
}

export async function getManagerDashboard(managerId) {
  return api.get('/dashboard/manager-stats/');
}

export async function getEmployeeDashboard(employeeId) {
  return api.get('/dashboard/employee/' + employeeId);
}

export async function getPendingRequests() {
  return api.get('/feedback-requests/pending/');
}

export async function createFeedback(feedbackData) {
  return api.post('/feedback/', feedbackData);
}

export async function addComment(feedbackId, comment) {
  return api.post('/feedback/' + feedbackId + '/comments/', { comment });
}

export async function createTag(tagData) {
  return api.post('/tags/', tagData);
}

export async function approveRequest(requestId) {
  return api.post('/feedback-requests/' + requestId + '/approve');
}

export async function denyRequest(requestId) {
  return api.post('/feedback-requests/' + requestId + '/deny');
}

export async function getTags() {
  return api.get('/tags/');
}

export async function requestFeedback(message) {
  return api.post('/feedback-requests/', { message });
}

export async function getFeedbackRequests() {
  return api.get('/feedback-requests/manager/');
}

export async function getCurrentUser() {
  return api.get('/users/me/');
}

export async function exportFeedbackToPdf(feedbackId) {
  const response = await api.get('/feedback/' + feedbackId + '/pdf', {
    responseType: 'blob'
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'feedback_' + feedbackId + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}