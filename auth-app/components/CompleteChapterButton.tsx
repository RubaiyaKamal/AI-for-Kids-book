/**
 * Complete Chapter Button Component
 *
 * Allows students to mark a chapter as completed
 */

'use client';

import { useState, useEffect } from 'react';

interface CompleteChapterButtonProps {
  chapterId: string;
  onComplete?: () => void;
}

export default function CompleteChapterButton({
  chapterId,
  onComplete,
}: CompleteChapterButtonProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if chapter is already completed on mount
  useEffect(() => {
    async function checkCompletion() {
      try {
        const response = await fetch(`/api/progress?chapter_id=${chapterId}`);
        if (response.ok) {
          const data = await response.json();
          setIsCompleted(data.status === 'completed');
        }
      } catch (error) {
        console.error('Failed to check completion status:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkCompletion();
  }, [chapterId]);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter_id: chapterId }),
      });

      if (response.ok) {
        setIsCompleted(true);
        if (onComplete) {
          onComplete();
        }
      } else {
        const error = await response.json();
        console.error('Failed to mark chapter complete:', error);
        alert('Failed to mark chapter as complete. Please try again.');
      }
    } catch (error) {
      console.error('Complete chapter error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-gray-200">
        <div className="text-center text-gray-400">
          <div className="animate-pulse">Checking progress...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-pastel-mint">
      {isCompleted ? (
        <div className="text-center">
          <div className="text-5xl mb-3">✓</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">
            Chapter Completed!
          </h3>
          <p className="text-gray-600">
            Great job! Keep up the excellent work.
          </p>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Finished reading this chapter?
          </h3>
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-pastel-mint to-pastel-blue text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Saving...' : 'Mark as Complete'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Track your progress through the book
          </p>
        </div>
      )}
    </div>
  );
}
