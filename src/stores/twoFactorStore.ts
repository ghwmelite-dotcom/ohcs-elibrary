/**
 * Two-Factor Authentication Store
 * Manages 2FA state and API interactions
 */

import { create } from 'zustand';
import { api } from '@/services/api';
import type {
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
  BackupCodesStatus,
  TrustedDevice,
} from '@/types/twoFactor';

interface TwoFactorState {
  // Status
  status: TwoFactorStatus | null;
  isLoading: boolean;
  error: string | null;

  // Setup flow
  setupData: TwoFactorSetupResponse | null;
  backupCodes: string[] | null;
  isSettingUp: boolean;

  // Trusted devices
  trustedDevices: TrustedDevice[];
  loadingDevices: boolean;

  // Backup codes status
  backupCodesStatus: BackupCodesStatus | null;

  // Actions
  fetchStatus: () => Promise<void>;
  startSetup: () => Promise<boolean>;
  enable2FA: (code: string) => Promise<TwoFactorEnableResponse | null>;
  disable2FA: (password: string, code?: string) => Promise<boolean>;
  fetchBackupCodesStatus: () => Promise<void>;
  regenerateBackupCodes: (code: string) => Promise<string[] | null>;
  fetchTrustedDevices: () => Promise<void>;
  removeTrustedDevice: (deviceId: string) => Promise<boolean>;
  removeAllTrustedDevices: () => Promise<boolean>;
  clearSetupData: () => void;
  clearError: () => void;
}

export const useTwoFactorStore = create<TwoFactorState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,
  setupData: null,
  backupCodes: null,
  isSettingUp: false,
  trustedDevices: [],
  loadingDevices: false,
  backupCodesStatus: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<TwoFactorStatus>('/2fa/status');
      set({ status: response, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch 2FA status',
        isLoading: false,
      });
    }
  },

  startSetup: async () => {
    set({ isSettingUp: true, error: null, setupData: null });
    try {
      const response = await api.post<TwoFactorSetupResponse>('/2fa/setup');
      set({ setupData: response, isSettingUp: false });
      return true;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to start 2FA setup',
        isSettingUp: false,
      });
      return false;
    }
  },

  enable2FA: async (code: string) => {
    set({ isSettingUp: true, error: null });
    try {
      const response = await api.post<TwoFactorEnableResponse>('/2fa/enable', { code });
      set({
        backupCodes: response.backupCodes,
        isSettingUp: false,
        status: { enabled: true, enabledAt: new Date().toISOString(), trustedDevicesCount: 0 },
        setupData: null,
      });
      return response;
    } catch (error: any) {
      set({
        error: error?.message || 'Invalid verification code',
        isSettingUp: false,
      });
      return null;
    }
  },

  disable2FA: async (password: string, code?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/2fa/disable', { password, code });
      set({
        status: { enabled: false, enabledAt: null, trustedDevicesCount: 0 },
        isLoading: false,
        backupCodes: null,
        backupCodesStatus: null,
        trustedDevices: [],
      });
      return true;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to disable 2FA',
        isLoading: false,
      });
      return false;
    }
  },

  fetchBackupCodesStatus: async () => {
    try {
      const response = await api.get<BackupCodesStatus>('/2fa/backup-codes');
      set({ backupCodesStatus: response });
    } catch (error) {
      console.error('Failed to fetch backup codes status:', error);
    }
  },

  regenerateBackupCodes: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ backupCodes: string[] }>('/2fa/backup-codes/regenerate', { code });
      set({
        backupCodes: response.backupCodes,
        isLoading: false,
        backupCodesStatus: { remaining: 10, total: 10, warning: null },
      });
      return response.backupCodes;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to regenerate backup codes',
        isLoading: false,
      });
      return null;
    }
  },

  fetchTrustedDevices: async () => {
    set({ loadingDevices: true });
    try {
      const response = await api.get<{ devices: TrustedDevice[] }>('/2fa/devices');
      set({ trustedDevices: response.devices, loadingDevices: false });
    } catch (error) {
      console.error('Failed to fetch trusted devices:', error);
      set({ loadingDevices: false });
    }
  },

  removeTrustedDevice: async (deviceId: string) => {
    try {
      await api.delete(`/2fa/devices/${deviceId}`);
      set((state) => ({
        trustedDevices: state.trustedDevices.filter((d) => d.id !== deviceId),
      }));
      return true;
    } catch (error) {
      console.error('Failed to remove device:', error);
      return false;
    }
  },

  removeAllTrustedDevices: async () => {
    try {
      await api.delete('/2fa/devices');
      set({ trustedDevices: [] });
      return true;
    } catch (error) {
      console.error('Failed to remove all devices:', error);
      return false;
    }
  },

  clearSetupData: () => {
    set({ setupData: null, backupCodes: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
