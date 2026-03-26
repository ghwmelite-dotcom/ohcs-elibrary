/**
 * Two-Factor Authentication Setup & Management Component
 * Comprehensive 2FA UI for the Settings Security section
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Monitor,
  Laptop,
  QrCode,
  Download,
  Clock,
} from 'lucide-react';
import { useTwoFactorStore } from '@/stores/twoFactorStore';
import { cn } from '@/utils/cn';

// ============================================
// Sub-components
// ============================================

/** OTP input with individual digit boxes */
function OTPInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={disabled}
        placeholder="000000"
        autoFocus
        className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 transition-colors"
      />
    </div>
  );
}

/** Reusable modal backdrop + content */
function ModalOverlay({
  isOpen,
  onClose,
  children,
  preventClose = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  preventClose?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={preventClose ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Main Component
// ============================================

export function TwoFactorSetup() {
  const {
    status,
    isLoading,
    error,
    setupData,
    backupCodes,
    isSettingUp,
    trustedDevices,
    loadingDevices,
    backupCodesStatus,
    fetchStatus,
    startSetup,
    enable2FA,
    disable2FA,
    fetchBackupCodesStatus,
    regenerateBackupCodes,
    fetchTrustedDevices,
    removeTrustedDevice,
    removeAllTrustedDevices,
    clearSetupData,
    clearError,
  } = useTwoFactorStore();

  // Modal states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showDevicesExpanded, setShowDevicesExpanded] = useState(false);

  // Form states
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'success'>('qr');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch supplementary data when enabled
  useEffect(() => {
    if (status?.enabled) {
      fetchBackupCodesStatus();
      fetchTrustedDevices();
    }
  }, [status?.enabled]);

  // Clear errors when modals close
  useEffect(() => {
    if (!showSetupModal && !showDisableModal && !showRegenerateModal) {
      clearError();
      setLocalError(null);
    }
  }, [showSetupModal, showDisableModal, showRegenerateModal]);

  // ---- Handlers ----

  const handleStartSetup = async () => {
    clearError();
    setLocalError(null);
    setSetupStep('qr');
    setVerificationCode('');
    setShowSetupModal(true);
    const success = await startSetup();
    if (!success) {
      // Error is set in store
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) return;
    setLocalError(null);
    const result = await enable2FA(verificationCode);
    if (result) {
      setSetupStep('success');
    }
  };

  const handleDisable = async () => {
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    setLocalError(null);
    const success = await disable2FA(password, disableCode || undefined);
    if (success) {
      setShowDisableModal(false);
      setPassword('');
      setDisableCode('');
    }
  };

  const handleRegenerate = async () => {
    if (regenerateCode.length !== 6) return;
    setLocalError(null);
    const codes = await regenerateBackupCodes(regenerateCode);
    if (codes) {
      setRegenerateCode('');
      // Show the new codes in the backup modal
      setShowRegenerateModal(false);
      setShowBackupModal(true);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingDeviceId(deviceId);
    await removeTrustedDevice(deviceId);
    setRemovingDeviceId(null);
  };

  const handleRemoveAllDevices = async () => {
    await removeAllTrustedDevices();
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id || text);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const closeSetupModal = () => {
    setShowSetupModal(false);
    clearSetupData();
    setSetupStep('qr');
    setVerificationCode('');
  };

  const displayError = localError || error;

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* ---- Status Card ---- */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                status?.enabled
                  ? 'bg-success-100 dark:bg-success-900/30'
                  : 'bg-surface-100 dark:bg-surface-700'
              )}
            >
              {status?.enabled ? (
                <ShieldCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
              ) : (
                <Shield className="w-5 h-5 text-surface-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-surface-500">
                {status?.enabled
                  ? `Enabled${status.trustedDevicesCount > 0 ? ` \u2022 ${status.trustedDevicesCount} trusted device${status.trustedDevicesCount !== 1 ? 's' : ''}` : ''}`
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          {status?.enabled ? (
            <button
              onClick={() => setShowDisableModal(true)}
              className="px-4 py-2 border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 font-medium rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={isLoading || isSettingUp}
              className="px-4 py-2 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
            >
              {isLoading || isSettingUp ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                'Enable 2FA'
              )}
            </button>
          )}
        </div>

        {/* Enabled status banner */}
        {status?.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-success-700 dark:text-success-300">
                  Your account is protected with two-factor authentication
                </p>
                <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                  Enabled on{' '}
                  {status.enabledAt
                    ? new Date(status.enabledAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'recently'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ---- Backup Codes Section ---- */}
      {status?.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-white">Backup Codes</h3>
                <p className="text-sm text-surface-500">
                  {backupCodesStatus
                    ? `${backupCodesStatus.remaining} of ${backupCodesStatus.total} codes remaining`
                    : 'Recovery codes for when you lose your device'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBackupModal(true)}
                className="px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                View Status
              </button>
              <button
                onClick={() => {
                  setRegenerateCode('');
                  setShowRegenerateModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          {/* Warning if codes are low */}
          {backupCodesStatus?.warning && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
              <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0" />
              <p className="text-sm text-warning-700 dark:text-warning-300">
                {backupCodesStatus.warning}
              </p>
            </div>
          )}

          {/* Backup code usage bar */}
          {backupCodesStatus && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                <span>Codes used</span>
                <span>
                  {backupCodesStatus.total - backupCodesStatus.remaining} /{' '}
                  {backupCodesStatus.total}
                </span>
              </div>
              <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((backupCodesStatus.total - backupCodesStatus.remaining) / backupCodesStatus.total) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full transition-colors',
                    backupCodesStatus.remaining <= 2
                      ? 'bg-error-500'
                      : backupCodesStatus.remaining <= 5
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                  )}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ---- Trusted Devices Section ---- */}
      {status?.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-white">Trusted Devices</h3>
                <p className="text-sm text-surface-500">
                  {trustedDevices.length > 0
                    ? `${trustedDevices.length} device${trustedDevices.length !== 1 ? 's' : ''} trusted`
                    : 'Devices that skip 2FA verification'}
                </p>
              </div>
            </div>
            {trustedDevices.length > 0 && (
              <button
                onClick={handleRemoveAllDevices}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove All
              </button>
            )}
          </div>

          {loadingDevices ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-surface-400 animate-spin" />
            </div>
          ) : trustedDevices.length > 0 ? (
            <div className="space-y-2">
              {trustedDevices.map((device) => (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-surface-400" />
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {device.deviceName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last used:{' '}
                          {new Date(device.lastUsedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>
                          Expires:{' '}
                          {new Date(device.expiresAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={removingDeviceId === device.id}
                    className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {removingDeviceId === device.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Smartphone className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-500">No trusted devices</p>
              <p className="text-xs text-surface-400 mt-1">
                You can trust a device during login to skip 2FA on that device
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ---- Inline Error ---- */}
      <AnimatePresence>
        {error && !showSetupModal && !showDisableModal && !showRegenerateModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0" />
              <p className="text-sm text-error-800 dark:text-error-200 flex-1">{error}</p>
              <button
                onClick={clearError}
                className="p-1 hover:bg-error-100 dark:hover:bg-error-800 rounded"
              >
                <X className="w-4 h-4 text-error-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* SETUP MODAL                                                       */}
      {/* ================================================================ */}
      <ModalOverlay
        isOpen={showSetupModal}
        onClose={setupStep === 'success' ? () => {} : closeSetupModal}
        preventClose={setupStep === 'success'}
      >
        <div className="p-6">
          {/* Step: QR Code */}
          {setupStep === 'qr' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Set Up Two-Factor Authentication
                </h3>
                <button
                  onClick={closeSetupModal}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              {isSettingUp ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                  <p className="text-surface-500">Generating your setup key...</p>
                </div>
              ) : setupData ? (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy,
                      etc.)
                    </p>

                    {/* QR Code */}
                    <div className="inline-flex p-4 bg-white rounded-xl shadow-lg mb-4">
                      <img
                        src={setupData.qrCodeUrl}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                        onError={(e) => {
                          // Hide broken image, show fallback
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Manual entry key */}
                    <div className="mt-2">
                      <p className="text-xs text-surface-500 mb-2">
                        Can't scan? Enter this key manually:
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-lg font-mono text-sm text-surface-900 dark:text-white select-all">
                          {setupData.secret}
                        </code>
                        <button
                          onClick={() => copyToClipboard(setupData.secret, 'secret')}
                          className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                          title="Copy secret key"
                        >
                          {copiedItem === 'secret' ? (
                            <Check className="w-4 h-4 text-success-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-surface-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-surface-900 dark:text-white mb-2">
                      Instructions
                    </h4>
                    <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-1.5">
                      {setupData.instructions.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <button
                    onClick={() => setSetupStep('verify')}
                    className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Continue to Verification
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="w-8 h-8 text-error-500 mb-4" />
                  <p className="text-surface-500 mb-4">Failed to generate setup data</p>
                  <button
                    onClick={() => startSetup()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step: Verify Code */}
          {setupStep === 'verify' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Verify Your Code
                </h3>
                <button
                  onClick={closeSetupModal}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Enter the 6-digit code from your authenticator app to verify the setup
                </p>
              </div>

              <div className="space-y-4">
                <OTPInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  disabled={isSettingUp}
                />

                {error && (
                  <div className="flex items-center gap-2 text-error-500 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSetupStep('qr');
                      setVerificationCode('');
                      clearError();
                    }}
                    className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyAndEnable}
                    disabled={isSettingUp || verificationCode.length !== 6}
                    className="flex-1 px-4 py-2.5 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
                  >
                    {isSettingUp ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step: Success + Backup Codes */}
          {setupStep === 'success' && backupCodes && (
            <>
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
                  className="w-16 h-16 mx-auto bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-4"
                >
                  <ShieldCheck className="w-8 h-8 text-success-600 dark:text-success-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  Two-Factor Authentication Enabled!
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Save these backup codes in a safe place. You will need them if you lose access to
                  your authenticator app.
                </p>
              </div>

              {/* Warning banner */}
              <div className="flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800 mb-4">
                <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  These codes will only be shown once. Store them in a secure location such as a
                  password manager.
                </p>
              </div>

              {/* Backup codes grid */}
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-white dark:bg-surface-800 rounded-lg"
                    >
                      <code className="font-mono text-sm text-surface-900 dark:text-white">
                        {code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code, `code-${index}`)}
                        className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                      >
                        {copiedItem === `code-${index}` ? (
                          <Check className="w-3 h-3 text-success-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-surface-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'all-codes')}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  {copiedItem === 'all-codes' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All Codes
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={closeSetupModal}
                className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                I've Saved My Codes - Done
              </button>
            </>
          )}
        </div>
      </ModalOverlay>

      {/* ================================================================ */}
      {/* DISABLE 2FA MODAL                                                 */}
      {/* ================================================================ */}
      <ModalOverlay
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setPassword('');
          setDisableCode('');
          setLocalError(null);
        }}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mb-4">
              <ShieldOff className="w-8 h-8 text-error-600 dark:text-error-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              Disable Two-Factor Authentication?
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              This will remove the extra layer of security from your account. You can re-enable it
              at any time.
            </p>
          </div>

          <div className="space-y-4">
            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Current Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TOTP code (optional) */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Authenticator Code <span className="text-surface-400">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="w-full px-4 py-2.5 text-center font-mono tracking-widest bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {(error || localError) && (
              <div className="flex items-center gap-2 text-error-500 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setPassword('');
                  setDisableCode('');
                  setLocalError(null);
                }}
                className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={isLoading || !password}
                className="flex-1 px-4 py-2.5 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Disabling...
                  </span>
                ) : (
                  'Disable 2FA'
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalOverlay>

      {/* ================================================================ */}
      {/* BACKUP CODES STATUS MODAL                                         */}
      {/* ================================================================ */}
      <ModalOverlay
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Backup Codes
            </h3>
            <button
              onClick={() => setShowBackupModal(false)}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* If new codes were just generated, show them */}
          {backupCodes && backupCodes.length > 0 ? (
            <>
              <div className="flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800 mb-4">
                <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  Save these codes securely. They will not be shown again.
                </p>
              </div>

              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-surface-800 px-3 py-2 rounded-lg text-center text-surface-900 dark:text-white"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'modal-all-codes')}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  {copiedItem === 'modal-all-codes' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All Codes
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowBackupModal(false)}
                className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Key className="w-6 h-6 text-surface-500" />
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {backupCodesStatus?.remaining || 0} codes remaining
                    </p>
                    <p className="text-sm text-surface-500">
                      of {backupCodesStatus?.total || 10} total codes
                    </p>
                  </div>
                </div>

                {backupCodesStatus && backupCodesStatus.remaining < 3 && (
                  <div className="flex items-center gap-2 text-warning-600 dark:text-warning-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Low on backup codes. Consider regenerating.</span>
                  </div>
                )}

                <p className="text-sm text-surface-500 mt-4">
                  For security, backup codes can only be viewed when first generated. If you need
                  new codes, use the regenerate option.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowBackupModal(false);
                  setRegenerateCode('');
                  setShowRegenerateModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Backup Codes
              </button>
            </>
          )}
        </div>
      </ModalOverlay>

      {/* ================================================================ */}
      {/* REGENERATE BACKUP CODES MODAL                                     */}
      {/* ================================================================ */}
      <ModalOverlay
        isOpen={showRegenerateModal}
        onClose={() => {
          setShowRegenerateModal(false);
          setRegenerateCode('');
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Regenerate Backup Codes
            </h3>
            <button
              onClick={() => {
                setShowRegenerateModal(false);
                setRegenerateCode('');
              }}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700 dark:text-warning-300">
              This will invalidate all your existing backup codes. Enter your authenticator code to
              confirm.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Enter 6-digit authenticator code
              </label>
              <OTPInput
                value={regenerateCode}
                onChange={setRegenerateCode}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-error-500 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode('');
                }}
                className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isLoading || regenerateCode.length !== 6}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </span>
                ) : (
                  'Regenerate Codes'
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
}
