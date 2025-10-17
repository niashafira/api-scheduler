import { TokenTestConfig, TokenTestResponse, ApiTestResponse, Header, PathParam, QueryParam } from '../types';

// Request options interface
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Generic API response interface
// (unused) GenericApiResponse type removed

// Token data interface
interface TokenData {
  token: string | null;
  expiresIn: number | null;
  refreshToken: string | null;
  isValid: boolean;
}

// API Service for making HTTP requests
export const apiService = {
  // Build a full URL from base, path, path params and query params
  buildUrl(baseUrl: string, path: string = '', pathParams: PathParam[] = [], queryParams: QueryParam[] = []): string {
    if (!baseUrl) return '';
    let cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    let cleanPath = path || '';
    if (cleanPath && !cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    // Replace path params
    if (Array.isArray(pathParams)) {
      pathParams.forEach(param => {
        if (param?.name && param?.value) {
          cleanPath = cleanPath.replace(`{${param.name}}`, encodeURIComponent(param.value));
        }
      });
    }
    // Build query string
    const pairs = (Array.isArray(queryParams) ? queryParams : [])
      .filter(p => p && p.name)
      .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value || '')}`);
    const qs = pairs.length ? `?${pairs.join('&')}` : '';
    return `${cleanBase}${cleanPath}${qs}`;
  },

  // Build RequestOptions with safe defaults to minimize CORS preflight for simple requests
  buildRequestOptions(method: string, bodyFormat?: 'json' | 'form' | 'raw', body?: string, headersArr: Header[] = []): RequestOptions {
    const upperMethod = (method || 'GET').toUpperCase();
    const headers: Record<string, string> = { 'Accept': 'application/json' };

    // Only add Content-Type when sending a body
    if (['POST', 'PUT', 'PATCH'].includes(upperMethod)) {
      if (bodyFormat === 'json') headers['Content-Type'] = 'application/json';
      else if (bodyFormat === 'form') headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      else if (bodyFormat === 'raw' || bodyFormat === 'text') headers['Content-Type'] = 'text/plain;charset=UTF-8';
    }

    // Merge additional headers
    (headersArr || []).forEach(h => {
      if (h?.key && h?.value) headers[h.key] = h.value;
    });

    const options: RequestOptions = { method: upperMethod, headers };

    if (['POST', 'PUT', 'PATCH'].includes(upperMethod) && body) {
      if (bodyFormat === 'json') {
        try {
          options.body = JSON.stringify(JSON.parse(body));
        } catch {
          // If not valid JSON, send raw
          options.body = body;
        }
      } else {
        options.body = body;
      }
    }

    return options;
  },
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
    // Call backend proxy to bypass CORS
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${apiBase}/token-configs/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenConfig),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Proxy error ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Token acquisition failed');
    }
    return data as TokenTestResponse;
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
