import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Users,
  Lock,
  Shield,
  Camera,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupData) => void;
  isSubmitting?: boolean;
}

interface CreateGroupData {
  name: string;
  description: string;
  type: 'open' | 'closed' | 'private';
  coverColor: string;
}

const GROUP_TYPES = [
  {
    value: 'open',
    label: 'Open',
    description: 'Anyone can join and see posts',
    icon: Globe,
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Request to join, posts visible to members',
    icon: Users,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Invite only, hidden from search',
    icon: Lock,
  },
];

const COVER_COLORS = [
  '#006B3F', // Ghana Green
  '#CE1126', // Ghana Red
  '#FCD116', // Ghana Gold
  '#1E40AF', // Blue
  '#7C3AED', // Purple
  '#059669', // Teal
  '#EA580C', // Orange
  '#DB2777', // Pink
];

export function CreateGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'open' | 'closed' | 'private'>('open');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, description, type, coverColor });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setType('open');
    setCoverColor(COVER_COLORS[0]);
    setStep(1);
    onClose();
  };

  const canProceed = step === 1 ? name.trim().length >= 3 : true;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
      size="md"
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step >= s ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Cover Color */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Cover Color
              </label>
              <div
                className="h-24 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: coverColor }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {name ? name.charAt(0).toUpperCase() : 'G'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCoverColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      coverColor === color && 'ring-2 ring-offset-2 ring-primary-500'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Group Name */}
            <Input
              label="Group Name"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              helperText="Minimum 3 characters"
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Description (optional)
              </label>
              <textarea
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'resize-none h-24'
                )}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Choose who can find and join this group
            </p>

            <div className="space-y-3">
              {GROUP_TYPES.map((groupType) => (
                <button
                  key={groupType.value}
                  onClick={() => setType(groupType.value as 'open' | 'closed' | 'private')}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-colors text-left',
                    type === groupType.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      type === groupType.value
                        ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                    )}
                  >
                    <groupType.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        'font-medium',
                        type === groupType.value
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-surface-900 dark:text-surface-50'
                      )}
                    >
                      {groupType.label}
                    </p>
                    <p className="text-sm text-surface-500">{groupType.description}</p>
                  </div>
                  {type === groupType.value && (
                    <Check className="w-5 h-5 text-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!name.trim()}
            >
              Create Group
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
