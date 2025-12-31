/**
 * Two-Factor Authentication Settings Component
 * Handles 2FA setup, management, and device management
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Monitor,
  Laptop,
  X,
  QrCode,
} from 'lucide-react';
import { useTwoFactorStore } from '@/stores/twoFactorStore';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';

export function TwoFactorSettings() {
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

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch additional data when 2FA is enabled
  useEffect(() => {
    if (status?.enabled) {
      fetchBackupCodesStatus();
      fetchTrustedDevices();
    }
  }, [status?.enabled]);

  const handleStartSetup = async () => {
    setShowSetupModal(true);
    setStep('qr');
    setVerificationCode('');
    await startSetup();
  };

  const handleVerifyCode = async () => {
    const result = await enable2FA(verificationCode);
    if (result) {
      setStep('backup');
    }
  };

  const handleDisable = async () => {
    const success = await disable2FA(password, verificationCode);
    if (success) {
      setShowDisableModal(false);
      setPassword('');
      setVerificationCode('');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    await regenerateBackupCodes(verificationCode);
    setVerificationCode('');
    setShowRegenerateModal(false);
  };

  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const closeSetupModal = () => {
    setShowSetupModal(false);
    clearSetupData();
    setStep('qr');
    setVerificationCode('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-3 rounded-xl',
            status?.enabled
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-surface-100 dark:bg-surface-800'
          )}
        >
          {status?.enabled ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Shield className="w-6 h-6 text-surface-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-surface-500">
            {status?.enabled
              ? 'Your account is protected with 2FA'
              : 'Add an extra layer of security to your account'}
          </p>
        </div>
        <Button
          onClick={status?.enabled ? () => setShowDisableModal(true) : handleStartSetup}
          variant={status?.enabled ? 'outline' : 'primary'}
          loading={isLoading || isSettingUp}
        >
          {status?.enabled ? 'Disable' : 'Enable 2FA'}
        </Button>
      </div>

      {/* Status Card */}
      {status?.enabled && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Two-factor authentication is enabled
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Enabled on{' '}
                {status.enabledAt
                  ? new Date(status.enabledAt).toLocaleDateString()
                  : 'recently'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Section */}
      {status?.enabled && (
        <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-surface-500" />
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50">
                  Backup Codes
                </h4>
                <p className="text-sm text-surface-500">
                  {backupCodesStatus
                    ? `${backupCodesStatus.remaining} of ${backupCodesStatus.total} codes remaining`
                    : 'Use these if you lose access to your authenticator'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBackupCodesModal(true)}
              >
                View Codes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRegenerateModal(true)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Regenerate
              </Button>
            </div>
          </div>
          {backupCodesStatus?.warning && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {backupCodesStatus.warning}
            </div>
          )}
        </div>
      )}

      {/* Trusted Devices Section */}
      {status?.enabled && (
        <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-surface-500" />
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50">
                  Trusted Devices
                </h4>
                <p className="text-sm text-surface-500">
                  Devices that don't require 2FA verification
                </p>
              </div>
            </div>
            {trustedDevices.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={removeAllTrustedDevices}
                className="text-error-600 hover:text-error-700"
              >
                Remove All
              </Button>
            )}
          </div>

          {loadingDevices ? (
            <div className="text-center py-4 text-surface-500">Loading devices...</div>
          ) : trustedDevices.length > 0 ? (
            <div className="space-y-2">
              {trustedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-surface-400" />
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {device.deviceName}
                      </p>
                      <p className="text-xs text-surface-500">
                        Last used:{' '}
                        {new Date(device.lastUsedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrustedDevice(device.id)}
                  >
                    <Trash2 className="w-4 h-4 text-error-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-500 text-center py-4">
              No trusted devices. Devices can be trusted during login.
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-error-600" />
              <p className="text-error-800 dark:text-error-200">{error}</p>
              <button onClick={clearError} className="ml-auto">
                <X className="w-4 h-4 text-error-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={closeSetupModal}
        title="Set Up Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-6">
          {step === 'qr' && setupData && (
            <>
              <div className="text-center">
                <div className="inline-flex p-4 bg-white rounded-xl shadow-lg mb-4">
                  <img
                    src={setupData.qrCodeUrl}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                  Scan this QR code with your authenticator app
                </p>
                <p className="text-xs text-surface-500">
                  Or manually enter:{' '}
                  <code className="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                    {setupData.secret}
                  </code>
                </p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                  Instructions
                </h4>
                <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-1">
                  {setupData.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>
              <Button fullWidth onClick={() => setStep('verify')}>
                Continue
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-surface-500">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
              <div className="flex gap-3">
                <Button fullWidth variant="outline" onClick={() => setStep('qr')}>
                  Back
                </Button>
                <Button
                  fullWidth
                  onClick={handleVerifyCode}
                  loading={isSettingUp}
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Enable
                </Button>
              </div>
            </>
          )}

          {step === 'backup' && backupCodes && (
            <>
              <div className="text-center">
                <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  2FA Enabled Successfully!
                </h3>
                <p className="text-sm text-surface-500 mb-4">
                  Save these backup codes in a secure place
                </p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-surface-700 px-3 py-2 rounded text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  These codes can only be viewed once. Store them securely!
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={copyBackupCodes}
                  leftIcon={copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedCodes ? 'Copied!' : 'Copy Codes'}
                </Button>
                <Button fullWidth onClick={closeSetupModal}>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setPassword('');
          setVerificationCode('');
        }}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Disabling 2FA will make your account less secure
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Enter your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-surface-400" />
                ) : (
                  <Eye className="w-4 h-4 text-surface-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                setShowDisableModal(false);
                setPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={handleDisable}
              loading={isLoading}
              disabled={!password}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Backup Codes Modal */}
      <Modal
        isOpen={showRegenerateModal}
        onClose={() => {
          setShowRegenerateModal(false);
          setVerificationCode('');
        }}
        title="Regenerate Backup Codes"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Enter your 2FA code to generate new backup codes. Your old codes will be
            invalidated.
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="000000"
            className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
          />

          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                setShowRegenerateModal(false);
                setVerificationCode('');
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleRegenerateBackupCodes}
              loading={isLoading}
              disabled={verificationCode.length !== 6}
            >
              Regenerate
            </Button>
          </div>

          {backupCodes && backupCodes.length > 0 && (
            <div className="mt-4 bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                New Backup Codes
              </h4>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-surface-700 px-3 py-2 rounded text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyBackupCodes}
                className="mt-3 w-full"
                leftIcon={copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copiedCodes ? 'Copied!' : 'Copy Codes'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* View Backup Codes Modal */}
      <Modal
        isOpen={showBackupCodesModal}
        onClose={() => setShowBackupCodesModal(false)}
        title="Backup Codes"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            For security reasons, backup codes can only be viewed when first generated.
            If you need new codes, regenerate them.
          </p>

          <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-surface-500" />
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  {backupCodesStatus?.remaining || 0} codes remaining
                </p>
                <p className="text-sm text-surface-500">
                  of {backupCodesStatus?.total || 10} total codes
                </p>
              </div>
            </div>

            {backupCodesStatus && backupCodesStatus.remaining < 3 && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Consider regenerating your backup codes
              </div>
            )}
          </div>

          <Button
            fullWidth
            variant="outline"
            onClick={() => {
              setShowBackupCodesModal(false);
              setShowRegenerateModal(true);
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerate Codes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
