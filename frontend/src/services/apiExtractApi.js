// API service for API extract management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiExtractApi {
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

  // Get all API extracts
  async getAllApiExtracts() {
    return this.request('/api-extracts');
  }

  // Get active API extracts
  async getActiveApiExtracts() {
    return this.request('/api-extracts/active');
  }

  // Get API extracts by request
  async getApiExtractsByRequest(requestId) {
    return this.request(`/api-extracts/request/${requestId}`);
  }

  // Get a specific API extract
  async getApiExtract(id) {
    return this.request(`/api-extracts/${id}`);
  }

  // Create a new API extract
  async createApiExtract(data) {
    return this.request('/api-extracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API extract
  async updateApiExtract(id, data) {
    return this.request(`/api-extracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API extract
  async deleteApiExtract(id) {
    return this.request(`/api-extracts/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API extract as executed
  async markApiExtractAsExecuted(id) {
    return this.request(`/api-extracts/${id}/mark-executed`, {
      method: 'POST',
    });
  }

  // Test extraction with live API data
  async testExtraction(id) {
    return this.request(`/api-extracts/${id}/test`, {
      method: 'POST',
    });
  }

  // Test extraction with custom data
  async testExtractionWithData(extractionPaths, rootArrayPath, data) {
    return this.request('/api-extracts/test-with-data', {
      method: 'POST',
      body: JSON.stringify({
        extraction_paths: extractionPaths,
        root_array_path: rootArrayPath,
        data: data
      }),
    });
  }
}

export default new ApiExtractApi();
