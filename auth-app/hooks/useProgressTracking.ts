/**
 * Progress Tracking Hook
 *
 * Auto-tracks time spent on a chapter (every 30 seconds)
 */

import { useEffect, useRef } from 'react';

export function useProgressTracking(chapterId: string, enabled = true) {
  const startTimeRef = useRef<number>(Date.now());
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !chapterId) {
      return;
    }

    startTimeRef.current = Date.now();

    const trackTime = async () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (elapsed > 0) {
        try {
          await fetch('/api/progress/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chapter_id: chapterId,
              time_spent_seconds: elapsed,
            }),
          });

          // Reset start time after successful tracking
          startTimeRef.current = Date.now();
        } catch (error) {
          console.error('Progress tracking error:', error);
        }
      }
    };

    // Track every 30 seconds
    intervalIdRef.current = setInterval(trackTime, 30000);

    // Track on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      trackTime(); // Final update
    };
  }, [chapterId, enabled]);
}
