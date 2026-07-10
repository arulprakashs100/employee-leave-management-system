/* Global API configuration for backend integration: api.js */

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Standardized fetch utility function for all backend requests.
 * @param {string} endpoint - API route (e.g. '/auth/login')
 * @param {string} method - HTTP method ('GET', 'POST', etc.)
 * @param {object} data - JSON payload (optional)
 * @returns {Promise<object>}
 */
async function apiFetch(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, ...result };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Server connection failed. Is the Spring Boot backend running?' };
  }
}
