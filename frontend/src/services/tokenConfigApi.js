// API service for token configuration management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class TokenConfigApi {
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

  // Get all token configurations
  async getAllTokenConfigs() {
    return this.request('/token-configs');
  }

  // Get active token configurations
  async getActiveTokenConfigs() {
    return this.request('/token-configs/active');
  }

  // Get a specific token configuration
  async getTokenConfig(id) {
    return this.request(`/token-configs/${id}`);
  }

  // Create a new token configuration
  async createTokenConfig(data) {
    return this.request('/token-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update a token configuration
  async updateTokenConfig(id, data) {
    return this.request(`/token-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a token configuration
  async deleteTokenConfig(id) {
    return this.request(`/token-configs/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark token configuration as used
  async markTokenConfigAsUsed(id) {
    return this.request(`/token-configs/${id}/mark-used`, {
      method: 'POST',
    });
  }
}

export default new TokenConfigApi();
