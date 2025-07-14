interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: this.defaultHeaders,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 500,
      };
    }
  }

  // Property Services
  async searchProperties(searchTerm: string, options?: any) {
    return this.request('/api/property-es', {
      method: 'POST',
      body: JSON.stringify({ searchTerm, ...options }),
    });
  }

  async getPropertyCsv() {
    return this.request('/api/property-csv');
  }

  async getPropertyTrend(postcode: string, dateRange?: { start: string; end: string }) {
    return this.request('/api/property-trend', {
      method: 'POST',
      body: JSON.stringify({ postcode, dateRange }),
    });
  }

  async getPropertyHistory(propertyId: string) {
    return this.request(`/api/property-history?propertyId=${propertyId}`);
  }

  async enhanceProperties(properties: any[]) {
    return this.request('/api/enhance-properties', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  async getRecentSales(postcode: string, limit?: number) {
    const params = new URLSearchParams({ postcode });
    if (limit) params.append('limit', limit.toString());
    return this.request(`/api/recent-sales?${params.toString()}`);
  }

  async getWhatShouldIPay(params: { postcode: string; propertyType: string; offerMargin: number }) {
    return this.request('/api/what-should-i-pay', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getTopRoi(region?: string, limit?: number) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (limit) params.append('limit', limit.toString());
    return this.request(`/api/top-roi?${params.toString()}`);
  }

  // HPI Services
  async getHpiData(postcode?: string, options?: any) {
    if (postcode) {
      return this.request(`/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`);
    }
    return this.request('/api/hpi');
  }

  async getHpiByPostcode(postcode: string) {
    return this.request(`/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`);
  }

  async getHpiDateRange() {
    return this.request('/api/hpi/date-range');
  }

  // BMV Scoring Services
  async getEnhancedBmvScore(postcode: string, propertyData: any) {
    return this.request('/api/enhanced-bmv-score', {
      method: 'POST',
      body: JSON.stringify({ postcode, propertyData }),
    });
  }

  async suggestPostcodes(query: string) {
    return this.request(`/api/suggest-postcodes?q=${encodeURIComponent(query)}`);
  }

  // User Management Services
  async getUserProfile(userId: string, type?: string) {
    const params = new URLSearchParams({ userId });
    if (type) params.append('type', type);
    return this.request(`/api/profile-usage?${params.toString()}`);
  }

  async incrementUsage(userId: string, type: string) {
    return this.request('/api/increment-usage', {
      method: 'POST',
      body: JSON.stringify({ userId, type }),
    });
  }

  async createCheckoutSession(userId: string, priceId: string) {
    return this.request('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ userId, priceId }),
    });
  }

  async createCustomerPortalSession() {
    return this.request('/api/create-customer-portal-session', {
      method: 'POST',
    });
  }

  // Analytics & Monitoring Services
  async getSummary() {
    return this.request('/api/summary');
  }

  async trackAnalytics(data: any) {
    return this.request('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMonitoringData() {
    return this.request('/api/monitoring');
  }

  async getDataQuality() {
    return this.request('/api/monitoring/quality?detailed=true');
  }

  // External Integrations
  async handleStripeWebhook(payload: any, signature: string) {
    return this.request('/api/stripe-webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'stripe-signature': signature },
    });
  }

  async searchExternal(query: string) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}`);
  }

  // System Services
  async getLastUpdated() {
    return this.request('/api/last-updated');
  }

  // Custom request method for flexibility
  async customRequest<T>(url: string, method: string = 'GET', data?: any, query?: Record<string, string>): Promise<ApiResponse<T>> {
    let fullUrl = url;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams(query);
      fullUrl += `?${params.toString()}`;
    }

    const options: RequestInit = { method };
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }

    return this.request(fullUrl, options);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export { ApiClient };

// Type-safe API methods
export interface PropertySearchResult {
  properties: any[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

export interface HpiData {
  region: string;
  date: string;
  index: number;
  monthOverMonth?: number;
  yearOverYear?: number;
}

export interface BmvScore {
  score: number;
  category: string;
  factors: any[];
  recommendations: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  tier: string;
  usage: {
    searches: number;
    limit: number;
  };
} 