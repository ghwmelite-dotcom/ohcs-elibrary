/**
 * Two-Factor Authentication Types
 */

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  trustedDevicesCount: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  uri: string;
  qrCodeUrl: string;
  instructions: string[];
}

export interface TwoFactorEnableResponse {
  success: boolean;
  message: string;
  backupCodes: string[];
  warning: string;
}

export interface BackupCodesStatus {
  remaining: number;
  total: number;
  warning: string | null;
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface TwoFactorVerifyPayload {
  userId: string;
  code: string;
  trustDevice?: boolean;
  deviceName?: string;
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  verified: boolean;
  usedBackupCode: boolean;
  deviceToken?: string;
}
