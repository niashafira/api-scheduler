// API service for API request management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiRequestApi {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all API requests
  async getAllApiRequests() {
    return this.request('/api-requests');
  }

  // Get active API requests
  async getActiveApiRequests() {
    return this.request('/api-requests/active');
  }

  // Get API requests by source
  async getApiRequestsBySource(sourceId) {
    return this.request(`/api-requests/source/${sourceId}`);
  }

  // Get a specific API request
  async getApiRequest(id) {
    return this.request(`/api-requests/${id}`);
  }

  // Create a new API request
  async createApiRequest(data) {
    return this.request('/api-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API request
  async updateApiRequest(id, data) {
    return this.request(`/api-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API request
  async deleteApiRequest(id) {
    return this.request(`/api-requests/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API request as executed
  async markApiRequestAsExecuted(id) {
    return this.request(`/api-requests/${id}/mark-executed`, {
      method: 'POST',
    });
  }
}

export default new ApiRequestApi();
