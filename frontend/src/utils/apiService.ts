import { ApiResponse, TokenConfig, TokenTestConfig, TokenTestResponse, ApiTestResponse, Header } from '../types';

// Request options interface
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Generic API response interface
interface GenericApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  ok: boolean;
}

// Token data interface
interface TokenData {
  token: string | null;
  expiresIn: number | null;
  refreshToken: string | null;
  isValid: boolean;
}

// API Service for making HTTP requests
export const apiService = {
  async makeRequest(url: string, options: RequestOptions = {}): Promise<any> {
    const defaultOptions: RequestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions: RequestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      throw new Error(`Request failed: ${(error as Error).message}`);
    }
  },

  async testTokenAcquisition(tokenConfig: TokenTestConfig): Promise<TokenTestResponse> {
    const { endpoint, method, headers, body, tokenPath, expiresInPath, refreshTokenPath } = tokenConfig;
    
    if (!endpoint) {
      throw new Error('Token endpoint is required');
    }
    if (!tokenPath) {
      throw new Error('Token field path is required');
    }

    // Prepare headers for the request
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add custom headers
    if (headers) {
      headers.forEach((header: Header) => {
        if (header.key && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });
    }

    // Parse body if it's a JSON string
    let requestBody: any = undefined;
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        requestBody = body;
      }
    }

    const options: RequestOptions = {
      method: method || 'POST',
      headers: requestHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    };

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Extract token using the specified path
    const tokenValue = jsonPath.getValue(responseData, tokenPath);
    
    if (!tokenValue) {
      throw new Error(`No valid token found at path: ${tokenPath}`);
    }

    return {
      success: true,
      token: tokenValue,
      expiresIn: expiresInPath ? jsonPath.getValue(responseData, expiresInPath) : null,
      refreshToken: refreshTokenPath ? jsonPath.getValue(responseData, refreshTokenPath) : null,
      fullResponse: responseData
    };
  },

  async testRegularConnection(baseUrl: string, headers: Header[] = []): Promise<any> {
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const headerObj: Record<string, string> = {};
    filteredHeaders.forEach(h => {
      headerObj[h.key] = h.value;
    });

    const options: RequestOptions = {
      method: 'GET',
      headers: headerObj,
    };

    return await this.makeRequest(baseUrl, options);
  },

  async testApiWithToken(baseUrl: string, token: string, headers: Header[] = []): Promise<any> {
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const headerObj: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...filteredHeaders.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
    };

    const options: RequestOptions = {
      method: 'GET',
      headers: headerObj,
    };

    return await this.makeRequest(baseUrl, options);
  },

  async testCustomRequest(url: string, options: RequestOptions = {}): Promise<ApiTestResponse> {
    try {
      const response = await fetch(url, options);
      
      // Get response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Get response data
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        ok: response.ok
      };
    } catch (error) {
      throw new Error(`Request failed: ${(error as Error).message}`);
    }
  }
};

// JSON Path utility for extracting values from nested objects
export const jsonPath = {
  getValue(obj: any, path: string): any {
    if (!path || !obj) return null;
    
    const keys = path.split('.');
    let current: any = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return null;
      }
      
      if (Array.isArray(current)) {
        const index = parseInt(key);
        if (isNaN(index)) {
          return null;
        }
        current = current[index];
      } else if (typeof current === 'object') {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  },

  extractTokenData(response: any, tokenConfig: { tokenPath: string; expiresInPath?: string; refreshTokenPath?: string }): TokenData {
    const { tokenPath, expiresInPath, refreshTokenPath } = tokenConfig;
    
    const token = this.getValue(response, tokenPath);
    const expiresIn = expiresInPath ? this.getValue(response, expiresInPath) : null;
    const refreshToken = refreshTokenPath ? this.getValue(response, refreshTokenPath) : null;
    
    return {
      token,
      expiresIn: expiresIn ? parseInt(expiresIn) : null,
      refreshToken,
      isValid: !!token
    };
  }
};
