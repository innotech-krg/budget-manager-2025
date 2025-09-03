// =====================================================
// API Service - Robuste Backend-Kommunikation mit Offline-Support
// =====================================================

// 🔧 FIX: Einheitliche API-Base-URL für Development und Production
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'  // Vite-Proxy in Development
  : '/api'; // Production

const UPLOAD_TIMEOUT = 30000; // 30 seconds for file uploads
const DEFAULT_TIMEOUT = 10000; // 10 seconds for other requests

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ApiConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiService {
  private baseUrl: string;
  private isOnline: boolean = true;
  private retryQueue: Array<() => Promise<any>> = [];
  private authToken: string | null = null;

  constructor() {
    // 🔧 FIX: Verwende Vite-Proxy in Development, direkte URL in Production
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? ''  // Vite-Proxy (kein baseUrl nötig)
      : '';  // Production (kein baseUrl nötig, da relative URLs)
    this.setupOnlineListener();
    // Load auth token from localStorage on initialization
    this.authToken = localStorage.getItem('auth_token');
    
    // 🔧 FIX: Ensure token is immediately available for API calls
    if (this.authToken) {
      console.log('🔑 ApiService: Token loaded from localStorage on init');
    } else {
      console.log('🔑 ApiService: No token found in localStorage');
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initial check
    this.isOnline = navigator.onLine;
  }

  private async processRetryQueue() {
    while (this.retryQueue.length > 0 && this.isOnline) {
      const request = this.retryQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.warn('Retry failed:', error);
        }
      }
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    config: ApiConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = 10000, retries = 3, retryDelay = 1000 } = config;

    // Offline handling
    if (!this.isOnline) {
      return {
        success: false,
        error: 'Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung.'
      };
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok && response.status !== 304) {
          if (response.status >= 500) {
            throw new Error(`Server-Fehler (${response.status}): ${response.statusText}`);
          } else if (response.status === 404) {
            throw new Error('Endpoint nicht gefunden');
          } else if (response.status === 401) {
            // Token abgelaufen - lösche Token und zeige Login
            this.clearAuthToken();
            localStorage.removeItem('auth_token');
            // Trigger re-authentication durch Event
            window.dispatchEvent(new CustomEvent('auth-token-expired'));
            throw new Error('Session abgelaufen - bitte neu anmelden');
          } else {
            throw new Error(`HTTP-Fehler (${response.status}): ${response.statusText}`);
          }
        }

        // Handle 304 Not Modified - return cached data or empty success response
        if (response.status === 304) {
          return {
            success: true,
            cached: true,
            message: 'Daten unverändert (Cache)'
          };
        }

        const data = await response.json();
        return data;

      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
              continue;
            }
            return {
              success: false,
              error: 'Anfrage-Timeout. Server antwortet nicht.'
            };
          }

          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
              continue;
            }
            return {
              success: false,
              error: 'Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es später erneut.'
            };
          }

          if (attempt < retries && error.message.includes('Server-Fehler')) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            continue;
          }

          return {
            success: false,
            error: error.message
          };
        }

        return {
          success: false,
          error: 'Unbekannter Fehler aufgetreten'
        };
      }
    }

    return {
      success: false,
      error: 'Maximale Anzahl von Wiederholungsversuchen erreicht'
    };
  }

  // =====================================================
  // PUBLIC API METHODS
  // =====================================================

  async get<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, config);
  }

  async post<T>(endpoint: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    };

    if (data instanceof FormData) {
      options.body = data;
      // Don't set Content-Type for FormData, let browser set it with boundary
    } else if (data) {
      options.body = JSON.stringify(data);
      options.headers = { 'Content-Type': 'application/json' };
    }

    return this.makeRequest<T>(endpoint, options, config);
  }

  async put<T>(endpoint: string, data: any, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, config);
  }

  async delete<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, config);
  }

  // =====================================================
  // SPECIFIC API ENDPOINTS
  // =====================================================

  async getBudgets() {
    return this.get('/api/budgets');
  }

  async getProjects() {
    return this.get('/api/projects');
  }

  async getDashboardData() {
    return this.get('/api/dashboard/budget-overview');
  }

  async uploadOCRFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 🔧 FIX: Verwende einheitliche API-Base-URL über Vite-Proxy
    const url = `${API_BASE_URL}/ocr/upload`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData, // Kein Content-Type Header - Browser setzt automatisch multipart/form-data
      });

      if (!response.ok) {
        if (response.status >= 500) {
          return { success: false, error: `Server-Fehler (${response.status}): ${response.statusText}` };
        } else if (response.status === 404) {
          return { success: false, error: 'OCR-Endpoint nicht gefunden' };
        } else {
          return { success: false, error: `Upload-Fehler (${response.status}): ${response.statusText}` };
        }
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return { success: false, error: 'Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.' };
        }
        return { success: false, error: `Upload-Fehler: ${error.message}` };
      }
      return { success: false, error: 'Unbekannter Upload-Fehler' };
    }
  }

  async getOCRStats() {
    return this.get('/api/ocr/stats/summary');
  }

  // Project Invoice Positions API (Story 2.4)
  async getProjectInvoicePositions(projectId: string, options: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const queryString = params.toString()
    const endpoint = `/api/projects/${projectId}/invoice-positions${queryString ? '?' + queryString : ''}`
    
    return this.get(endpoint)
  }

  async getProjectInvoicePositionsSummary(projectId: string) {
    return this.get(`/api/projects/${projectId}/invoice-positions/summary`)
  }

  async removeProjectInvoicePosition(projectId: string, positionId: string, reason?: string) {
    return this.delete(`/api/projects/${projectId}/invoice-positions/${positionId}`, { reason })
  }

  // OCR Review API
  async createReviewSession(ocrProcessingId: string, extractedData: any) {
    return this.post('/api/ocr-review/session', {
      ocrProcessingId,
      extractedData
    });
  }

  async updateReviewSession(sessionId: string, corrections: any[], projectAssignments: any[], supplierConfirmation: any) {
    return this.put(`/api/ocr-review/session/${sessionId}`, {
      corrections,
      projectAssignments,
      supplierConfirmation
    });
  }

  async approveInvoice(sessionId: string, approvedData: any, projectAssignments: any[], comments?: string) {
    return this.post(`/api/ocr-review/session/${sessionId}/approve`, {
      approvedData,
      projectAssignments,
      comments
    });
  }

  async rejectInvoice(sessionId: string, reason?: string) {
    return this.post(`/api/ocr-review/session/${sessionId}/reject`, {
      reason
    });
  }

  // OCR Review APIs - jetzt verwenden wir die echten Projekt/Lieferanten APIs
  async getReviewProjects() {
    return this.get('/api/projects');
  }

  async getReviewSuppliers() {
    return this.get('/api/suppliers');
  }

  async checkDuplicates(invoiceNumber: string, supplierName: string, totalAmount: number, lineItems: any[]) {
    return this.post('/api/ocr-review/check-duplicates', {
      invoiceNumber,
      supplierName,
      totalAmount,
      lineItems
    });
  }

  // =====================================================
  // AUTH TOKEN METHODS
  // =====================================================

  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  isServerReachable(): boolean {
    return this.isOnline;
  }

  getConnectionStatus(): 'online' | 'offline' | 'connecting' {
    if (!navigator.onLine) return 'offline';
    if (!this.isOnline) return 'connecting';
    return 'online';
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.get('/api', { timeout: 5000, retries: 0 });
      this.isOnline = result.success;
      return result.success;
    } catch {
      this.isOnline = false;
      return false;
    }
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
