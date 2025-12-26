import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArticleView } from '@/components/news';

export default function Article() {
  const { id } = useParams<{ id: string }>();

  // Mock article data - in production this would come from API
  const mockArticle = {
    id: id || '1',
    title: 'Government Announces New Digital Transformation Initiative for Civil Service',
    excerpt: 'The Office of the Head of Civil Service has unveiled a comprehensive digital transformation plan aimed at modernizing government operations across all MDAs.',
    content: `
      <p>The Office of the Head of Civil Service (OHCS) has today announced a comprehensive digital transformation initiative that aims to revolutionize how government services are delivered across Ghana.</p>

      <h2>Key Components of the Initiative</h2>
      <p>The initiative, dubbed "Digital Civil Service 2030," encompasses several key areas:</p>

      <ul>
        <li><strong>E-Government Services:</strong> All major government services will be available online within the next three years</li>
        <li><strong>Staff Training:</strong> Over 50,000 civil servants will receive digital skills training</li>
        <li><strong>Infrastructure Upgrade:</strong> Modern IT infrastructure will be deployed across all MDAs</li>
        <li><strong>Data Management:</strong> A unified government data platform will be established</li>
      </ul>

      <h2>Investment and Timeline</h2>
      <p>The government has allocated GHS 500 million for the first phase of implementation, which will run from January 2025 to December 2027. International development partners, including the World Bank and African Development Bank, have expressed interest in supporting the initiative.</p>

      <blockquote>
        "This digital transformation will not only improve service delivery but also enhance transparency and accountability in government operations," said the Head of Civil Service during the launch ceremony.
      </blockquote>

      <h2>Expected Benefits</h2>
      <p>The initiative is expected to deliver significant benefits to both civil servants and citizens:</p>

      <ul>
        <li>Reduced processing times for government services by up to 70%</li>
        <li>Improved inter-agency collaboration and data sharing</li>
        <li>Enhanced citizen engagement through digital platforms</li>
        <li>Cost savings estimated at GHS 200 million annually</li>
        <li>Creation of a more agile and responsive civil service</li>
      </ul>

      <h2>Implementation Approach</h2>
      <p>The implementation will follow a phased approach, starting with pilot programs in selected ministries before rolling out nationwide. The Ministry of Finance, Public Services Commission, and Ministry of Health have been selected as pilot agencies.</p>

      <p>A dedicated Digital Transformation Unit will be established within OHCS to oversee implementation and coordinate with all stakeholders. This unit will report directly to the Head of Civil Service and will include representatives from all major MDAs.</p>

      <h2>Stakeholder Reactions</h2>
      <p>The announcement has been welcomed by various stakeholders, including the Civil Servants Association of Ghana (CSAG), which described it as "a long-overdue step towards modernizing the civil service."</p>

      <p>Private sector technology partners have also expressed enthusiasm, with several local and international companies indicating interest in supporting the initiative through public-private partnerships.</p>
    `,
    source: 'Ghana News Agency',
    sourceIcon: '',
    sourceUrl: 'https://gna.org.gh',
    category: 'Government',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://gna.org.gh/article/digital-transformation',
    author: 'Kwame Asante',
    readTime: 5,
    relevanceScore: 95,
    isBookmarked: false,
    tags: ['Digital Transformation', 'Civil Service', 'OHCS', 'E-Government', 'Technology'],
  };

  const mockRelatedArticles = [
    {
      id: '2',
      title: 'Public Services Commission Reviews Promotion Guidelines for 2025',
      source: 'Daily Graphic',
      imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      title: 'Ministry of Finance Releases Q4 Budget Performance Report',
      source: 'Joy News',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: '6',
      title: 'Local Government Ministry Announces Smart City Initiative',
      source: 'Daily Graphic',
      imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
    },
  ];

  const handleBookmark = () => {
    console.log('Toggle bookmark for article:', id);
  };

  const handleShare = () => {
    console.log('Share article:', id);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticleView
          article={mockArticle}
          relatedArticles={mockRelatedArticles}
          onBookmark={handleBookmark}
          onShare={handleShare}
        />
      </div>
    </MainLayout>
  );
}
