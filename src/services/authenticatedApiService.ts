import { supabase } from '../lib/supabase';
import { API_CONFIG } from '../config/apiConfig';

interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class AuthenticatedApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Get current user's JWT token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        console.warn('No valid session found for API request');
        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(endpoint: string, config: ApiConfig = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true
    } = config;

    try {
      // Get JWT token if auth is required
      let authToken: string | null = null;
      if (requireAuth) {
        authToken = await this.getAuthToken();

        if (!authToken) {
          return {
            error: 'Authentication required but no valid session found',
            status: 401
          };
        }
      }

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      // Add JWT token to Authorization header
      if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include' // Include cookies for password reset sessions
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Make the request
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`🌐 API Request: ${method} ${url}`, {
        hasAuth: !!authToken,
        bodyKeys: body ? Object.keys(body) : null
      });

      const response = await fetch(url, requestOptions);

      // Parse response
      let responseData: T | undefined;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      }

      if (!response.ok) {
        const errorMessage = responseData ?
          (responseData as any).error || (responseData as any).message || 'API request failed' :
          `HTTP ${response.status}: ${response.statusText}`;

        return {
          error: errorMessage,
          status: response.status
        };
      }

      return {
        data: responseData,
        status: response.status
      };

    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
        status: 0
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  async post<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  async put<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  async delete<T = any>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  async patch<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }
}

// Export singleton instance
export const apiService = new AuthenticatedApiService();
export default apiService;