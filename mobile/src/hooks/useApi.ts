import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { api } from '../lib/api';
import type { Event, Expense, TeamMember, Asset, Requirement, AccountBalance, Repayment, Rental } from '../types';

// Events hooks
export function useEvents(params?: { startDate?: string; endDate?: string }) {
  return useQuery<Event[]>({
    queryKey: ['/api/events', params],
    queryFn: () => api.getEvents(params),
  });
}

export function useEvent(id: string) {
  return useQuery<Event>({
    queryKey: ['/api/events', id],
    queryFn: () => api.getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../types').InsertEvent> }) => api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
  });
}

// Requirements hooks
export function useEventRequirements(eventId: string) {
  return useQuery<Requirement[]>({
    queryKey: ['/api/events', eventId, 'requirements'],
    queryFn: () => api.getEventRequirements(eventId),
    enabled: !!eventId,
  });
}

// Expenses hooks
export function useExpenses(params?: { startDate?: string; endDate?: string }) {
  return useQuery<Expense[]>({
    queryKey: ['/api/expenses', params],
    queryFn: () => api.getExpenses(params),
  });
}

export function useAccountBalance() {
  return useQuery<AccountBalance[]>({
    queryKey: ['/api/account-balance'],
    queryFn: api.getAccountBalance,
  });
}

export function useRepayments() {
  return useQuery<Repayment[]>({
    queryKey: ['/api/repayments'],
    queryFn: api.getRepayments,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../types').InsertExpense> }) => api.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
  });
}

// Team Members hooks
export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['/api/team'],
    queryFn: api.getTeamMembers,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
    },
  });
}

// Assets hooks
export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const data = await api.getAssets();
      // Use a Set to track unique asset IDs
      const uniqueIds = new Set<string>();
      // Filter out duplicates by checking the Set
      return data.filter(asset => {
        if (uniqueIds.has(asset.id)) {
          return false;
        }
        uniqueIds.add(asset.id);
        return true;
      });
    }
  });
}

export function useRentals() {
  return useQuery<Rental[]>({
    queryKey: ['/api/rentals'],
    queryFn: async () => {
      const data = await api.getRentals();
      // Use a Set to track unique asset IDs
      const uniqueIds = new Set<string>();
      // Filter out duplicates by checking the Set
      return data.filter(rental => {
        if (uniqueIds.has(rental.id)) {
          return false;
        }
        uniqueIds.add(rental.id);
        return true;
      });
    }
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAsset,
    onSuccess: () => {
      // Invalidate the assets query to refetch the data
      return queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../types').InsertAsset> }) => api.updateAsset(id, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('[useDeleteAsset] Starting deletion for asset ID:', id);
      try {
        const response = await api.deleteAsset(id);
        console.log('[useDeleteAsset] Delete API response:', response);
        return response;
      } catch (error) {
        console.error('[useDeleteAsset] Failed to delete asset:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useDeleteAsset] Invalidate queries');
      // Invalidate the assets query to refetch the data
      return queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: Error) => {
      console.error('[useDeleteAsset] Error in mutation:', error);
      Alert.alert('Error', `Failed to delete asset: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../types').InsertTeamMember> }) => api.updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
    },
  });
}

// Configuration hook
export function useConfiguration() {
  return useQuery({
    queryKey: ['/api/configuration'],
    queryFn: api.getConfiguration,
  });
}

// Rental Rates hooks
export function useRentalRates() {
  return useQuery({
    queryKey: ['/api/rental-rates'],
    queryFn: api.getRentalRates,
  });
}

export function useCreateRentalRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRentalRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rental-rates'] });
    },
  });
}

export function useUpdateRentalRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('../types').InsertAssetRentalRate> }) => 
      api.updateRentalRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rental-rates'] });
    },
  });
}

export function useDeleteRentalRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRentalRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rental-rates'] });
    },
  });
}

export function useRental(id: string) {
  return useQuery({
    queryKey: ['/api/rentals', id],
    queryFn: () => api.getRental(id),
    enabled: !!id,
  });
}

export function useRentalItems(rentalId: string) {
  return useQuery({
    queryKey: ['/api/rentals', rentalId, 'items'],
    queryFn: () => api.getRentalItems(rentalId),
    enabled: !!rentalId,
  });
}
