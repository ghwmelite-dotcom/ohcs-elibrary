import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Loader2,
  Globe,
  Mail,
  User,
  Calendar,
  TrendingUp,
  Award,
  Star,
  Medal,
  Heart,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAdminSponsorshipStore, useTiersStore } from '@/stores/sponsorshipStore';
import type { TierLevel } from '@/types/sponsorship';

const tierIcons: Record<TierLevel, React.ElementType> = {
  platinum: Star,
  gold: Award,
  silver: Medal,
  bronze: Heart,
};

const tierColors: Record<TierLevel, { bg: string; text: string; border: string }> = {
  platinum: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  bronze: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
};

function SponsorFormModal({
  sponsor,
  onClose,
  onSave,
}: {
  sponsor?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const { tiers, fetchTiers } = useTiersStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: sponsor?.name || '',
    slug: sponsor?.slug || '',
    tierId: sponsor?.tierId || '',
    logo: sponsor?.logo || '',
    website: sponsor?.website || '',
    contactEmail: sponsor?.contactEmail || '',
    contactPerson: sponsor?.contactPerson || '',
    description: sponsor?.description || '',
    investmentAmount: sponsor?.investmentAmount || 0,
    startDate: sponsor?.startDate?.split('T')[0] || '',
    endDate: sponsor?.endDate?.split('T')[0] || '',
    status: sponsor?.status || 'active',
  });

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!sponsor && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, sponsor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving sponsor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            {sponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
          </h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {/* Name & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Ghana Commercial Bank"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="e.g., gcb"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            </div>

            {/* Tier & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Sponsorship Tier *
                </label>
                <select
                  value={formData.tierId}
                  onChange={(e) => setFormData({ ...formData, tierId: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                >
                  <option value="">Select Tier</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (GHS {(tier.minInvestment / 1000000).toFixed(1)}M+)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Logo & Website */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Investment Amount (GHS)
              </label>
              <input
                type="number"
                value={formData.investmentAmount}
                onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
              />
            </div>

            {/* Start & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the sponsor organization..."
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-surface-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-surface-200 font-medium hover:bg-surface-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-ghana-green text-white font-medium hover:bg-ghana-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {sponsor ? 'Update Sponsor' : 'Create Sponsor'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminSponsors() {
  const {
    sponsors,
    isLoading,
    fetchSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
  } = useAdminSponsorshipStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);
  const [expandedSponsor, setExpandedSponsor] = useState<string | null>(null);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const filteredSponsors = sponsors.filter((sponsor) => {
    const matchesSearch =
      searchQuery === '' ||
      sponsor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.slug?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sponsor.status === statusFilter;
    const matchesTier = tierFilter === 'all' || sponsor.tier?.slug === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const stats = {
    total: sponsors.length,
    active: sponsors.filter((s) => s.status === 'active').length,
    pending: sponsors.filter((s) => s.status === 'pending').length,
    totalInvestment: sponsors.reduce((sum, s) => sum + (s.investmentAmount || 0), 0),
  };

  const handleSave = async (data: any) => {
    if (editingSponsor) {
      await updateSponsor(editingSponsor.id, data);
    } else {
      await createSponsor(data);
    }
    fetchSponsors();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
      await deleteSponsor(id);
      fetchSponsors();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Building2 className="h-7 w-7 text-ghana-gold" />
            Manage Sponsors
          </h1>
          <p className="text-text-secondary mt-1">
            Add, edit, and manage sponsor organizations
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSponsor(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Sponsor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sponsors', value: stats.total, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending', value: stats.pending, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Total Investment', value: `GHS ${(stats.totalInvestment / 1000000).toFixed(1)}M`, icon: Award, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-surface-200"
          >
            <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sponsors..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
          >
            <option value="all">All Tiers</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>
      </div>

      {/* Sponsors List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
          </div>
        ) : filteredSponsors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-surface-200">
            <Building2 className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No sponsors found</p>
            <button
              onClick={() => {
                setEditingSponsor(null);
                setShowForm(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add First Sponsor
            </button>
          </div>
        ) : (
          filteredSponsors.map((sponsor, index) => {
            const tierSlug = (sponsor.tier?.slug || 'bronze') as TierLevel;
            const TierIcon = tierIcons[tierSlug] || Heart;
            const tierColor = tierColors[tierSlug] || tierColors.bronze;

            return (
              <motion.div
                key={sponsor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
              >
                <div
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSponsor(expandedSponsor === sponsor.id ? null : sponsor.id)}
                >
                  <div className="flex items-center gap-4">
                    {sponsor.logo ? (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="h-14 w-14 rounded-xl object-contain bg-surface-50 p-2"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-ghana-green/10 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-ghana-green" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-text-primary">{sponsor.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColor.bg} ${tierColor.text}`}>
                          <TierIcon className="h-3 w-3" />
                          {sponsor.tier?.name || 'Bronze'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sponsor.status === 'active' ? 'bg-green-100 text-green-600' :
                          sponsor.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {sponsor.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                        {sponsor.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {sponsor.website.replace(/^https?:\/\//, '')}
                          </span>
                        )}
                        {sponsor.investmentAmount > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            GHS {sponsor.investmentAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSponsor(sponsor);
                        setShowForm(true);
                      }}
                      className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
                    >
                      <Edit className="h-5 w-5 text-text-secondary" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sponsor.id);
                      }}
                      className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                    <ChevronDown
                      className={`h-5 w-5 text-text-tertiary transition-transform ${
                        expandedSponsor === sponsor.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSponsor === sponsor.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-surface-200 overflow-hidden"
                    >
                      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <label className="text-xs text-text-tertiary">Contact Person</label>
                          <p className="font-medium flex items-center gap-1">
                            <User className="h-4 w-4 text-text-tertiary" />
                            {sponsor.contactPerson || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">Contact Email</label>
                          <p className="font-medium flex items-center gap-1">
                            <Mail className="h-4 w-4 text-text-tertiary" />
                            {sponsor.contactEmail || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">Start Date</label>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-text-tertiary" />
                            {sponsor.startDate
                              ? new Date(sponsor.startDate).toLocaleDateString()
                              : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">End Date</label>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-text-tertiary" />
                            {sponsor.endDate
                              ? new Date(sponsor.endDate).toLocaleDateString()
                              : 'Ongoing'}
                          </p>
                        </div>
                        {sponsor.description && (
                          <div className="col-span-full">
                            <label className="text-xs text-text-tertiary">Description</label>
                            <p className="text-text-secondary mt-1">{sponsor.description}</p>
                          </div>
                        )}
                        <div className="col-span-full flex gap-3">
                          {sponsor.website && (
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Visit Website
                            </a>
                          )}
                          <a
                            href={`/sponsors`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-ghana-green/10 text-ghana-green rounded-lg text-sm font-medium hover:bg-ghana-green/20 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Public Profile
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <SponsorFormModal
            sponsor={editingSponsor}
            onClose={() => {
              setShowForm(false);
              setEditingSponsor(null);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
