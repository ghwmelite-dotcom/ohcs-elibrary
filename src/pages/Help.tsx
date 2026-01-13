import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  ExternalLink,
  Play,
  Keyboard,
  Lightbulb,
  Rocket,
  Shield,
  Upload,
  MessageCircle,
  Bell,
  Zap,
  CheckCircle2,
  Circle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Video,
  Headphones,
  Clock,
  TrendingUp,
  Star,
  Gift,
  Target,
  Compass,
  Map,
  Flag,
  Trophy,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Timer,
  GraduationCap,
  Palette,
  Globe,
  Lock,
  UserPlus,
  FileUp,
  MessagesSquare,
  BarChart3,
  Calendar
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  views: number;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  steps: string[];
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  views: number;
}

interface ShortcutCategory {
  name: string;
  shortcuts: { keys: string[]; description: string }[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [-5, 5, -5],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'guides' | 'faq' | 'videos' | 'shortcuts'>('guides');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  // Categories with icons and colors
  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: Rocket, color: 'from-green-500 to-emerald-600', count: 12 },
    { id: 'library', name: 'Document Library', icon: FileText, color: 'from-blue-500 to-cyan-600', count: 18 },
    { id: 'forum', name: 'Forum & Community', icon: MessageSquare, color: 'from-purple-500 to-violet-600', count: 15 },
    { id: 'groups', name: 'Groups', icon: Users, color: 'from-orange-500 to-amber-600', count: 10 },
    { id: 'gamification', name: 'XP & Badges', icon: Award, color: 'from-yellow-500 to-orange-600', count: 14 },
    { id: 'security', name: 'Security & Privacy', icon: Shield, color: 'from-red-500 to-pink-600', count: 8 },
  ];

  // Quick actions
  const quickActions = [
    { icon: Upload, label: 'Upload Document', description: 'Share knowledge with your colleagues', link: '/library', color: 'bg-blue-500' },
    { icon: MessageCircle, label: 'Start Discussion', description: 'Create a new forum topic', link: '/forum', color: 'bg-purple-500' },
    { icon: Users, label: 'Join a Group', description: 'Connect with your MDA', link: '/groups', color: 'bg-orange-500' },
    { icon: Trophy, label: 'View Leaderboard', description: 'See top contributors', link: '/leaderboard', color: 'bg-yellow-500' },
    { icon: Bell, label: 'Manage Notifications', description: 'Customize your alerts', link: '/notifications', color: 'bg-pink-500' },
    { icon: Settings, label: 'Account Settings', description: 'Update your profile', link: '/settings', color: 'bg-surface-500 dark:bg-surface-600' },
  ];

  // Featured guides
  const guides: Guide[] = [
    {
      id: 'onboarding',
      title: 'Complete Your Profile',
      description: 'Set up your account for the best experience',
      icon: UserPlus,
      color: 'from-green-500 to-emerald-600',
      steps: [
        'Upload a professional profile photo',
        'Add your job title and MDA',
        'Write a brief bio',
        'Set your notification preferences',
        'Enable two-factor authentication'
      ],
      duration: '5 min',
      difficulty: 'Beginner'
    },
    {
      id: 'documents',
      title: 'Mastering the Library',
      description: 'Learn to upload, search, and manage documents',
      icon: FileUp,
      color: 'from-blue-500 to-cyan-600',
      steps: [
        'Navigate to the Document Library',
        'Click "Upload Document" button',
        'Select your file (PDF, DOC, DOCX)',
        'Fill in title, category, and description',
        'Set appropriate access level',
        'Add relevant tags for discoverability',
        'Submit for review'
      ],
      duration: '10 min',
      difficulty: 'Beginner'
    },
    {
      id: 'forum',
      title: 'Engaging in Discussions',
      description: 'Participate effectively in the community forum',
      icon: MessagesSquare,
      color: 'from-purple-500 to-violet-600',
      steps: [
        'Browse forum categories',
        'Read community guidelines',
        'Create your first topic with a clear title',
        'Use markdown for formatting',
        'Reply to and upvote helpful posts',
        'Earn XP through engagement'
      ],
      duration: '8 min',
      difficulty: 'Beginner'
    },
    {
      id: 'gamification',
      title: 'Earning XP & Badges',
      description: 'Maximize your rewards and climb the leaderboard',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-600',
      steps: [
        'Understand the XP system',
        'Complete daily login streaks',
        'Engage with documents and forum',
        'Earn your first badge',
        'Track progress on leaderboard',
        'Unlock legendary achievements'
      ],
      duration: '7 min',
      difficulty: 'Intermediate'
    },
    {
      id: 'security',
      title: 'Securing Your Account',
      description: 'Protect your account with best practices',
      icon: Shield,
      color: 'from-red-500 to-pink-600',
      steps: [
        'Create a strong password (12+ characters)',
        'Enable two-factor authentication',
        'Review active sessions regularly',
        'Set up backup codes',
        'Configure privacy settings',
        'Monitor account activity'
      ],
      duration: '6 min',
      difficulty: 'Intermediate'
    },
    {
      id: 'advanced',
      title: 'Advanced Search Techniques',
      description: 'Find exactly what you need, faster',
      icon: Search,
      color: 'from-indigo-500 to-purple-600',
      steps: [
        'Use quotation marks for exact phrases',
        'Filter by document type and date',
        'Search within specific categories',
        'Use AI-powered summaries',
        'Save searches for quick access',
        'Set up search alerts'
      ],
      duration: '5 min',
      difficulty: 'Advanced'
    }
  ];

  // Video tutorials
  const videoTutorials: VideoTutorial[] = [
    { id: 'v1', title: 'Platform Overview', description: 'A complete tour of the OHCS E-Library', duration: '5:30', thumbnail: '/thumbnails/overview.jpg', category: 'Getting Started', views: 1250 },
    { id: 'v2', title: 'Uploading Your First Document', description: 'Step-by-step document upload guide', duration: '3:45', thumbnail: '/thumbnails/upload.jpg', category: 'Documents', views: 890 },
    { id: 'v3', title: 'Forum Best Practices', description: 'How to engage effectively in discussions', duration: '4:20', thumbnail: '/thumbnails/forum.jpg', category: 'Community', views: 650 },
    { id: 'v4', title: 'Setting Up 2FA', description: 'Secure your account with two-factor auth', duration: '2:15', thumbnail: '/thumbnails/2fa.jpg', category: 'Security', views: 1100 },
    { id: 'v5', title: 'Earning Badges & XP', description: 'Gamification features explained', duration: '6:00', thumbnail: '/thumbnails/gamification.jpg', category: 'Gamification', views: 780 },
    { id: 'v6', title: 'AI-Powered Search', description: 'Using AI to find documents faster', duration: '3:30', thumbnail: '/thumbnails/ai-search.jpg', category: 'Advanced', views: 520 },
  ];

  // Keyboard shortcuts
  const shortcutCategories: ShortcutCategory[] = [
    {
      name: 'Navigation',
      shortcuts: [
        { keys: ['G', 'H'], description: 'Go to Dashboard' },
        { keys: ['G', 'L'], description: 'Go to Library' },
        { keys: ['G', 'F'], description: 'Go to Forum' },
        { keys: ['G', 'C'], description: 'Go to Chat' },
        { keys: ['G', 'G'], description: 'Go to Groups' },
        { keys: ['G', 'S'], description: 'Go to Settings' },
      ]
    },
    {
      name: 'General',
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Open Search' },
        { keys: ['Ctrl', 'B'], description: 'Toggle Sidebar' },
        { keys: ['?'], description: 'Show Shortcuts' },
        { keys: ['Esc'], description: 'Close Modal/Cancel' },
        { keys: ['Ctrl', 'Shift', 'T'], description: 'Toggle Theme' },
      ]
    },
    {
      name: 'Documents',
      shortcuts: [
        { keys: ['N'], description: 'New Document' },
        { keys: ['Ctrl', 'D'], description: 'Download Document' },
        { keys: ['+'], description: 'Zoom In' },
        { keys: ['-'], description: 'Zoom Out' },
        { keys: ['0'], description: 'Reset Zoom' },
      ]
    },
    {
      name: 'Forum',
      shortcuts: [
        { keys: ['C'], description: 'Create New Post' },
        { keys: ['R'], description: 'Reply to Post' },
        { keys: ['U'], description: 'Upvote' },
        { keys: ['B'], description: 'Bookmark' },
      ]
    },
    {
      name: 'Chat',
      shortcuts: [
        { keys: ['M'], description: 'Focus Message Input' },
        { keys: ['E'], description: 'Toggle Emoji Picker' },
        { keys: ['Enter'], description: 'Send Message' },
      ]
    }
  ];

  // FAQs
  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How do I register for an account?',
      answer: 'Only users with a valid .gov.gh email address can register. Visit the registration page, enter your government email, create a strong password (minimum 12 characters with uppercase, lowercase, numbers, and special characters), and verify your email through the link sent to you. Registration is typically approved within 24 hours.',
      category: 'getting-started',
      helpful: 156,
      notHelpful: 8,
      views: 2340
    },
    {
      id: 'faq-2',
      question: 'How do I upload a document?',
      answer: 'Navigate to the Document Library and click "Upload Document". Select your file (supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX). Fill in the required metadata including title, category, description, and access level. Add relevant tags to improve discoverability. Submit for review - most documents are approved within 48 hours.',
      category: 'library',
      helpful: 234,
      notHelpful: 12,
      views: 4560
    },
    {
      id: 'faq-3',
      question: 'What are the document access levels?',
      answer: 'Documents have five access levels: Public (visible to all users), Internal (civil servants only), Restricted (specific MDAs only), Confidential (approved users with clearance), and Secret (highest security clearance required). Your access level determines which documents you can view and upload.',
      category: 'library',
      helpful: 189,
      notHelpful: 5,
      views: 3210
    },
    {
      id: 'faq-4',
      question: 'How do I create a forum topic?',
      answer: 'Go to the Forum section, select an appropriate category for your topic, and click "New Topic". Write a descriptive title that summarizes your question or discussion. Use the rich text editor to format your post - you can add images, code blocks, and links. Preview before posting and submit.',
      category: 'forum',
      helpful: 145,
      notHelpful: 7,
      views: 2890
    },
    {
      id: 'faq-5',
      question: 'How do I earn XP and level up?',
      answer: 'Earn XP through various activities: Daily login (50 XP), Reading documents (25 XP each), Uploading documents (100 XP), Forum posts (30 XP), Receiving upvotes (15 XP each), Earning badges (50-500 XP depending on rarity). Maintain login streaks for bonus XP. Level up by accumulating XP - each level requires more XP than the previous.',
      category: 'gamification',
      helpful: 312,
      notHelpful: 15,
      views: 5670
    },
    {
      id: 'faq-6',
      question: 'What are the different badge rarities?',
      answer: 'Badges come in five rarities: Common (gray border, basic achievements), Uncommon (green border, moderate achievements), Rare (blue border, significant milestones), Epic (purple border, exceptional accomplishments), and Legendary (gold animated border, the rarest achievements). Higher rarity badges grant more XP and prestige.',
      category: 'gamification',
      helpful: 198,
      notHelpful: 9,
      views: 3450
    },
    {
      id: 'faq-7',
      question: 'How do I join a group?',
      answer: 'Browse available groups in the Groups section. Groups have three privacy types: Open (join instantly), Closed (request approval from admin), and Private (invite-only). For open groups, click "Join". For closed groups, click "Request to Join" and wait for admin approval. You can search for groups by MDA, topic, or name.',
      category: 'groups',
      helpful: 167,
      notHelpful: 6,
      views: 2780
    },
    {
      id: 'faq-8',
      question: 'How do I change my password?',
      answer: 'Go to Settings > Security > Change Password. Enter your current password for verification, then enter your new password. Requirements: minimum 12 characters, at least one uppercase letter, one lowercase letter, one number, and one special character. After changing, all other sessions will be logged out for security.',
      category: 'security',
      helpful: 223,
      notHelpful: 11,
      views: 4120
    },
    {
      id: 'faq-9',
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Settings > Security > Two-Factor Authentication. Click "Enable 2FA" to generate a QR code. Scan this code with your authenticator app (Google Authenticator, Authy, etc.). Enter the 6-digit verification code from your app to confirm. Save your backup codes in a secure location for account recovery.',
      category: 'security',
      helpful: 278,
      notHelpful: 14,
      views: 4890
    },
    {
      id: 'faq-10',
      question: 'Can I export my data?',
      answer: 'Yes, go to Settings > Data & Storage > Export Your Data. You can export your profile, documents, forum posts, and activity history. Select the data types you want to export and choose the format (JSON or ZIP). Your export will be ready for download within minutes. Exports are available for 7 days.',
      category: 'security',
      helpful: 134,
      notHelpful: 4,
      views: 1890
    },
    {
      id: 'faq-11',
      question: 'How do I use the AI-powered search?',
      answer: 'The AI search understands natural language queries. Simply type what you are looking for in plain English, like "circulars about leave policy from 2023". The AI will analyze your query, search across all documents, and provide relevant results with AI-generated summaries. You can also ask follow-up questions.',
      category: 'library',
      helpful: 189,
      notHelpful: 8,
      views: 2340
    },
    {
      id: 'faq-12',
      question: 'What happens when I reach a new level?',
      answer: 'When you accumulate enough XP to reach a new level, you unlock: a new profile badge showing your level, access to level-restricted features, a spot on the leaderboard, and sometimes exclusive badges. Higher levels also increase your reputation and visibility in the community.',
      category: 'gamification',
      helpful: 156,
      notHelpful: 6,
      views: 2100
    }
  ];

  // What's New items
  const whatsNew = [
    { date: 'Dec 2024', title: 'AI Document Summaries', description: 'Get instant AI-powered summaries of any document', icon: Sparkles, type: 'feature' },
    { date: 'Dec 2024', title: 'Enhanced Leaderboard', description: 'New MDA comparison and activity heatmap', icon: BarChart3, type: 'improvement' },
    { date: 'Nov 2024', title: 'Voice Messages in Chat', description: 'Record and send voice messages in group chats', icon: Headphones, type: 'feature' },
    { date: 'Nov 2024', title: 'Dark Mode Improvements', description: 'Better contrast and eye-friendly dark theme', icon: Palette, type: 'improvement' },
    { date: 'Oct 2024', title: 'Two-Factor Authentication', description: 'Secure your account with 2FA', icon: Shield, type: 'security' },
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch = searchQuery
        ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = selectedCategory ? faq.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Search suggestions
  const searchSuggestions = [
    'How to upload documents',
    'Enable two-factor authentication',
    'Earn XP and badges',
    'Join a group',
    'Reset password',
    'Document access levels'
  ];

  // Handle copy link
  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/help#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Handle helpful vote
  const handleVote = (id: string, vote: 'up' | 'down') => {
    setHelpfulVotes(prev => ({
      ...prev,
      [id]: prev[id] === vote ? null : vote
    }));
  };

  // Toggle step completion
  const toggleStep = (guideId: string, stepIndex: number) => {
    setCompletedSteps(prev => {
      const current = prev[guideId] || [];
      if (current.includes(stepIndex)) {
        return { ...prev, [guideId]: current.filter(i => i !== stepIndex) };
      }
      return { ...prev, [guideId]: [...current, stepIndex] };
    });
  };

  // Calculate guide progress
  const getGuideProgress = (guideId: string, totalSteps: number) => {
    const completed = completedSteps[guideId]?.length || 0;
    return Math.round((completed / totalSteps) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 dark:from-primary-800 dark:via-primary-900 dark:to-secondary-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: '2s' }}
            className="absolute top-40 right-20 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: '4s' }}
            className="absolute bottom-20 left-1/3 w-24 h-24 bg-accent-500/20 rounded-full blur-xl"
          />

          {/* Floating icons */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 right-1/4 text-white/20"
          >
            <Book className="w-12 h-12" />
          </motion.div>
          <motion.div
            animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-32 right-10 text-white/20"
          >
            <Lightbulb className="w-10 h-10" />
          </motion.div>
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-32 left-1/4 text-white/20"
          >
            <HelpCircle className="w-14 h-14" />
          </motion.div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
            >
              <HelpCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Find answers, learn best practices, and get the most out of the OHCS E-Library platform
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className={cn(
                "relative transition-all duration-300",
                searchFocused && "transform scale-105"
              )}>
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="w-full pl-14 pr-6 py-5 bg-white dark:bg-surface-800 border-0 rounded-2xl shadow-2xl text-lg focus:ring-4 focus:ring-white/30 placeholder-surface-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    <span className="sr-only">Clear</span>
                    ✕
                  </button>
                )}
              </div>

              {/* Search Suggestions */}
              <AnimatePresence>
                {searchFocused && !searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl p-4 z-10"
                  >
                    <p className="text-sm text-surface-500 mb-3">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-full text-sm text-surface-700 dark:text-surface-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <motion.div key={action.label} variants={itemVariants}>
                <Link
                  to={action.link}
                  className="group flex flex-col items-center p-4 bg-white dark:bg-surface-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-surface-100 dark:border-surface-700"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                    action.color
                  )}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-medium text-surface-900 dark:text-white text-center text-sm mb-1">
                    {action.label}
                  </span>
                  <span className="text-xs text-surface-500 text-center line-clamp-2">
                    {action.description}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Categories */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Browse by Category</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                variants={itemVariants}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category.id ? null : category.id);
                  setActiveTab('faq');
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1",
                  selectedCategory === category.id
                    ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                    : "bg-white dark:bg-surface-800 hover:shadow-lg border border-surface-100 dark:border-surface-700"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                  category.color,
                  selectedCategory === category.id && "opacity-100"
                )} />
                <div className="relative">
                  <category.icon className={cn(
                    "w-8 h-8 mb-3 transition-colors",
                    selectedCategory === category.id ? "text-white" : "text-surface-400 group-hover:text-white"
                  )} />
                  <p className={cn(
                    "font-semibold text-sm mb-1 transition-colors",
                    selectedCategory === category.id ? "text-white" : "text-surface-900 dark:text-white group-hover:text-white"
                  )}>
                    {category.name}
                  </p>
                  <p className={cn(
                    "text-xs transition-colors",
                    selectedCategory === category.id ? "text-white/80" : "text-surface-500 group-hover:text-white/80"
                  )}>
                    {category.count} articles
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
          {[
            { id: 'guides', label: 'Guides', icon: BookOpen },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Guides Tab */}
          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {guides.map((guide) => (
                <motion.div
                  key={guide.id}
                  layout
                  className={cn(
                    "bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden transition-all duration-300",
                    activeGuide === guide.id && "lg:col-span-2 lg:row-span-2"
                  )}
                >
                  {/* Guide Header */}
                  <div className={cn(
                    "p-6 bg-gradient-to-br",
                    guide.color
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <guide.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{guide.title}</h3>
                          <p className="text-sm text-white/80">{guide.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {guide.duration}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        guide.difficulty === 'Beginner' && "bg-green-500/30 text-green-100",
                        guide.difficulty === 'Intermediate' && "bg-yellow-500/30 text-yellow-100",
                        guide.difficulty === 'Advanced' && "bg-red-500/30 text-red-100"
                      )}>
                        {guide.difficulty}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-white/80 mb-1">
                        <span>Progress</span>
                        <span>{getGuideProgress(guide.id, guide.steps.length)}%</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getGuideProgress(guide.id, guide.steps.length)}%` }}
                          className="h-full bg-white rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guide Steps */}
                  <div className="p-6">
                    <button
                      onClick={() => setActiveGuide(activeGuide === guide.id ? null : guide.id)}
                      className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 mb-4 hover:underline"
                    >
                      {activeGuide === guide.id ? 'Hide steps' : 'Show steps'}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        activeGuide === guide.id && "rotate-180"
                      )} />
                    </button>

                    <AnimatePresence>
                      {activeGuide === guide.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3"
                        >
                          {guide.steps.map((step, stepIndex) => {
                            const isCompleted = completedSteps[guide.id]?.includes(stepIndex);
                            return (
                              <button
                                key={stepIndex}
                                onClick={() => toggleStep(guide.id, stepIndex)}
                                className={cn(
                                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all",
                                  isCompleted
                                    ? "bg-green-50 dark:bg-green-900/20"
                                    : "bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700"
                                )}
                              >
                                <div className={cn(
                                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : "bg-surface-200 dark:bg-surface-600 text-surface-500"
                                )}>
                                  {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <span className="text-xs font-medium">{stepIndex + 1}</span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm",
                                  isCompleted
                                    ? "text-green-700 dark:text-green-400 line-through"
                                    : "text-surface-700 dark:text-surface-300"
                                )}>
                                  {step}
                                </span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden"
            >
              {filteredFAQs.length === 0 ? (
                <div className="p-12 text-center">
                  <HelpCircle className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    Try a different search term or browse categories
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                  {filteredFAQs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                      >
                        <div className="flex-1 pr-4">
                          <span className="font-semibold text-surface-900 dark:text-white">
                            {faq.question}
                          </span>
                          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {faq.views.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {faq.helpful} helpful
                            </span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedFAQ === faq.id ? 180 : 0 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDown className="w-5 h-5 text-surface-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {expandedFAQ === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5">
                              <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl border-l-4 border-primary-500">
                                <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-surface-500">Was this helpful?</span>
                                  <button
                                    onClick={() => handleVote(faq.id, 'up')}
                                    className={cn(
                                      "p-2 rounded-lg transition-colors",
                                      helpfulVotes[faq.id] === 'up'
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                        : "hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400"
                                    )}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleVote(faq.id, 'down')}
                                    className={cn(
                                      "p-2 rounded-lg transition-colors",
                                      helpfulVotes[faq.id] === 'down'
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                        : "hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400"
                                    )}
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleCopyLink(faq.id)}
                                  className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors"
                                >
                                  {copiedLink === faq.id ? (
                                    <>
                                      <Check className="w-4 h-4 text-green-500" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      Copy link
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {videoTutorials.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 dark:bg-surface-800/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-primary-600 ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                      {video.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs font-medium mb-2">
                      {video.category}
                    </span>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
                      {video.title}
                    </h3>
                    <p className="text-sm text-surface-500 line-clamp-2 mb-3">
                      {video.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <Eye className="w-3 h-3" />
                      {video.views.toLocaleString()} views
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <motion.div
              key="shortcuts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {shortcutCategories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 p-6"
                >
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-primary-500" />
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {category.shortcuts.map((shortcut, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl"
                      >
                        <span className="text-sm text-surface-600 dark:text-surface-400">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 bg-surface-200 dark:bg-surface-600 rounded text-xs font-mono font-medium text-surface-700 dark:text-surface-300 shadow-sm">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-surface-400 text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* What's New Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">What's New</h2>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden">
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {whatsNew.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                    item.type === 'feature' && "bg-green-100 dark:bg-green-900/30 text-green-600",
                    item.type === 'improvement' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                    item.type === 'security' && "bg-red-100 dark:bg-red-900/30 text-red-600"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-surface-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        item.type === 'feature' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                        item.type === 'improvement' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                        item.type === 'security' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {item.description}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm text-surface-400">
                    {item.date}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Support Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 rounded-2xl p-8 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Need more help?</h3>
              <p className="text-primary-100 mb-6">
                Our support team is available to assist you with any questions or issues.
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:support@ohcs.gov.gh"
                  className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-primary-200">support@ohcs.gov.gh</p>
                  </div>
                </a>
                <a
                  href="tel:+233302000000"
                  className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-primary-200">+233 30 200 0000</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Support Hours</p>
                    <p className="text-sm text-primary-200">Mon-Fri: 8:00 AM - 5:00 PM GMT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 p-8">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Additional Resources
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Explore our documentation and training materials
            </p>

            <div className="space-y-3">
              {[
                { label: 'User Guide (PDF)', icon: FileText, desc: 'Complete platform documentation' },
                { label: 'Video Tutorials', icon: Video, desc: 'Step-by-step visual guides' },
                { label: 'API Documentation', icon: Globe, desc: 'For developers and integrations' },
                { label: 'Release Notes', icon: Flag, desc: 'Latest updates and changes' },
              ].map((resource) => (
                <a
                  key={resource.label}
                  href="#"
                  className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors group"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                    <resource.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">
                      {resource.label}
                    </p>
                    <p className="text-sm text-surface-500">
                      {resource.desc}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Community Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-surface-100 via-primary-50 to-secondary-50 dark:from-surface-800 dark:via-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Join the Community
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
              Connect with fellow civil servants, share knowledge, and get answers from the community
            </p>
            <Link
              to="/forum"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all shadow-lg hover:shadow-xl"
            >
              Visit the Forum
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
