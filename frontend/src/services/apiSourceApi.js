// API service for API source management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiSourceApi {
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

  // Get all API sources
  async getAllApiSources() {
    return this.request('/api-sources');
  }

  // Get active API sources
  async getActiveApiSources() {
    return this.request('/api-sources/active');
  }

  // Get a specific API source
  async getApiSource(id) {
    return this.request(`/api-sources/${id}`);
  }

  // Create a new API source
  async createApiSource(data) {
    return this.request('/api-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API source
  async updateApiSource(id, data) {
    return this.request(`/api-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API source
  async deleteApiSource(id) {
    return this.request(`/api-sources/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API source as used
  async markApiSourceAsUsed(id) {
    return this.request(`/api-sources/${id}/mark-used`, {
      method: 'POST',
    });
  }
}

export default new ApiSourceApi();
