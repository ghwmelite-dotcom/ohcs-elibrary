import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/shared/Button';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  // Auto-redirect after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate(conversationId ? `/direct-messages/${conversationId}` : '/direct-messages', { replace: true });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [conversationId, navigate]);

  return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white dark:bg-surface-800 rounded-xl shadow-elevation-2">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          This page has moved
        </h2>
        <p className="text-surface-500 mb-6">
          Messages have been relocated to the new messaging experience. You will be redirected automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={conversationId ? `/direct-messages/${conversationId}` : '/direct-messages'}>
            <Button variant="outline" className="gap-2">
              Direct Messages
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/chat">
            <Button className="gap-2">
              Chat Rooms
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
