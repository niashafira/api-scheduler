import { ApiResponse } from '../types';

// API service for destination management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface DestinationFormData {
  destinationType: 'new';
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
    description?: string;
  }>;
  includeRawPayload: boolean;
  includeIngestedAt: boolean;
  status: string;
  apiSourceId?: number | null;
  apiRequestId?: number | null;
  apiExtractId?: number | null;
}

class DestinationApi {
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

  // Create a new destination configuration
  async createDestination(data: DestinationFormData): Promise<ApiResponse<any>> {
    return this.request<any>('/destinations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get all destinations
  async getAllDestinations(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/destinations');
  }

  // Get destinations by source ID
  async getDestinationsBySource(sourceId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/destinations?source_id=${sourceId}`);
  }

  // Get a specific destination
  async getDestination(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/destinations/${id}`);
  }

  // Update a destination
  async updateDestination(id: number, data: Partial<DestinationFormData>): Promise<ApiResponse<any>> {
    return this.request<any>(`/destinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a destination
  async deleteDestination(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/destinations/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new DestinationApi();
