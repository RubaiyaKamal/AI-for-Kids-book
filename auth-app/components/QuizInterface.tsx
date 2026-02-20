/**
 * Quiz Interface Component
 *
 * Interactive quiz component with question display, answer selection, and results
 */

'use client';

import { useState } from 'react';

interface QuizOption {
  key: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correct_answer?: string;
  explanation?: string;
}

interface QuizResult {
  question_id: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

interface ScoredQuiz {
  attempt_number: number;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  passed: boolean;
  results: QuizResult[];
  time_taken_seconds: number;
}

interface QuizInterfaceProps {
  quizId: number;
  chapterId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingPercentage: number;
  nextAttemptNumber: number;
  onRetake?: () => void;
}

export default function QuizInterface({
  quizId,
  chapterId,
  title,
  description,
  questions,
  passingPercentage,
  nextAttemptNumber,
  onRetake,
}: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizStartTime] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ScoredQuiz | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswerSelect = (questionId: string, answerKey: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerKey }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submissionData = {
        quiz_id: quizId,
        started_at: quizStartTime.toISOString(),
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({
          question_id,
          selected_answer,
        })),
      };

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const scoredQuiz: ScoredQuiz = await response.json();
      setResults(scoredQuiz);
    } catch (error) {
      console.error('Quiz submission error:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    if (onRetake) onRetake();
  };

  // Results View
  if (results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Results Header */}
        <div className={`rounded-lg p-8 mb-6 text-center ${
          results.passed ? 'bg-green-50' : 'bg-orange-50'
        }`}>
          <div className="text-6xl mb-4">{results.passed ? '🎉' : '📚'}</div>
          <h2 className="text-3xl font-bold mb-2">
            {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            You scored {results.score_percentage}%
          </p>
          <p className="text-gray-600">
            {results.correct_answers} out of {results.total_questions} correct
            {' • '}
            {Math.floor(results.time_taken_seconds / 60)}m {results.time_taken_seconds % 60}s
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Attempt #{results.attempt_number}
            {results.passed && ` • Passing score: ${passingPercentage}%`}
          </p>
        </div>

        {/* Question Results */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h3 className="text-xl font-bold mb-4">Answer Review</h3>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const result = results.results.find(r => r.question_id === question.id);
              if (!result) return null;

              return (
                <div
                  key={question.id}
                  className={`border-l-4 pl-4 py-2 ${
                    result.is_correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-gray-800">
                      {index + 1}. {question.question}
                    </p>
                    <span className="text-2xl ml-2">
                      {result.is_correct ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className={result.is_correct ? 'text-green-700' : 'text-red-700'}>
                      Your answer: {result.selected_answer})
                      {' '}
                      {question.options.find(opt => opt.key === result.selected_answer)?.text}
                    </p>
                    {!result.is_correct && (
                      <p className="text-green-700 mt-1">
                        Correct answer: {result.correct_answer})
                        {' '}
                        {question.options.find(opt => opt.key === result.correct_answer)?.text}
                      </p>
                    )}
                    {result.explanation && (
                      <p className="text-gray-600 mt-2 italic">{result.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRetake}
            className="px-6 py-3 bg-gradient-to-r from-pastel-purple to-pastel-blue text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/student'}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Attempt #{nextAttemptNumber}</span>
          <span>Passing score: {passingPercentage}%</span>
          <span className="font-medium">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-pastel-purple to-pastel-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Single Question View - One by One */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option) => (
              <label
                key={option.key}
                className={`flex items-start p-4 rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestion.id] === option.key
                    ? 'bg-pastel-blue border-2 border-blue-400'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.key}
                  checked={answers[currentQuestion.id] === option.key}
                  onChange={() => handleAnswerSelect(currentQuestion.id, option.key)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-800">
                  <strong>{option.key})</strong> {option.text}
                </span>
              </label>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="px-8 py-3 bg-gradient-to-r from-pastel-purple to-pastel-blue text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
        {!allAnswered && (
          <p className="text-sm text-gray-500 mt-2">
            Answer all questions to submit
          </p>
        )}
      </div>
    </div>
  );
}
