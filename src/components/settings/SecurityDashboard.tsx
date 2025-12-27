import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Key,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Check,
  X,
  AlertTriangle,
  QrCode,
  Eye,
  EyeOff,
  RefreshCw,
  MapPin,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import type { Session, TwoFactorStatus, TwoFactorSetup } from '@/stores/settingsStore';
import QRCode from 'qrcode';

interface SecurityDashboardProps {
  sessions: Session[];
  twoFactor: TwoFactorStatus | null;
  isSessionsLoading: boolean;
  is2FALoading: boolean;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onRevokeAllSessions: () => Promise<void>;
  onInitialize2FA: () => Promise<TwoFactorSetup>;
  onVerify2FA: (code: string) => Promise<string[]>;
  onDisable2FA: (code: string) => Promise<void>;
  onChangePassword: (current: string, newPass: string) => Promise<void>;
}

// Password Strength Meter
function PasswordStrengthMeter({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 5);
  };

  const strength = getStrength();
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['bg-error-500', 'bg-error-400', 'bg-warning-500', 'bg-warning-400', 'bg-success-400', 'bg-success-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < strength ? colors[strength] : 'bg-surface-200 dark:bg-surface-700'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-xs',
        strength < 2 ? 'text-error-500' : strength < 4 ? 'text-warning-500' : 'text-success-500'
      )}>
        {labels[strength]}
      </p>
    </div>
  );
}

// Device Icon Component
function DeviceIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className={className} />;
    case 'tablet':
      return <Tablet className={className} />;
    case 'desktop':
    default:
      return <Monitor className={className} />;
  }
}

