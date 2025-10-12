import { ApiResponse } from '../types';

// API service for schedule management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export interface ScheduleFormData {
  scheduleType: 'manual' | 'cron';
  enabled: boolean;
  cronExpression?: string;
  cronDescription?: string;
  timezone: string;
  maxRetries: number;
  retryDelay: number;
  retryDelayUnit: 'seconds' | 'minutes' | 'hours';
  status?: string;
  apiSourceId?: number | null;
  apiRequestId?: number | null;
  apiExtractId?: number | null;
  destinationId?: number | null;
}

export interface ScheduleResponse {
  id: number;
  scheduleType: string;
  enabled: boolean;
  cronExpression?: string;
  cronDescription?: string;
  timezone: string;
  maxRetries: number;
  retryDelay: number;
  retryDelayUnit: string;
  status: string;
  apiSourceId?: number;
  apiRequestId?: number;
  apiExtractId?: number;
  destinationId?: number;
  createdAt: string;
  updatedAt: string;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ScheduleApi {
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

  // Get all schedules
  async getAllSchedules(filters?: {
    sourceId?: number;
    requestId?: number;
    extractId?: number;
    destinationId?: number;
    scheduleType?: string;
    enabled?: boolean;
    status?: string;
  }): Promise<ApiResponse<ScheduleResponse[]>> {
    const params = new URLSearchParams();
    if (filters?.sourceId) params.append('source_id', filters.sourceId.toString());
    if (filters?.requestId) params.append('request_id', filters.requestId.toString());
    if (filters?.extractId) params.append('extract_id', filters.extractId.toString());
    if (filters?.destinationId) params.append('destination_id', filters.destinationId.toString());
    if (filters?.scheduleType) params.append('schedule_type', filters.scheduleType);
    if (filters?.enabled !== undefined) params.append('enabled', filters.enabled.toString());
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const endpoint = queryString ? `/schedules?${queryString}` : '/schedules';
    return this.request<ScheduleResponse[]>(endpoint);
  }

  // Get a specific schedule
  async getSchedule(id: number): Promise<ApiResponse<ScheduleResponse>> {
    return this.request<ScheduleResponse>(`/schedules/${id}`);
  }

  // Create a new schedule
  async createSchedule(data: ScheduleFormData): Promise<ApiResponse<ScheduleResponse>> {
    return this.request<ScheduleResponse>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update a schedule
  async updateSchedule(id: number, data: Partial<ScheduleFormData>): Promise<ApiResponse<ScheduleResponse>> {
    return this.request<ScheduleResponse>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a schedule
  async deleteSchedule(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Get schedules by source ID
  async getSchedulesBySource(sourceId: number): Promise<ApiResponse<ScheduleResponse[]>> {
    return this.request<ScheduleResponse[]>(`/schedules/source/${sourceId}`);
  }

  // Get active schedules
  async getActiveSchedules(): Promise<ApiResponse<ScheduleResponse[]>> {
    return this.request<ScheduleResponse[]>('/schedules/active');
  }

  // Get cron schedules
  async getCronSchedules(): Promise<ApiResponse<ScheduleResponse[]>> {
    return this.request<ScheduleResponse[]>('/schedules/cron');
  }

  // Manually execute a schedule
  async executeSchedule(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/schedules/${id}/execute`, {
      method: 'POST',
    });
  }
}

const scheduleApi = new ScheduleApi();
export default scheduleApi;
