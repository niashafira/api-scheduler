import { ApiResponse, TokenConfig, Header } from '../types';

// Request options interface
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Response interface
interface TestResponse {
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

  async testTokenAcquisition(tokenConfig: TokenConfig): Promise<any> {
    const { tokenUrl, grantType, clientId, clientSecret, username, password, scope, additionalParams } = tokenConfig;
    
    // Build request body based on grant type
    let body: Record<string, string> = {
      grant_type: grantType,
    };

    if (grantType === 'client_credentials') {
      if (clientId) body.client_id = clientId;
      if (clientSecret) body.client_secret = clientSecret;
    } else if (grantType === 'password') {
      if (username) body.username = username;
      if (password) body.password = password;
      if (clientId) body.client_id = clientId;
      if (clientSecret) body.client_secret = clientSecret;
    }

    if (scope) body.scope = scope;
    if (additionalParams) {
      body = { ...body, ...additionalParams };
    }

    const options: RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    };

    return await this.makeRequest(tokenUrl, options);
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

  async testCustomRequest(url: string, options: RequestOptions = {}): Promise<TestResponse> {
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
