import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Bookmark, Clock, TrendingUp } from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { CategoryFilter, DocumentGrid, DocumentUpload } from '@/components/library';
import { Button } from '@/components/shared/Button';
import { Tabs } from '@/components/shared/Tabs';

export default function Library() {
  const { fetchDocuments, fetchCategories, isLoading } = useLibraryStore();
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [fetchDocuments, fetchCategories]);

  const tabs = [
    { id: 'all', label: 'All Documents', icon: BookOpen },
    { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
    { id: 'recent', label: 'Recently Viewed', icon: Clock },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
            Document Library
          </h1>
          <p className="mt-1 text-surface-600 dark:text-surface-400">
            Access official documents, policies, and training materials
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          leftIcon={<Upload className="w-5 h-5" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Documents"
          value="2,450"
          change="+124 this month"
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          label="Your Bookmarks"
          value="48"
          change="12 new this week"
          icon={Bookmark}
          color="secondary"
        />
        <StatCard
          label="Recently Viewed"
          value="23"
          change="Last viewed 2h ago"
          icon={Clock}
          color="accent"
        />
        <StatCard
          label="Trending Now"
          value="15"
          change="Most popular today"
          icon={TrendingUp}
          color="success"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: <tab.icon className="w-4 h-4" />,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <CategoryFilter />

          {/* Quick Links */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Civil Service Regulations
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Code of Conduct
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Training Manual 2024
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  HR Policies
                </a>
              </li>
            </ul>
          </div>

          {/* AI Assistant Promo */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">&#10024;</span>
            </div>
            <h4 className="font-semibold mb-2">AI Document Analysis</h4>
            <p className="text-sm text-primary-100 mb-4">
              Get instant summaries, key points, and insights from any document using
              our AI assistant.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Learn More
            </Button>
          </div>
        </div>

        {/* Document Grid */}
        <div className="lg:col-span-3">
          <DocumentGrid />
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUpload isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'secondary' | 'accent' | 'success';
}

function StatCard({ label, value, change, icon: Icon, color }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary:
      'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    accent: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">
            {value}
          </p>
          <p className="text-xs text-surface-400 mt-1">{change}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
