import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Event, Expense, TeamMember, Asset, Requirement } from '../types';

// Events hooks
export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: api.getEvents,
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
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateEvent(id, data),
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
export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
    queryFn: api.getExpenses,
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
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateExpense(id, data),
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
    queryKey: ['/api/assets'],
    queryFn: api.getAssets,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
  });
}
