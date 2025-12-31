/**
 * Course Detail Page
 * View course information and enroll
 */

import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Clock,
  Users,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  FileText,
  Video,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
// Type imports removed - using string Records for flexibility

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const lessonIcons: Record<string, typeof Play> = {
  text: FileText,
  document: FileText,
  video: Video,
  embed: Video,
  quiz: Target,
  assignment: FileText,
  discussion: MessageSquare,
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentCourse: course,
    isLoading,
    isEnrolling,
    error,
    fetchCourse,
    enroll,
    unenroll,
    clearCurrentCourse,
  } = useLMSStore();

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
    return () => clearCurrentCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!courseId) return;
    const success = await enroll(courseId);
    if (success) {
      // Navigate to learn page
      navigate(`/courses/${courseId}/learn`);
    }
  };

  const handleContinueLearning = () => {
    if (course?.enrollment?.lastLessonId) {
      navigate(`/courses/${courseId}/learn/${course.enrollment.lastLessonId}`);
    } else {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Course not found
        </h3>
        <Link to="/courses" className="text-primary-600 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const isEnrolled = !!course.enrollment;
  const progress = course.enrollment?.progress || 0;

  // Parse JSON strings if needed (objectives and tags may come as JSON strings from DB)
  const parseJsonArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const objectives = parseJsonArray(course.objectives);
  const tags = parseJsonArray(course.tags);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl overflow-hidden mb-8">
        <div className="grid lg:grid-cols-3 gap-8 p-8">
          {/* Course Info */}
          <div className="lg:col-span-2 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className={cn('px-3 py-1 text-sm font-medium rounded-full bg-white/20')}>
                {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Beginner'}
              </span>
              <span className="text-primary-100">{course.category}</span>
            </div>

            <h1 className="text-3xl font-bold font-heading mb-4">{course.title}</h1>

            {course.shortDescription && (
              <p className="text-primary-100 text-lg mb-6">{course.shortDescription}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-200" />
                <span>{Math.round((course.estimatedDuration || 0) / 60)} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-200" />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-200" />
                <span>{course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} lessons</span>
              </div>
              {course.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>{course.averageRating.toFixed(1)} ({course.ratingCount} reviews)</span>
                </div>
              )}
            </div>

            {course.instructor && (
              <div className="flex items-center gap-3">
                {course.instructor.avatar ? (
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-bold">{course.instructor.name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="font-medium">{course.instructor.name}</div>
                  {course.instructor.title && (
                    <div className="text-sm text-primary-200">{course.instructor.title}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-lg">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}

            {isEnrolled ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-surface-600 dark:text-surface-400">Progress</span>
                    <span className="font-medium text-surface-900 dark:text-surface-100">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Button onClick={handleContinueLearning} fullWidth size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>

                <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-4">
                  {course.enrollment?.lessonsCompleted} of {course.enrollment?.totalLessons} lessons completed
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-surface-900 dark:text-surface-100">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {course.xpReward} XP
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Complete this course to earn
                  </p>
                </div>

                <Button
                  onClick={handleEnroll}
                  fullWidth
                  size="lg"
                  isLoading={isEnrolling}
                >
                  Enroll Now - Free
                </Button>

                <ul className="mt-4 space-y-2 text-sm text-surface-600 dark:text-surface-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Full lifetime access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Certificate on completion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {course.xpReward} XP reward
                  </li>
                </ul>
              </>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {course.description && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="text-xl font-bold font-heading text-surface-900 dark:text-surface-100 mb-4">
                About This Course
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            </div>
          )}

          {/* Objectives */}
          {objectives.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="text-xl font-bold font-heading text-surface-900 dark:text-surface-100 mb-4">
                What You'll Learn
              </h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-surface-600 dark:text-surface-400">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
            <h2 className="text-xl font-bold font-heading text-surface-900 dark:text-surface-100 mb-4">
              Course Curriculum
            </h2>

            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <details key={module.id} className="group" open={index === 0}>
                    <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                            {module.title}
                          </h3>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            {module.lessons?.length || 0} lessons
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-surface-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="mt-2 ml-4 border-l-2 border-surface-200 dark:border-surface-600 pl-4 space-y-2">
                      {module.lessons?.map((lesson) => {
                        const Icon = lessonIcons[lesson.contentType] || FileText;
                        const isCompleted = lesson.progress?.status === 'completed';
                        const isLocked = !isEnrolled && !lesson.isPreviewable;

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg',
                              isLocked
                                ? 'opacity-50'
                                : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center',
                                isCompleted
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : 'bg-surface-100 dark:bg-surface-700'
                              )}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : isLocked ? (
                                  <Lock className="w-4 h-4 text-surface-400" />
                                ) : (
                                  <Icon className="w-4 h-4 text-surface-500" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                  {lesson.title}
                                </h4>
                                <p className="text-xs text-surface-500 dark:text-surface-400">
                                  {lesson.estimatedDuration} min
                                </p>
                              </div>
                            </div>

                            {lesson.isPreviewable && !isEnrolled && (
                              <span className="text-xs text-primary-600 dark:text-primary-400">
                                Preview
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-surface-500 dark:text-surface-400">
                Course curriculum is being prepared...
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instructor */}
          {course.instructor && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">
                About the Instructor
              </h3>
              <div className="flex items-center gap-3 mb-4">
                {course.instructor.avatar ? (
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {course.instructor.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-surface-900 dark:text-surface-100">
                    {course.instructor.name}
                  </div>
                  {course.instructor.title && (
                    <div className="text-sm text-surface-500 dark:text-surface-400">
                      {course.instructor.title}
                    </div>
                  )}
                </div>
              </div>
              {course.instructor.bio && (
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {course.instructor.bio}
                </p>
              )}
            </div>
          )}

          {/* Discussions Link */}
          {isEnrolled && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">
                Course Discussions
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Join the conversation with fellow learners and instructors.
              </p>
              <Link
                to={`/courses/${courseId}/discussions`}
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-900 dark:text-surface-100 rounded-lg transition-colors font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                View Discussions
              </Link>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">
                Topics Covered
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
