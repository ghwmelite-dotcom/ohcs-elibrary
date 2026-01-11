import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, BookOpen, ShieldCheck, TrendingUp, Users,
  CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { SellerApplicationForm } from '@/components/shop/SellerApplicationForm';
import { ApplicationStatus } from '@/components/shop/ApplicationStatus';
import { useSellerStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

const benefits = [
  {
    icon: BookOpen,
    title: 'Sell Your Publications',
    description: 'Share your books, guides, and training materials with thousands of civil servants across Ghana.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Author Badge',
    description: 'Get recognized as a verified government author with a special badge on your profile.',
  },
  {
    icon: TrendingUp,
    title: 'Earn Royalties',
    description: 'Receive up to 88% of each sale directly to your Mobile Money or bank account.',
  },
  {
    icon: Users,
    title: 'Reach Your Audience',
    description: 'Connect with civil servants looking for professional development resources.',
  },
];

const requirements = [
  'Must be a registered user with a .gov.gh email',
  'Valid government-issued ID or Staff ID',
  'Clear description of products you plan to sell',
  'Mobile Money or bank account for receiving payments',
];

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { eligibility, checkEligibility, application, fetchApplication } = useSellerStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        await checkEligibility();
        await fetchApplication();
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isAuthenticated, checkEligibility, fetchApplication]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 mx-auto text-primary-600 mb-6" />
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            Become a Seller
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
            Please sign in to apply as a seller on the OHCS Marketplace.
          </p>
          <Button onClick={() => navigate('/login', { state: { from: '/shop/become-seller' } })}>
            Sign In to Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show application status if user has an existing application
  if (application && application.status !== 'rejected') {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
              Your Seller Application
            </h1>
          </div>
          <ApplicationStatus
            onGoToDashboard={() => navigate('/shop/seller/dashboard')}
            onReapply={() => setShowForm(true)}
          />
        </div>
      </div>
    );
  }

  // Show application form
  if (showForm || (application && application.status === 'rejected')) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
              Seller Application
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-2">
              Complete the form below to apply as a seller
            </p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 md:p-8">
            <SellerApplicationForm
              onSuccess={() => {
                setShowForm(false);
              }}
            />
          </div>

          <button
            onClick={() => setShowForm(false)}
            className="mt-4 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          >
            &larr; Back to overview
          </button>
        </div>
      </div>
    );
  }

  // Show landing page
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Trusted Government Marketplace</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Share Your Knowledge,
              <br />
              <span className="text-ghana-yellow">Empower the Service</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Join Ghana's premier marketplace for civil service publications.
              Sell your books, guides, and training materials to thousands of public servants.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50"
                onClick={() => setShowForm(true)}
              >
                Apply to Become a Seller
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => navigate('/shop')}
              >
                Browse the Shop
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            Why Sell on OHCS Marketplace?
          </h2>
          <p className="text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            The OHCS E-Library Marketplace connects you directly with civil servants
            seeking professional development resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {benefit.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Section */}
      <div className="bg-white dark:bg-surface-800 border-y border-surface-200 dark:border-surface-700">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                What You'll Need
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Before applying, make sure you have the following ready:
              </p>

              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-surface-700 dark:text-surface-300">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-6 md:p-8">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Commission Structure
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-surface-600 dark:text-surface-400">Digital Products</span>
                  <span className="font-semibold text-success-600">You keep 90%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-surface-600 dark:text-surface-400">Physical Products</span>
                  <span className="font-semibold text-success-600">You keep 88%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-surface-600 dark:text-surface-400">Verified Authors</span>
                  <span className="font-semibold text-success-600">You keep 92%</span>
                </div>
              </div>

              <p className="text-sm text-surface-500 mt-4">
                Payouts processed weekly via Mobile Money or bank transfer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-2xl mx-auto">
          The application process takes about 5 minutes. Our team will review your
          application within 2-5 business days.
        </p>

        <Button size="lg" onClick={() => setShowForm(true)}>
          Start Your Application
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
