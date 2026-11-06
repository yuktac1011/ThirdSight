import { apiClient, TOKEN_STORAGE_KEY } from '@/services/api';
import { AuthUser, OrganizationDetails, OrganizationMember, UserInvitation, UserRole } from '@/types';

export const authService = {
  login: async (email: string): Promise<{ access_token: string }> => {
    const res = await apiClient.post<{ access_token: string }>('/auth/login', { email });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.data.access_token);
    return res.data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const res = await apiClient.get<AuthUser>('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  },
};

export const organizationService = {
  getCurrentOrganization: async (): Promise<OrganizationDetails> => {
    const res = await apiClient.get<OrganizationDetails>('/organizations/current');
    return res.data;
  },

  updateCurrentOrganization: async (data: { name?: string; status?: string }): Promise<OrganizationDetails> => {
    const res = await apiClient.patch<OrganizationDetails>('/organizations/current', data);
    return res.data;
  },
};

export const userService = {
  getMembers: async (): Promise<OrganizationMember[]> => {
    const res = await apiClient.get<OrganizationMember[]>('/users');
    return res.data;
  },

  createMember: async (data: { email: string; full_name?: string; role: string }): Promise<OrganizationMember> => {
    const res = await apiClient.post<OrganizationMember>('/users', data);
    return res.data;
  },

  updateMember: async (userId: string, data: { full_name?: string; status?: string; role?: string }): Promise<OrganizationMember> => {
    const res = await apiClient.patch<OrganizationMember>(`/users/${userId}`, data);
    return res.data;
  },

  deleteMember: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },

  getAvailableRoles: async (): Promise<UserRole[]> => {
    const res = await apiClient.get<UserRole[]>('/users/roles/available');
    return res.data;
  },

  getInvitations: async (): Promise<UserInvitation[]> => {
    const res = await apiClient.get<UserInvitation[]>('/users/invitations');
    return res.data;
  },

  inviteMember: async (data: { email: string; role_name: string }): Promise<UserInvitation> => {
    const res = await apiClient.post<UserInvitation>('/users/invitations', data);
    return res.data;
  },
};

