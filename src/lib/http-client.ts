interface RequestConfig extends RequestInit {
  url: string;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  private async request<T>(config: RequestConfig): Promise<T> {
    const { url, headers = {}, ...options } = config;
    
    // Build full URL
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Prepare headers
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...(headers as Record<string, string>),
    };

    // Add authorization header if token exists
    const token = this.getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(fullURL, {
        ...options,
        headers: requestHeaders,
      });

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: any;

      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textData = await response.text();
          // Try to parse as JSON if it looks like JSON
          if (textData.startsWith('{') || textData.startsWith('[')) {
            try {
              data = JSON.parse(textData);
            } catch {
              data = textData;
            }
          } else {
            data = textData;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse response:', parseError);
        data = null;
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear token
          this.clearAuthToken();
          
          // Redirect to login page
          if (typeof window !== 'undefined') {
            // Check if we're not already on the login page to avoid infinite redirects
            if (!window.location.pathname.includes('/signin')) {
              window.location.href = '/signin';
            }
          }
        }

        // Extract error message
        let errorMessage = `HTTP Error: ${response.status}`;
        if (data && typeof data === 'object') {
          errorMessage = data.error || data.message || errorMessage;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // Only log if it's not a handled error
      if (!(error instanceof Error && error.message.startsWith('HTTP Error'))) {
        console.error('HTTP Request Error:', error);
      }
      throw error;
    }
  }

  // GET method
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
  }

  // POST method
  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT method
  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE method
  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  // PATCH method
  async patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Set token method
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // Clear token method
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
    }
  }

  // Get current token
  getToken(): string | null {
    return this.getAuthToken();
  }
}

// Create and export instance
export const httpClient = new HttpClient();

// Export types for use in components
export type { ApiResponse };
