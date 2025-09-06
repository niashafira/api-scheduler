// API Service for making HTTP requests
export const apiService = {
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = {
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
      throw new Error(`Request failed: ${error.message}`);
    }
  },

  async testTokenAcquisition(tokenConfig) {
    const { endpoint, method, headers, body } = tokenConfig;
    
    // Filter out empty headers
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const headerObj = {};
    filteredHeaders.forEach(h => {
      headerObj[h.key] = h.value;
    });

    // Parse body if it's a string
    let parsedBody = body;
    if (typeof body === 'string' && body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        // If it's not valid JSON, send as string
        parsedBody = body;
      }
    }

    const options = {
      method,
      headers: headerObj,
    };

    if (method !== 'GET' && parsedBody) {
      options.body = typeof parsedBody === 'object' ? JSON.stringify(parsedBody) : parsedBody;
    }

    return await this.makeRequest(endpoint, options);
  },

  async testRegularConnection(baseUrl, headers = []) {
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const headerObj = {};
    filteredHeaders.forEach(h => {
      headerObj[h.key] = h.value;
    });

    const options = {
      method: 'GET',
      headers: headerObj,
    };

    return await this.makeRequest(baseUrl, options);
  },

  async testApiWithToken(baseUrl, token, headers = []) {
    const filteredHeaders = headers.filter(h => h.key && h.value);
    const headerObj = {
      'Authorization': `Bearer ${token}`,
      ...filteredHeaders.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
    };

    const options = {
      method: 'GET',
      headers: headerObj,
    };

    return await this.makeRequest(baseUrl, options);
  },

  async testCustomRequest(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      // Get response headers
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Get response data
      let data;
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
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

// JSON Path utility for extracting values from nested objects
export const jsonPath = {
  getValue(obj, path) {
    if (!path || !obj) return null;
    
    const keys = path.split('.');
    let current = obj;
    
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

  extractTokenData(response, tokenConfig) {
    const { tokenPath, expiresInPath, refreshTokenPath } = tokenConfig;
    
    const token = this.getValue(response, tokenPath);
    const expiresIn = this.getValue(response, expiresInPath);
    const refreshToken = refreshTokenPath ? this.getValue(response, refreshTokenPath) : null;
    
    return {
      token,
      expiresIn: expiresIn ? parseInt(expiresIn) : null,
      refreshToken,
      isValid: !!token
    };
  }
};
