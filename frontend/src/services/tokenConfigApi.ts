import { ApiResponse, TokenConfig } from '../types';

// API service for token configuration management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface TokenConfigFormData {
  name: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  grantType: 'client_credentials' | 'password' | 'authorization_code';
  scope?: string;
  additionalParams?: Record<string, string>;
}

class TokenConfigApi {
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

  // Get all token configurations
  async getAllTokenConfigs(): Promise<ApiResponse<TokenConfig[]>> {
    return this.request<TokenConfig[]>('/token-configs');
  }

  // Get active token configurations
  async getActiveTokenConfigs(): Promise<ApiResponse<TokenConfig[]>> {
    return this.request<TokenConfig[]>('/token-configs/active');
  }

  // Get a specific token configuration
  async getTokenConfig(id: number): Promise<ApiResponse<TokenConfig>> {
    return this.request<TokenConfig>(`/token-configs/${id}`);
  }

  // Create a new token configuration
  async createTokenConfig(data: TokenConfigFormData): Promise<ApiResponse<TokenConfig>> {
    return this.request<TokenConfig>('/token-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update a token configuration
  async updateTokenConfig(id: number, data: Partial<TokenConfigFormData>): Promise<ApiResponse<TokenConfig>> {
    return this.request<TokenConfig>(`/token-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a token configuration
  async deleteTokenConfig(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/token-configs/${id}`, {
      method: 'DELETE',
    });
  }

  // Mark token configuration as used
  async markTokenConfigAsUsed(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/token-configs/${id}/mark-used`, {
      method: 'POST',
    });
  }
}

export default new TokenConfigApi();
