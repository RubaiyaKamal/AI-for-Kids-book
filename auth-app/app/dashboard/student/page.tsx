/**
 * Student Dashboard Page
 *
 * Displays student progress, quiz results, and study metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressCard from '@/components/dashboard/ProgressCard';
import ModuleProgressBar from '@/components/dashboard/ModuleProgressBar';
import QuizResultsList from '@/components/dashboard/QuizResultsList';

interface StudentDashboardData {
  student_profile: {
    student_id: string;
    user_id: string;
    grade_level?: string;
  } | null;
  progress: {
    completed_chapters: number;
    in_progress_chapters: number;
    total_chapters_accessed: number;
    total_time_seconds: number;
    total_time_hours: string;
    completion_percentage: number;
  };
  module_progress: Array<{
    module_id: string;
    total_chapters: number;
    completed_chapters: number;
    progress_percentage: number;
  }>;
  quiz_performance: {
    total_quizzes: number;
    average_score: string;
    passed_count: number;
    recent_attempts: any[];
  };
  last_activity: {
    chapter_id: string;
    last_accessed_at: string;
  } | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/student');

      if (response.status === 401) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-white rounded-lg hover:bg-gray-100"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Student Dashboard
          </h1>
          {data.student_profile && (
            <p className="text-gray-600">
              Student ID: <span className="font-mono font-semibold">{data.student_profile.student_id}</span>
              {data.student_profile.grade_level && (
                <span className="ml-4">Grade: {data.student_profile.grade_level}</span>
              )}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ProgressCard
            icon="📚"
            value={`${data.progress.completion_percentage}%`}
            label="Overall Progress"
            color="bg-pastel-mint"
          />
          <ProgressCard
            icon="⏱️"
            value={`${data.progress.total_time_hours}h`}
            label="Study Time"
            color="bg-pastel-peach"
          />
          <ProgressCard
            icon="✅"
            value={`${data.progress.completed_chapters}/${data.progress.total_chapters_accessed}`}
            label="Chapters Completed"
            color="bg-pastel-sky"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module Progress */}
          <div className="bg-purple-100 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Module Progress</h2>
            {data.module_progress.length > 0 ? (
              <div>
                {data.module_progress.map((module) => (
                  <ModuleProgressBar
                    key={module.module_id}
                    moduleId={module.module_id}
                    moduleName=""
                    completedChapters={module.completed_chapters}
                    totalChapters={module.total_chapters}
                    progressPercentage={module.progress_percentage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Start reading chapters to see your progress!</p>
              </div>
            )}
          </div>

          {/* Quiz Performance */}
          <div className="bg-purple-100 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Performance</h2>
            {data.quiz_performance.total_quizzes > 0 && (
              <div className="mb-6 p-4 bg-pastel-blue rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {data.quiz_performance.average_score}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Quizzes Passed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data.quiz_performance.passed_count}/{data.quiz_performance.total_quizzes}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Quiz Results</h3>
            <QuizResultsList attempts={data.quiz_performance.recent_attempts} />
          </div>
        </div>

        {/* Continue Learning Button */}
        {data.last_activity && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/book')}
              className="px-8 py-3 bg-gradient-to-r from-pastel-purple to-pastel-blue text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Continue Learning
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Last active: {new Date(data.last_activity.last_accessed_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
