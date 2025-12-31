import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900" />
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{ background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)' }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-25 dark:opacity-15"
        style={{ background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)' }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function AdminAudit() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
              Audit Logs
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Track all system activity and security events
            </p>
          </div>
        </div>

        {/* Audit Log Viewer Component */}
        <AuditLogViewer />
      </div>
    </div>
  );
}
