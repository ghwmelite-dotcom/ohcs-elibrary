import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Search,
  Book,
  MessageSquare,
  FileText,
  Users,
  Award,
  Settings,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: Book },
    { id: 'library', name: 'Document Library', icon: FileText },
    { id: 'forum', name: 'Forum & Community', icon: MessageSquare },
    { id: 'groups', name: 'Groups', icon: Users },
    { id: 'gamification', name: 'XP & Badges', icon: Award },
    { id: 'account', name: 'Account Settings', icon: Settings },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How do I register for an account?',
      answer: 'Only users with a valid .gov.gh email address can register. Visit the registration page, enter your government email, create a strong password, and verify your email through the link sent to you.',
      category: 'getting-started',
    },
    {
      question: 'How do I upload a document?',
      answer: 'Navigate to the Document Library, click "Upload Document", select your file (PDF, DOC, or DOCX), fill in the required metadata (title, category, access level), and submit. Your document will be reviewed before publishing.',
      category: 'library',
    },
    {
      question: 'What are the document access levels?',
      answer: 'Documents can be: Public (visible to all), Internal (civil servants only), Restricted (specific MDAs), Confidential (approved users only), or Secret (highest clearance required).',
      category: 'library',
    },
    {
      question: 'How do I create a forum topic?',
      answer: 'Go to the Forum, select a category, and click "New Topic". Add a descriptive title and your post content. You can use markdown formatting and attach images.',
      category: 'forum',
    },
    {
      question: 'How do I earn XP and level up?',
      answer: 'Earn XP by: logging in daily (50 XP), reading documents (25 XP), uploading documents (100 XP), posting in forums (30 XP), receiving upvotes (15 XP), and earning badges (50-500 XP).',
      category: 'gamification',
    },
    {
      question: 'What are the different badge rarities?',
      answer: 'Badges come in five rarities: Common (gray), Uncommon (green), Rare (blue), Epic (purple), and Legendary (gold). Higher rarity badges are harder to earn but give more XP.',
      category: 'gamification',
    },
    {
      question: 'How do I join a group?',
      answer: 'Browse available groups in the Groups section. For open groups, click "Join". For closed groups, click "Request to Join" and wait for admin approval. Private groups are invite-only.',
      category: 'groups',
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Settings > Security > Change Password. Enter your current password and your new password (minimum 12 characters with uppercase, lowercase, numbers, and special characters).',
      category: 'account',
    },
    {
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Settings > Security > Two-Factor Authentication. Click "Enable 2FA" and scan the QR code with your authenticator app. Enter the verification code to complete setup.',
      category: 'account',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes, go to Settings > Data & Storage > Export Your Data. Click "Request Data Export" and you\'ll receive a download link via email within 24 hours.',
      category: 'account',
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch = searchQuery
      ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory ? faq.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            How can we help you?
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Search our knowledge base or browse categories below
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 shadow-sm'
              )}
            >
              <category.icon className="w-6 h-6" />
              <span className="text-sm font-medium text-center">{category.name}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {filteredFAQs.length === 0 ? (
              <div className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-600 dark:text-surface-400">
                  No results found. Try a different search term.
                </p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => setExpandedFAQ(
                      expandedFAQ === faq.question ? null : faq.question
                    )}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <span className="font-medium text-surface-900 dark:text-surface-50 pr-4">
                      {faq.question}
                    </span>
                    {expandedFAQ === faq.question ? (
                      <ChevronDown className="w-5 h-5 text-surface-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-surface-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === faq.question && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-surface-600 dark:text-surface-400 pl-0 border-l-2 border-primary-600 pl-4">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-2">Need more help?</h3>
            <p className="text-primary-100 mb-4">
              Our support team is here to assist you with any questions.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@ohcs.gov.gh"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Mail className="w-4 h-4" />
                support@ohcs.gov.gh
              </a>
              <a
                href="tel:+233302000000"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Phone className="w-4 h-4" />
                +233 30 200 0000
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-50 mb-2">
              Additional Resources
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'User Guide (PDF)', link: '#' },
                { label: 'Video Tutorials', link: '#' },
                { label: 'API Documentation', link: '#' },
                { label: 'Release Notes', link: '#' },
              ].map((resource) => (
                <li key={resource.label}>
                  <a
                    href={resource.link}
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {resource.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
