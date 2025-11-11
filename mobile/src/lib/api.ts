import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiError, Event, Expense, TeamMember, Asset, Requirement, Configuration } from '../types';

// API Configuration
// For development with Expo, you'll need to use your computer's local IP address
// or the Replit deployment URL
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' // Android emulator localhost
  : 'https://your-replit-app-url.repl.co'; // Replace with actual Replit URL

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || 'An unexpected error occurred',
          code: error.code,
        };
        
        if (error.response?.data) {
          apiError.message = (error.response.data as any).message || apiError.message;
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

// Export API methods with proper typing
export const api = {
  // Events
  getEvents: () => apiClient.get<Event[]>('/api/events'),
  getEvent: (id: string) => apiClient.get<Event>(`/api/events/${id}`),
  createEvent: (data: any) => apiClient.post<Event>('/api/events', data),
  updateEvent: (id: string, data: any) => apiClient.patch<Event>(`/api/events/${id}`, data),
  deleteEvent: (id: string) => apiClient.delete<void>(`/api/events/${id}`),
  
  // Requirements
  getEventRequirements: (eventId: string) => 
    apiClient.get<Requirement[]>(`/api/events/${eventId}/requirements`),
  createRequirement: (eventId: string, data: any) => 
    apiClient.post<Requirement>(`/api/events/${eventId}/requirements`, data),
  updateRequirement: (eventId: string, id: string, data: any) => 
    apiClient.patch<Requirement>(`/api/events/${eventId}/requirements/${id}`, data),
  deleteRequirement: (eventId: string, id: string) => 
    apiClient.delete<void>(`/api/events/${eventId}/requirements/${id}`),
  
  // Expenses
  getExpenses: () => apiClient.get<Expense[]>('/api/expenses'),
  getExpense: (id: string) => apiClient.get<Expense>(`/api/expenses/${id}`),
  createExpense: (data: any) => apiClient.post<Expense>('/api/expenses', data),
  updateExpense: (id: string, data: any) => apiClient.patch<Expense>(`/api/expenses/${id}`, data),
  deleteExpense: (id: string) => apiClient.delete<void>(`/api/expenses/${id}`),
  
  // Team Members
  getTeamMembers: () => apiClient.get<TeamMember[]>('/api/team'),
  getTeamMember: (id: string) => apiClient.get<TeamMember>(`/api/team/${id}`),
  createTeamMember: (data: any) => apiClient.post<TeamMember>('/api/team', data),
  updateTeamMember: (id: string, data: any) => apiClient.patch<TeamMember>(`/api/team/${id}`, data),
  deleteTeamMember: (id: string) => apiClient.delete<void>(`/api/team/${id}`),
  
  // Assets
  getAssets: () => apiClient.get<Asset[]>('/api/assets'),
  getAsset: (id: string) => apiClient.get<Asset>(`/api/assets/${id}`),
  createAsset: (data: any) => apiClient.post<Asset>('/api/assets', data),
  updateAsset: (id: string, data: any) => apiClient.patch<Asset>(`/api/assets/${id}`, data),
  deleteAsset: (id: string) => apiClient.delete<void>(`/api/assets/${id}`),
  
  // Configuration
  getConfiguration: () => apiClient.get<Configuration>('/api/configuration'),
  updateConfiguration: (data: any) => apiClient.post<Configuration>('/api/configuration', data),
};

export default apiClient;
