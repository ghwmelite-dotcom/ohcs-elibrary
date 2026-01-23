import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Download,
  Calendar,
  Building2,
  Award,
  FileText,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useSponsorDashboardStore } from '@/stores/sponsorshipStore';

// Animated Line Chart Component
function EngagementChart({ data }: { data: { date: string; impressions: number; clicks: number }[] }) {
  const maxImpressions = Math.max(...data.map((d) => d.impressions), 1);
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="h-64 flex items-end gap-2 p-4">
      {data.map((item, index) => {
        const impressionHeight = (item.impressions / maxImpressions) * 100;
        const clickHeight = (item.clicks / maxClicks) * 100;

        return (
          <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-1 items-end h-48">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${impressionHeight}%` }}
                transition={{ delay: index * 0.05, duration: 0.5, type: 'spring' }}
                className="flex-1 bg-ghana-green/20 rounded-t-sm"
                title={`Impressions: ${item.impressions.toLocaleString()}`}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${clickHeight}%` }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.5, type: 'spring' }}
                className="flex-1 bg-ghana-gold rounded-t-sm"
                title={`Clicks: ${item.clicks.toLocaleString()}`}
              />
            </div>
            <span className="text-xs text-text-tertiary">
              {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Donut Chart Component
function ReachDonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, angle };
  });

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((segment, index) => (
          <motion.path
            key={segment.label}
            d={describeArc(80, 80, 60, segment.startAngle, segment.startAngle + segment.angle - 1)}
            fill="none"
            stroke={segment.color}
            strokeWidth="20"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: index * 0.2, duration: 0.8 }}
          />
        ))}
        <text x="80" y="75" textAnchor="middle" className="fill-text-primary text-2xl font-bold">
          {total.toLocaleString()}
        </text>
        <text x="80" y="95" textAnchor="middle" className="fill-text-tertiary text-sm">
          Total Reach
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-sm text-text-secondary">{segment.label}</span>
            <span className="text-sm font-medium text-text-primary">{segment.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ROI Calculator Component
function ROICalculator({ investment, reach, conversions }: { investment: number; reach: number; conversions: number }) {
  const cpr = reach > 0 ? investment / reach : 0;
  const cpc = conversions > 0 ? investment / conversions : 0;
  const estimatedValue = conversions * 500; // Assume GHS 500 value per conversion
  const roi = investment > 0 ? ((estimatedValue - investment) / investment) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-ghana-green to-green-700 rounded-2xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        ROI Calculator
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm">Cost per Reach</p>
          <p className="text-2xl font-bold">GHS {cpr.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm">Cost per Click</p>
          <p className="text-2xl font-bold">GHS {cpc.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm">Est. Value Generated</p>
          <p className="text-2xl font-bold">GHS {estimatedValue.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm">Estimated ROI</p>
          <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: number;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-surface-200 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}

export default function SponsorAnalytics() {
  const { stats, analytics, isLoading, fetchDashboard } = useSponsorDashboardStore();
  const [dateRange, setDateRange] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, dateRange]);

  // Mock data for charts (would come from analytics in real implementation)
  const engagementData = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString(),
    impressions: Math.floor(Math.random() * 5000) + 1000,
    clicks: Math.floor(Math.random() * 500) + 50,
  }));

  const reachByMda = [
    { label: 'MDAs', value: 45, color: '#006B3F' },
    { label: 'MMDAs', value: 30, color: '#FCD116' },
    { label: 'Agencies', value: 25, color: '#CE1126' },
  ];

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Impressions', 'Clicks', 'Unique Users'];
      const rows = engagementData.map((d) => [
        d.date,
        d.impressions,
        d.clicks,
        Math.floor(d.impressions * 0.6),
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sponsor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-ghana-green" />
              Analytics Dashboard
            </h1>
            <p className="text-text-secondary mt-1">
              Track your sponsorship performance and ROI
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </select>

            {/* Export Button */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
                disabled={isExporting}
              >
                {isExporting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Export
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-surface-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50 rounded-t-xl"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50 rounded-b-xl"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Eye}
            label="Total Impressions"
            value={stats?.totalReach || 0}
            change={12}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={MousePointerClick}
            label="Total Clicks"
            value={stats?.contentViews || 0}
            change={8}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={Users}
            label="Unique Users"
            value={Math.floor((stats?.totalReach || 0) * 0.6)}
            change={15}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={FileText}
            label="Certificate Views"
            value={stats?.certificateViews || 0}
            change={-3}
            color="text-amber-600"
            bgColor="bg-amber-100"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Engagement Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Engagement Over Time</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ghana-green/30" />
                  <span className="text-text-secondary">Impressions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ghana-gold" />
                  <span className="text-text-secondary">Clicks</span>
                </div>
              </div>
            </div>
            <EngagementChart data={engagementData} />
          </div>

          {/* Reach by MDA Type */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Reach by Organization Type</h3>
            <ReachDonutChart data={reachByMda} />
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mb-8">
          <ROICalculator
            investment={stats?.totalInvestment || 50000}
            reach={stats?.totalReach || 0}
            conversions={stats?.contentViews || 0}
          />
        </div>

        {/* Content Performance Table */}
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="p-6 border-b border-surface-200">
            <h3 className="text-lg font-semibold text-text-primary">Content Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Content</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Type</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-text-secondary">Impressions</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-text-secondary">Clicks</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-text-secondary">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {[
                  { name: 'Certificate Footer Banner', type: 'Certificate', impressions: 12500, clicks: 890 },
                  { name: 'Course Sponsorship Badge', type: 'Course', impressions: 8200, clicks: 620 },
                  { name: 'Homepage Banner', type: 'Banner', impressions: 15000, clicks: 450 },
                  { name: 'Resource Page Attribution', type: 'Badge', impressions: 5800, clicks: 320 },
                ].map((content, index) => (
                  <motion.tr
                    key={content.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-surface-50"
                  >
                    <td className="px-6 py-4 font-medium text-text-primary">{content.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-100 rounded-full text-xs font-medium text-text-secondary">
                        {content.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-text-primary">{content.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-text-primary">{content.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        (content.clicks / content.impressions) * 100 > 5 ? 'text-green-600' : 'text-text-primary'
                      }`}>
                        {((content.clicks / content.impressions) * 100).toFixed(2)}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scholarship Impact Section */}
        <div className="mt-8 bg-white rounded-2xl border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-ghana-gold" />
            Scholarship Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-green-50">
              <p className="text-3xl font-bold text-green-600">{stats?.scholarsSupported || 0}</p>
              <p className="text-sm text-text-secondary mt-1">Scholars Supported</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-50">
              <p className="text-3xl font-bold text-blue-600">{stats?.activeScholarships || 0}</p>
              <p className="text-sm text-text-secondary mt-1">Active Scholarships</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-50">
              <p className="text-3xl font-bold text-amber-600">92%</p>
              <p className="text-sm text-text-secondary mt-1">Completion Rate</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-50">
              <p className="text-3xl font-bold text-purple-600">4.8</p>
              <p className="text-sm text-text-secondary mt-1">Avg Scholar Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
