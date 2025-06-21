console.log('API file loaded successfully');

export const API_BASE_URL = "http://localhost:8000"; // Point to backend server

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
  const response = await fetch(`${API_BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  });
  return handleResponse(response);
}

export async function createUser(data) {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getUserByEmail(email) {
  const response = await fetch(`${API_BASE_URL}/users/by_email/${encodeURIComponent(email)}`);
  return handleResponse(response);
}

export async function submitFeedback(feedback, request_id = null) {
  const response = await fetch(`${API_BASE_URL}/feedback/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });
  return handleResponse(response);
}

export async function getFeedbackForEmployee() {
  const response = await fetch(`${API_BASE_URL}/feedback/employee/`);
  return handleResponse(response);
}

export async function getFeedbackByManager(managerId) {
  const response = await fetch(`${API_BASE_URL}/feedback/manager/${managerId}`);
  return handleResponse(response);
}

export async function getFeedbackById(feedbackId) {
  const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`);
  return handleResponse(response);
}

export async function updateFeedback(feedbackId, feedbackData, managerId) {
  const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}?manager_id=${managerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedbackData),
  });
  return handleResponse(response);
}

export async function acknowledgeFeedback(feedbackId, employeeId, comment) {
  const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/acknowledge?employee_id=${employeeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return handleResponse(response);
}

export async function getAcknowledgementStatus(feedbackId, employeeId) {
  const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/acknowledgement/${employeeId}`);
  return handleResponse(response);
}

export async function getTeamMembers(managerId) {
  const response = await fetch(`${API_BASE_URL}/manager/${managerId}/team`);
  return handleResponse(response);
}

export async function getAvailableEmployees(managerId) {
  const response = await fetch(`${API_BASE_URL}/manager/${managerId}/available-employees`);
  return handleResponse(response);
}

export async function assignEmployeeToManager(managerId, employeeId) {
  const response = await fetch(`${API_BASE_URL}/manager/${managerId}/assign-employee/${employeeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}

export async function getManagerDashboard(managerId) {
  return makeAuthenticatedRequest('/dashboard/manager-stats/');
}

export async function getEmployeeDashboard(employeeId) {
  const response = await fetch(`${API_BASE_URL}/feedback/employee/${employeeId}`);
  return handleResponse(response);
}

export async function getFeedbackForManager() {
    return makeAuthenticatedRequest('/feedback/manager/');
}

export async function getPendingRequests() {
    return makeAuthenticatedRequest('/feedback-requests/pending/');
}

export async function createFeedback(feedbackData) {
    return makeAuthenticatedRequest('/feedback/', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
    });
}

export async function addComment(feedbackId, comment) {
    return makeAuthenticatedRequest(`/feedback/${feedbackId}/comments/`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
    });
}

export async function createTag(tagData) {
    return makeAuthenticatedRequest('/tags/', {
        method: 'POST',
        body: JSON.stringify(tagData),
    });
}

export async function approveRequest(requestId) {
    return makeAuthenticatedRequest(`/feedback-requests/${requestId}/approve`, {
        method: 'POST',
    });
}

export async function denyRequest(requestId) {
    return makeAuthenticatedRequest(`/feedback-requests/${requestId}/deny`, {
        method: 'POST',
    });
}

export async function getTags() {
    return makeAuthenticatedRequest('/tags/');
}

export async function requestFeedback(message) {
    return makeAuthenticatedRequest('/feedback-requests/', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function getFeedbackRequests() {
    return makeAuthenticatedRequest('/feedback-requests/manager/');
}

export async function getCurrentUser() {
    return makeAuthenticatedRequest('/users/me/');
}

export async function exportFeedbackToPdf(feedbackId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/pdf`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_${feedbackId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        try {
            const errorData = await response.json();
            error.detail = errorData.detail;
        } catch (e) {
            // ignore
        }
        throw error;
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    return response.json();
}