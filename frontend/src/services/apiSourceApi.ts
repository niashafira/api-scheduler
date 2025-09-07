import { ApiResponse, ApiSource, SourceFormData } from '../types';

// API service for API source management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiSourceApi {
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

  // Get all API sources
  async getAllApiSources(): Promise<ApiResponse<ApiSource[]>> {
    return this.request<ApiSource[]>('/api-sources');
  }

  // Get active API sources
  async getActiveApiSources(): Promise<ApiResponse<ApiSource[]>> {
    return this.request<ApiSource[]>('/api-sources/active');
  }

  // Get a specific API source
  async getApiSource(id: number): Promise<ApiResponse<ApiSource>> {
    return this.request<ApiSource>(`/api-sources/${id}`);
  }

  // Create a new API source
  async createApiSource(data: SourceFormData): Promise<ApiResponse<ApiSource>> {
    return this.request<ApiSource>('/api-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API source
  async updateApiSource(id: number, data: Partial<SourceFormData>): Promise<ApiResponse<ApiSource>> {
    return this.request<ApiSource>(`/api-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API source
  async deleteApiSource(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-sources/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API source as used
  async markApiSourceAsUsed(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-sources/${id}/mark-used`, {
      method: 'POST',
    });
  }
}

export default new ApiSourceApi();
