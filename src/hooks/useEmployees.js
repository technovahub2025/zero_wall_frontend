import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeService } from '../services/employeeService';
import { useAuthStore } from '../store/authStore';

function canReadEmployees(role) {
  return ['superadmin', 'admin', 'project_manager'].includes(role);
}

export function useEmployees(params = {}, queryOptions = {}) {
  const role = useAuthStore((state) => state.user?.role);
  return useQuery({
    queryKey: ['employees', params],
    enabled: Boolean(role && canReadEmployees(role)) && (queryOptions.enabled ?? true),
    staleTime: queryOptions.staleTime ?? 5 * 60_000,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    queryFn: () => employeeService.list(params),
    ...queryOptions,
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: ['employee', id],
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => employeeService.get(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => employeeService.create(payload),
    onSuccess: () => toast.success('Employee saved'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => employeeService.update(id, payload),
    onSuccess: () => toast.success('Employee updated'),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables?.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => employeeService.updateRole(id, payload),
    onSuccess: () => toast.success('Role updated'),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables?.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => employeeService.update(id, { isActive: false }),
    onSuccess: () => toast.success('Employee deactivated'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => employeeService.deleteEmployee(id),
    onSuccess: () => toast.success('Employee deleted'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useEmployeeTasks(id) {
  return useQuery({
    queryKey: ['employee-tasks', id],
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => employeeService.tasks(id),
  });
}

export function useEmployeeWorkload(id) {
  return useQuery({
    queryKey: ['employee-workload', id],
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => employeeService.workload(id),
  });
}

export function useEmployeeDocuments(id) {
  return useQuery({
    queryKey: ['employee-documents', id],
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => employeeService.documents(id),
  });
}
