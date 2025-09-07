import { ApiResponse, ApiRequest, RequestFormData } from '../types';

// API service for API request management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiRequestApi {
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestOptions = {
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
  async getAllApiRequests(): Promise<ApiResponse<ApiRequest[]>> {
    return this.request<ApiRequest[]>('/api-requests');
  }

  // Get active API requests
  async getActiveApiRequests(): Promise<ApiResponse<ApiRequest[]>> {
    return this.request<ApiRequest[]>('/api-requests/active');
  }

  // Get API requests by source
  async getApiRequestsBySource(sourceId: number): Promise<ApiResponse<ApiRequest[]>> {
    return this.request<ApiRequest[]>(`/api-requests/source/${sourceId}`);
  }

  // Get a specific API request
  async getApiRequest(id: number): Promise<ApiResponse<ApiRequest>> {
    return this.request<ApiRequest>(`/api-requests/${id}`);
  }

  // Create a new API request
  async createApiRequest(data: RequestFormData): Promise<ApiResponse<ApiRequest>> {
    return this.request<ApiRequest>('/api-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API request
  async updateApiRequest(id: number, data: Partial<RequestFormData>): Promise<ApiResponse<ApiRequest>> {
    return this.request<ApiRequest>(`/api-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API request
  async deleteApiRequest(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-requests/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API request as executed
  async markApiRequestAsExecuted(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-requests/${id}/mark-executed`, {
      method: 'POST',
    });
  }
}

export default new ApiRequestApi();