export function SecurityDashboard({
  sessions,
  twoFactor,
  isSessionsLoading,
  is2FALoading,
  onRevokeSession,
  onRevokeAllSessions,
  onInitialize2FA,
  onVerify2FA,
  onDisable2FA,
  onChangePassword
}: SecurityDashboardProps) {
  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [is2FAError, setIs2FAError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  // Sessions state
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Generate QR code when setup is initialized
  useEffect(() => {
    if (twoFactorSetup?.otpauthUrl) {
      QRCode.toDataURL(twoFactorSetup.otpauthUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [twoFactorSetup]);

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInitialize2FA = async () => {
    setIs2FAError('');
    try {
      const setup = await onInitialize2FA();
      setTwoFactorSetup(setup);
      setIs2FAModalOpen(true);
    } catch (error: any) {
      console.error('Failed to initialize 2FA:', error);
      setIs2FAError(error.message || 'Failed to initialize 2FA. Please try again.');
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) return;

    setIsVerifying(true);
    setIs2FAError('');

    try {
      const codes = await onVerify2FA(verificationCode);
      setBackupCodes(codes);
    } catch (error: any) {
      setIs2FAError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) return;

    setIsVerifying(true);
    setIs2FAError('');

    try {
      await onDisable2FA(disableCode);
      setShowDisable2FA(false);
      setDisableCode('');
    } catch (error: any) {
      setIs2FAError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      await onRevokeSession(sessionId);
    } finally {
      setRevokingSession(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Password</h3>
              <p className="text-sm text-surface-500">Change your account password</p>
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              twoFactor?.isEnabled
                ? 'bg-success-100 dark:bg-success-900/30'
                : 'bg-surface-100 dark:bg-surface-700'
            )}>
              {twoFactor?.isEnabled ? (
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
                {twoFactor?.isEnabled
                  ? `Enabled • ${twoFactor.backupCodesRemaining} backup codes remaining`
                  : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          {twoFactor?.isEnabled ? (
            <button
              onClick={() => setShowDisable2FA(true)}
              className="px-4 py-2 border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 font-medium rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleInitialize2FA}
              disabled={is2FALoading}
              className="px-4 py-2 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
            >
              {is2FALoading ? 'Loading...' : 'Enable 2FA'}
            </button>
          )}
        </div>

        {/* Error message for 2FA initialization */}
        {is2FAError && !is2FAModalOpen && !showDisable2FA && (
          <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error-700 dark:text-error-300">
                  Failed to enable 2FA
                </p>
                <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                  {is2FAError}
                </p>
              </div>
            </div>
          </div>
        )}

        {twoFactor?.isEnabled && (
          <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-success-700 dark:text-success-300">
                  Your account is protected
                </p>
                <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                  Enabled on {twoFactor.enabledAt ? new Date(twoFactor.enabledAt).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Active Sessions</h3>
              <p className="text-sm text-surface-500">{sessions.length} active sessions</p>
            </div>
          </div>
          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <button
              onClick={onRevokeAllSessions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out all others
            </button>
          )}
        </div>

        {isSessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-surface-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                className={cn(
                  'border rounded-xl overflow-hidden transition-colors',
                  session.isCurrent
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-surface-200 dark:border-surface-700'
                )}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      session.isCurrent
                        ? 'bg-primary-100 dark:bg-primary-900/30'
                        : 'bg-surface-100 dark:bg-surface-700'
                    )}>
                      <DeviceIcon
                        type={session.deviceType}
                        className={cn(
                          'w-5 h-5',
                          session.isCurrent
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-surface-500'
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-surface-900 dark:text-white">
                          {session.deviceName}
                        </p>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                            This device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <span>{session.browser} on {session.os}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(session.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!session.isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevokeSession(session.id);
                        }}
                        disabled={revokingSession === session.id}
                        className="p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                      >
                        {revokingSession === session.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {expandedSession === session.id ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSession === session.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-surface-200 dark:border-surface-700">
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-400">
                              {session.location || 'Unknown location'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-400">
                              Started {formatRelativeTime(session.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-400">
                              {session.browser} {session.browserVersion}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-400">
                              IP: {session.ipAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Change Password
                </h3>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-error-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !backupCodes && setIs2FAModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {!backupCodes ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                      Set Up Two-Factor Authentication
                    </h3>
                    <button
                      onClick={() => setIs2FAModalOpen(false)}
                      className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-surface-500" />
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                      Scan this QR code with your authenticator app
                    </p>
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto rounded-lg" />
                    ) : (
                      <div className="w-[200px] h-[200px] mx-auto bg-surface-100 dark:bg-surface-700 rounded-lg flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-surface-400" />
                      </div>
                    )}
                    {twoFactorSetup?.secret && (
                      <div className="mt-4">
                        <p className="text-xs text-surface-500 mb-1">Or enter this code manually:</p>
                        <div className="flex items-center justify-center gap-2">
                          <code className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded font-mono text-sm">
                            {twoFactorSetup.secret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(twoFactorSetup.secret)}
                            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                          >
                            {copiedCode === twoFactorSetup.secret ? (
                              <Check className="w-4 h-4 text-success-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-surface-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Enter 6-digit code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {is2FAError && (
                      <div className="flex items-center gap-2 text-error-500 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {is2FAError}
                      </div>
                    )}

                    <button
                      onClick={handleVerify2FA}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="w-full px-4 py-2.5 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-success-600 dark:text-success-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                      Two-Factor Authentication Enabled!
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Save these backup codes in a safe place. You'll need them if you lose access to your authenticator app.
                    </p>
                  </div>

                  <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 bg-white dark:bg-surface-800 rounded-lg"
                        >
                          <code className="font-mono text-sm">{code}</code>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                          >
                            {copiedCode === code ? (
                              <Check className="w-3 h-3 text-success-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-surface-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All Codes
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIs2FAModalOpen(false);
                      setBackupCodes(null);
                      setTwoFactorSetup(null);
                      setVerificationCode('');
                    }}
                    className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disable 2FA Modal */}
      <AnimatePresence>
        {showDisable2FA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDisable2FA(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-error-600 dark:text-error-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  Disable Two-Factor Authentication?
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  This will make your account less secure. Enter your authentication code to confirm.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />

                {is2FAError && (
                  <div className="flex items-center gap-2 text-error-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {is2FAError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDisable2FA(false);
                      setDisableCode('');
                      setIs2FAError('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={isVerifying || disableCode.length !== 6}
                    className="flex-1 px-4 py-2.5 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
                  >
                    {isVerifying ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
