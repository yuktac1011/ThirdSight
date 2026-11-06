import { apiClient } from '@/services/api';
import {
  VendorEntity,
  VendorCreatePayload,
  VendorUpdatePayload,
  VendorContact,
} from '@/types';

export interface VendorListFilters {
  search?: string;
  criticality?: string;
  status?: string;
}

export const vendorService = {
  getVendors: async (filters?: VendorListFilters): Promise<VendorEntity[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.criticality) params.append('criticality', filters.criticality);
    if (filters?.status) params.append('status', filters.status);

    const res = await apiClient.get<VendorEntity[]>('/vendors', { params });
    return res.data;
  },

  getVendorById: async (vendorId: string): Promise<VendorEntity> => {
    const res = await apiClient.get<VendorEntity>(`/vendors/${vendorId}`);
    return res.data;
  },

  createVendor: async (payload: VendorCreatePayload): Promise<VendorEntity> => {
    const res = await apiClient.post<VendorEntity>('/vendors', payload);
    return res.data;
  },

  updateVendor: async (vendorId: string, payload: VendorUpdatePayload): Promise<VendorEntity> => {
    const res = await apiClient.patch<VendorEntity>(`/vendors/${vendorId}`, payload);
    return res.data;
  },

  deleteVendor: async (vendorId: string): Promise<void> => {
    await apiClient.delete(`/vendors/${vendorId}`);
  },

  addContact: async (
    vendorId: string,
    contact: { name: string; email: string; phone?: string; title?: string; is_primary?: boolean }
  ): Promise<VendorContact> => {
    const res = await apiClient.post<VendorContact>(`/vendors/${vendorId}/contacts`, contact);
    return res.data;
  },

  deleteContact: async (vendorId: string, contactId: string): Promise<void> => {
    await apiClient.delete(`/vendors/${vendorId}/contacts/${contactId}`);
  },
};

