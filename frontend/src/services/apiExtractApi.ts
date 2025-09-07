import { ApiResponse, ApiExtract, ExtractFormData, TestResponse, ExtractionPath } from '../types';

// API service for API extract management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiExtractApi {
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

  // Get all API extracts
  async getAllApiExtracts(): Promise<ApiResponse<ApiExtract[]>> {
    return this.request<ApiExtract[]>('/api-extracts');
  }

  // Get active API extracts
  async getActiveApiExtracts(): Promise<ApiResponse<ApiExtract[]>> {
    return this.request<ApiExtract[]>('/api-extracts/active');
  }

  // Get API extracts by request
  async getApiExtractsByRequest(requestId: number): Promise<ApiResponse<ApiExtract[]>> {
    return this.request<ApiExtract[]>(`/api-extracts/request/${requestId}`);
  }

  // Get a specific API extract
  async getApiExtract(id: number): Promise<ApiResponse<ApiExtract>> {
    return this.request<ApiExtract>(`/api-extracts/${id}`);
  }

  // Create a new API extract
  async createApiExtract(data: ExtractFormData): Promise<ApiResponse<ApiExtract>> {
    return this.request<ApiExtract>('/api-extracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an API extract
  async updateApiExtract(id: number, data: Partial<ExtractFormData>): Promise<ApiResponse<ApiExtract>> {
    return this.request<ApiExtract>(`/api-extracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete an API extract
  async deleteApiExtract(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-extracts/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark API extract as executed
  async markApiExtractAsExecuted(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api-extracts/${id}/mark-executed`, {
      method: 'POST',
    });
  }

  // Test extraction with live API data
  async testExtraction(id: number): Promise<ApiResponse<TestResponse>> {
    return this.request<TestResponse>(`/api-extracts/${id}/test`, {
      method: 'POST',
    });
  }

  // Test extraction with custom data
  async testExtractionWithData(extractionPaths: ExtractionPath[], rootArrayPath: string, data: any): Promise<ApiResponse<TestResponse>> {
    return this.request<TestResponse>('/api-extracts/test-with-data', {
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
