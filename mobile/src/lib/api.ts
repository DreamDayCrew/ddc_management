import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiError, Event, Expense, TeamMember, Asset, Requirement, Configuration, Vendor, FulfillmentPlan, AccountBalance, Repayment, InsertEvent, InsertExpense, InsertTeamMember, InsertAsset, InsertRequirement, InsertFulfillmentPlan, InsertVendor, CatalogItem, InsertCatalogItem } from '../types';
import { config } from '../config/environment';

// API Configuration from environment
const API_BASE_URL = config.API_URL;

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    console.log('🔧 ApiClient initializing with baseURL:', baseURL);
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data) {
          console.log('📡 Request data:', config.data);
        }
        return config;
      },
      (error) => {
        console.error('📡 Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
        console.error('❌ Error details:', error.message);

        const serverData = error.response?.data as any | undefined;
        const apiError: ApiError = {
          // Prefer backend-provided message / error if available
          message:
            serverData?.message ||
            serverData?.error ||
            error.message ||
            'An unexpected error occurred',
          code: error.code,
        };

        if (serverData) {
          console.error('❌ Server error response:', serverData);
        }

        return Promise.reject(apiError);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  getBaseUrl(): string {
    return this.client.defaults.baseURL || '';
  }

  // Update base URL (useful for switching between dev/prod)
  setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

console.log('API Client initialized with base URL:', API_BASE_URL);

// Export API methods with proper typing
export const api = {
  // Test connection
  testConnection: () => {
    console.log('Testing API connection to:', API_BASE_URL);
    return apiClient.get<{ message: string }>('/api/health');
  },
  
  // Events
  getEvents: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString();
    return apiClient.get<Event[]>(`/api/events${queryString ? `?${queryString}` : ''}`);
  },
  getEvent: (id: string) => apiClient.get<Event>(`/api/events/${id}`),
  createEvent: (data: InsertEvent) => apiClient.post<Event>('/api/events', data),
  updateEvent: (id: string, data: Partial<InsertEvent>) => apiClient.patch<Event>(`/api/events/${id}`, data),
  deleteEvent: (id: string) => apiClient.delete<void>(`/api/events/${id}`),
  
  // Requirements
  getEventRequirements: (eventId: string) => 
    apiClient.get<Requirement[]>(`/api/events/${eventId}/requirements`),
  createRequirement: (eventId: string, data: InsertRequirement) => 
    apiClient.post<Requirement>(`/api/events/${eventId}/requirements`, data),
  updateRequirement: (eventId: string, id: string, data: Partial<InsertRequirement>) => 
    apiClient.patch<Requirement>(`/api/events/${eventId}/requirements/${id}`, data),
  deleteRequirement: (eventId: string, id: string) => 
    apiClient.delete<void>(`/api/events/${eventId}/requirements/${id}`),

  // Requirement Image Upload
  uploadRequirementImages: async (requirementId: string, formData: FormData) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/requirements/${requirementId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 seconds for image upload
      }
    );
    return response.data;
  },
  deleteRequirementImage: async (requirementId: string, imageUrl: string) => {
    const response = await axios.delete(
      `${API_BASE_URL}/api/requirements/${requirementId}/images`,
      { data: { imageUrl } }
    );
    return response.data;
  },
  getImageUrl: (relativePath: string) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${API_BASE_URL}${relativePath}`;
  },
  
  // Expenses
  getExpenses: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString();
    return apiClient.get<Expense[]>(`/api/expenses${queryString ? `?${queryString}` : ''}`);
  },
  getExpense: (id: string) => apiClient.get<Expense>(`/api/expenses/${id}`),
  createExpense: (data: InsertExpense) => apiClient.post<Expense>('/api/expenses', data),
  updateExpense: (id: string, data: Partial<InsertExpense>) => apiClient.patch<Expense>(`/api/expenses/${id}`, data),
  deleteExpense: (id: string) => apiClient.delete<void>(`/api/expenses/${id}`),

  getAccountBalance: () => apiClient.get<AccountBalance[]>('/api/account-balance'),
  getRepayments: () => apiClient.get<Repayment[]>('/api/repayments'),
  
  // Team Members
  getTeamMembers: () => apiClient.get<TeamMember[]>('/api/team'),
  getTeamMember: (id: string) => apiClient.get<TeamMember>(`/api/team/${id}`),
  createTeamMember: (data: InsertTeamMember) => apiClient.post<TeamMember>('/api/team', data),
  updateTeamMember: (id: string, data: Partial<InsertTeamMember>) => apiClient.patch<TeamMember>(`/api/team/${id}`, data),
  deleteTeamMember: (id: string) => apiClient.delete<void>(`/api/team/${id}`),
  
  // Assets
  getAssets: () => apiClient.get<Asset[]>('/api/assets'),
  getAsset: (id: string) => apiClient.get<Asset>(`/api/assets/${id}`),
  createAsset: (data: InsertAsset) => apiClient.post<Asset>('/api/assets', data),
  updateAsset: (id: string, data: Partial<InsertAsset>) => apiClient.patch<Asset>(`/api/assets/${id}`, data),
  deleteAsset: async (id: string) => {
    console.log('[api] Deleting asset with ID:', id);
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/api/assets/${id}`);
      console.log('[api] Delete asset response:', response);
      return response;
    } catch (error: unknown) {
      const errAny = error as any;
      const errorMessage =
        errAny?.message ||
        errAny?.response?.data?.error ||
        errAny?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Unknown error');

      console.error('[api] Error deleting asset:', {
        id,
        error: errorMessage,
        response: errAny?.response?.data
      });

      // Normalize to a proper Error with the message from backend so UI can show it cleanly
      throw new Error(errorMessage);
    }
  },
  
  // Configuration
  getConfiguration: () => apiClient.get<Configuration>('/api/configuration'),
  createConfiguration: (data: Omit<Configuration, 'id'>) => 
    apiClient.post<Configuration>('/api/configuration', data),
  updateConfiguration: (data: Partial<Configuration> & { id: string }) => 
    apiClient.patch<Configuration>(`/api/configuration/${data.id}`, data),

  // Vendors
  getVendors: () => apiClient.get<Vendor[]>('/api/vendors'),
  createVendor: (data: InsertVendor) => apiClient.post<Vendor>('/api/vendors', data),
  updateVendor: (id: string, data: Partial<InsertVendor>) => apiClient.patch<Vendor>(`/api/vendors/${id}`, data),
  deleteVendor: (id: string) => apiClient.delete<void>(`/api/vendors/${id}`),

  // Fulfillment Plans
  getAllPlans: () => apiClient.get<FulfillmentPlan[]>('/api/plans'),
  getRequirementPlans: (requirementId: string) => 
    apiClient.get<FulfillmentPlan[]>(`/api/requirements/${requirementId}/plans`),
  createPlan: (requirementId: string, data: InsertFulfillmentPlan) => 
    apiClient.post<FulfillmentPlan>(`/api/requirements/${requirementId}/plans`, data),
  updatePlan: (planId: string, data: Partial<InsertFulfillmentPlan>) => 
    apiClient.patch<FulfillmentPlan>(`/api/plans/${planId}`, data),
  deletePlan: (planId: string) => 
    apiClient.delete<void>(`/api/plans/${planId}`),
  updatePlanReview: (planId: string, data: { customerRating?: number | null; teamRating?: number | null; reviewNotes?: string | null }) =>
    apiClient.patch<FulfillmentPlan>(`/api/plans/${planId}/review`, data),

  // Budget Update
  updateEventBudget: (eventId: string, data: { finalizedQuote?: string; ddcCost?: string }) =>
    apiClient.patch<Event>(`/api/events/${eventId}/budget`, data),

  // Catalog Items
  getCatalogItems: () => apiClient.get<CatalogItem[]>('/api/catalog'),
  getCatalogItem: (id: string) => apiClient.get<CatalogItem>(`/api/catalog/${id}`),
  getCatalogItemsByService: (serviceType: string) => 
    apiClient.get<CatalogItem[]>(`/api/catalog/service/${encodeURIComponent(serviceType)}`),
  getCatalogItemsByPackage: (packageName: string) => 
    apiClient.get<CatalogItem[]>(`/api/catalog/package/${encodeURIComponent(packageName)}`),
  createCatalogItem: (data: InsertCatalogItem) => 
    apiClient.post<CatalogItem>('/api/catalog', data),
  updateCatalogItem: (id: string, data: Partial<InsertCatalogItem>) => 
    apiClient.patch<CatalogItem>(`/api/catalog/${id}`, data),
  deleteCatalogItem: (id: string) => 
    apiClient.delete<void>(`/api/catalog/${id}`),
  duplicateCatalogItem: (id: string, overrides?: { serviceType?: string; package?: string; itemName?: string }) => 
    apiClient.post<CatalogItem>(`/api/catalog/${id}/duplicate`, overrides || {}),
  duplicateCatalogService: (data: { sourceService: string; targetService: string; packageFilter?: string }) => 
    apiClient.post<{ message: string; items: CatalogItem[] }>('/api/catalog/duplicate-service', data),
};

// Log final API client configuration
console.log('🎯 API Client initialized with base URL:', API_BASE_URL);

export default apiClient;
