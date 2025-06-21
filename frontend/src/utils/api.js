import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add the auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for global error handling
api.interceptors.response.use(
  response => {
    // For successful responses (2xx), just return the data
    return response.data;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Use replace to prevent user from navigating back to the broken page
        window.location.replace('/login'); 
      }
      
      // Create a new error with a more specific message from the backend if available
      const newError = new Error(
        error.response.data?.detail || `Request failed with status ${error.response.status}`
      );
      newError.detail = error.response.data?.detail;
      return Promise.reject(newError);

    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('No response from server. Please check your network connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(error);
    }
  }
);


// --- Auth ---
export const login = (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return api.post('/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const createUser = (data) => api.post('/users/', data);
export const getCurrentUser = () => api.get('/users/me/');
export const getUserByEmail = (email) => api.get(`/users/by_email/${encodeURIComponent(email)}`);


// --- Manager ---
export const getTeamMembers = (managerId) => api.get(`/manager/${managerId}/team`);
export const getAvailableEmployees = (managerId) => api.get(`/manager/${managerId}/available-employees`);
export const assignEmployeeToManager = (managerId, employeeId) => api.post(`/manager/${managerId}/assign-employee/${employeeId}`);


// --- Dashboards ---
export const getManagerDashboard = () => api.get('/dashboard/manager-stats/');
export const getEmployeeDashboard = (employeeId) => api.get(`/dashboard/employee/${employeeId}`);


// --- Feedback ---
export const submitFeedback = (feedback, request_id = null) => {
  const data = request_id ? { ...feedback, request_id } : feedback;
  return api.post('/feedback/', data);
};
export const getFeedbackForEmployee = () => api.get('/feedback/employee/');
export const getFeedbackForManager = () => api.get('/feedback/manager/');
export const getFeedbackById = (feedbackId) => api.get(`/feedback/${feedbackId}`);
export const updateFeedback = (feedbackId, feedbackData) => api.put(`/feedback/${feedbackId}`, feedbackData);


// --- Acknowledgement ---
export const acknowledgeFeedback = (feedbackId, comment) => api.post(`/feedback/${feedbackId}/acknowledge`, { comment });
export const getAcknowledgementStatus = (feedbackId, employeeId) => api.get(`/feedback/${feedbackId}/acknowledgement/${employeeId}`);


// --- Feedback Requests ---
export const getPendingRequests = () => api.get('/feedback-requests/pending/');
export const requestFeedback = (message) => api.post('/feedback-requests/', { message });
export const getFeedbackRequests = () => api.get('/feedback-requests/manager/');
export const approveRequest = (requestId) => api.post(`/feedback-requests/${requestId}/approve`);
export const denyRequest = (requestId) => api.post(`/feedback-requests/${requestId}/deny`);

// --- Tags ---
export const getTags = () => api.get('/tags/');
export const createTag = (tagData) => api.post('/tags/', tagData);

// --- Misc ---
export const addComment = (feedbackId, comment) => api.post(`/feedback/${feedbackId}/comments/`, { comment });

export const exportFeedbackToPdf = async (feedbackId) => {
  const response = await api.get(`/feedback/${feedbackId}/pdf`, {
    responseType: 'blob' // Important for handling file downloads
  });

  const url = window.URL.createObjectURL(new Blob([response]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `feedback_${feedbackId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};