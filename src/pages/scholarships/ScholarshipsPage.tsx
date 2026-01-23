import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  Award,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Sparkles,
  Building2,
  BookOpen,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useScholarshipsStore } from '@/stores/sponsorshipStore';
import type { Scholarship, ScholarshipProgramType } from '@/types/sponsorship';

// Program type labels and icons
const programTypeConfig: Record<ScholarshipProgramType, { label: string; icon: React.ElementType }> = {
  course: { label: 'Course', icon: BookOpen },
  certification: { label: 'Certification', icon: Award },
  degree: { label: 'Degree Program', icon: GraduationCap },
  training: { label: 'Training', icon: Users },
  professional_development: { label: 'Professional Development', icon: Sparkles },
};

function ScholarshipCard({ scholarship, index }: { scholarship: Scholarship; index: number }) {
  const daysLeft = scholarship.applicationDeadline
    ? Math.ceil((new Date(scholarship.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const programConfig = scholarship.programType ? programTypeConfig[scholarship.programType] : null;
  const ProgramIcon = programConfig?.icon || GraduationCap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Cover Image */}
      {scholarship.coverImage ? (
        <div className="h-40 bg-gradient-to-br from-ghana-green/10 to-ghana-gold/10 relative overflow-hidden">
          <img
            src={scholarship.coverImage}
            alt={scholarship.title}
            className="w-full h-full object-cover"
          />
          {scholarship.isFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-ghana-gold text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-ghana-green/10 via-surface-100 to-ghana-gold/10 relative flex items-center justify-center">
          <GraduationCap className="h-16 w-16 text-ghana-green/30" />
          {scholarship.isFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-ghana-gold text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Sponsor Info */}
        {scholarship.sponsor && (
          <div className="flex items-center gap-2 mb-3">
            {scholarship.sponsor.logo ? (
              <img
                src={scholarship.sponsor.logo}
                alt={scholarship.sponsor.name}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 text-text-tertiary" />
            )}
            <span className="text-sm text-text-secondary">{scholarship.sponsor.name}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
          {scholarship.title}
        </h3>

        {/* Short Description */}
        {scholarship.shortDescription && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-4">
            {scholarship.shortDescription}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ghana-green/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-ghana-green" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Amount</p>
              <p className="text-sm font-semibold text-text-primary">
                {scholarship.currency} {scholarship.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <ProgramIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Type</p>
              <p className="text-sm font-semibold text-text-primary">
                {programConfig?.label || 'Program'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Slots</p>
              <p className="text-sm font-semibold text-text-primary">
                {scholarship.currentRecipients}/{scholarship.maxRecipients}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              isExpired ? 'bg-red-100' : isUrgent ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              <Clock className={`h-4 w-4 ${
                isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Deadline</p>
              <p className={`text-sm font-semibold ${
                isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-text-primary'
              }`}>
                {isExpired
                  ? 'Closed'
                  : daysLeft !== null
                    ? `${daysLeft} days left`
                    : 'Open'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/scholarships/${scholarship.slug || scholarship.id}`}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors
            ${isExpired
              ? 'bg-surface-100 text-text-tertiary cursor-not-allowed'
              : 'bg-ghana-green text-white hover:bg-ghana-green/90'
            }
          `}
        >
          {isExpired ? 'View Details' : 'Apply Now'}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function ScholarshipsPage() {
  const {
    scholarships,
    pagination,
    isLoading,
    error,
    fetchScholarships,
  } = useScholarshipsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchScholarships({ status: 'open' });
  }, [fetchScholarships]);

  const filteredScholarships = scholarships.filter((scholarship) => {
    const matchesSearch = searchQuery === '' ||
      scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholarship.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || scholarship.programType === selectedType;

    return matchesSearch && matchesType;
  });

  const featuredScholarships = filteredScholarships.filter(s => s.isFeatured);
  const regularScholarships = filteredScholarships.filter(s => !s.isFeatured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16 px-4 bg-gradient-to-br from-ghana-green via-green-700 to-green-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-4 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-4 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border-4 border-ghana-gold rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-ghana-gold" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Scholarships & Opportunities
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Explore scholarship opportunities sponsored by our partners. Invest in your
              professional development and advance your career in Ghana's public service.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholarships..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-ghana-gold shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Bar */}
      <section className="bg-white border-b border-surface-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-ghana-green hover:bg-ghana-green/5 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/my-scholarships"
                className="inline-flex items-center gap-2 px-4 py-2 bg-ghana-gold text-white rounded-lg hover:bg-ghana-gold/90 transition-colors font-medium text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">My Applications</span>
                <span className="sm:hidden">Applications</span>
              </Link>
              <Link
                to="/sponsors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 text-text-primary rounded-lg hover:bg-surface-200 transition-colors font-medium text-sm"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Our Sponsors</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-10 bg-white border-b border-surface-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {[
              { value: 'all', label: 'All Types' },
              { value: 'course', label: 'Courses' },
              { value: 'certification', label: 'Certifications' },
              { value: 'degree', label: 'Degrees' },
              { value: 'training', label: 'Training' },
              { value: 'professional_development', label: 'Professional Dev' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedType === filter.value
                    ? 'bg-ghana-green text-white'
                    : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green mx-auto mb-4" />
              <p className="text-text-secondary">Loading scholarships...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load</h3>
            <p className="text-text-secondary">{error}</p>
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Scholarships Found</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Check back soon for new opportunities. In the meantime, explore other areas of the platform.'
              }
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </Link>
              <Link
                to="/my-scholarships"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-100 text-text-primary rounded-xl text-sm font-medium hover:bg-surface-200 transition-colors"
              >
                <FileText className="h-4 w-4" />
                View My Applications
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Scholarships */}
            {featuredScholarships.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-5 w-5 text-ghana-gold" />
                  <h2 className="text-xl font-bold text-text-primary">Featured Scholarships</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredScholarships.map((scholarship, index) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* All Scholarships */}
            {regularScholarships.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <GraduationCap className="h-5 w-5 text-ghana-green" />
                  <h2 className="text-xl font-bold text-text-primary">All Scholarships</h2>
                  <span className="text-sm text-text-tertiary">
                    ({regularScholarships.length} available)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularScholarships.map((scholarship, index) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => fetchScholarships({ status: 'open', page: i + 1 })}
                    className={`
                      w-10 h-10 rounded-lg font-medium transition-colors
                      ${pagination.page === i + 1
                        ? 'bg-ghana-green text-white'
                        : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
                      }
                    `}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}
