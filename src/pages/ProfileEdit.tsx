import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Camera,
  Briefcase,
  MapPin,
  Link as LinkIcon,
  Save,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    title: user?.title || '',
    department: user?.department || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    interests: user?.interests || [],
    socialLinks: {
      linkedin: user?.socialLinks?.linkedin || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      website: user?.socialLinks?.website || '',
    },
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        title: formData.title,
        department: formData.department,
        bio: formData.bio,
        skills: formData.skills,
        interests: formData.interests,
        socialLinks: formData.socialLinks,
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
              Edit Profile
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Update your personal information and preferences
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/profile')}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Profile Photo
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size="xl"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                  Upload a new profile photo
                </p>
                <Button variant="outline" size="sm" type="button">
                  Choose File
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Display Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'resize-none'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="primary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => removeInterest(interest)}
                >
                  {interest}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addInterest}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Social Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="LinkedIn"
                placeholder="https://linkedin.com/in/username"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
              />
              <Input
                label="Twitter"
                placeholder="https://twitter.com/username"
                value={formData.socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
              />
              <Input
                label="GitHub"
                placeholder="https://github.com/username"
                value={formData.socialLinks.github}
                onChange={(e) => handleSocialLinkChange('github', e.target.value)}
              />
              <Input
                label="Website"
                placeholder="https://yourwebsite.com"
                value={formData.socialLinks.website}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
