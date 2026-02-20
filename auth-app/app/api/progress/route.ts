/**
 * Progress API Route
 *
 * GET /api/progress?user_id={id} - Get user's overall progress summary
 * GET /api/progress?chapter_id={id} - Get specific chapter progress status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { isAuthorizedToAccess } from '@/lib/roles';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get('chapter_id');
    const targetUserId = searchParams.get('user_id') || session.user.id;

    // Check authorization
    const pool = getPool();
    const authorized = await isAuthorizedToAccess(pool, session.user.id, targetUserId);

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // If chapter_id provided, return specific chapter status
      if (chapterId) {
        const chapterResult = await client.query(
          `SELECT
            chapter_id,
            status,
            completion_percentage,
            time_spent_seconds,
            started_at,
            completed_at,
            last_accessed_at
          FROM chapter_progress
          WHERE user_id = $1 AND chapter_id = $2`,
          [targetUserId, chapterId]
        );

        if (chapterResult.rows.length === 0) {
          // Chapter not started yet
          return NextResponse.json({
            chapter_id: chapterId,
            status: 'not_started',
            completion_percentage: 0,
            time_spent_seconds: 0,
          });
        }

        return NextResponse.json(chapterResult.rows[0]);
      }
      // Get overall progress statistics
      const progressResult = await client.query(
        `SELECT
          COUNT(*) as total_chapters,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_chapters,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_chapters,
          SUM(time_spent_seconds) as total_time_seconds,
          ROUND(
            100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / NULLIF(COUNT(*), 0),
            2
          ) as completion_percentage
        FROM chapter_progress
        WHERE user_id = $1`,
        [targetUserId]
      );

      const stats = progressResult.rows[0] || {
        total_chapters: 0,
        completed_chapters: 0,
        in_progress_chapters: 0,
        total_time_seconds: 0,
        completion_percentage: 0,
      };

      // Get recent chapters
      const recentResult = await client.query(
        `SELECT
          chapter_id,
          status,
          completion_percentage,
          time_spent_seconds,
          last_accessed_at
        FROM chapter_progress
        WHERE user_id = $1
        ORDER BY last_accessed_at DESC
        LIMIT 10`,
        [targetUserId]
      );

      const response = {
        user_id: targetUserId,
        stats: {
          total_chapters: parseInt(stats.total_chapters),
          completed_chapters: parseInt(stats.completed_chapters),
          in_progress_chapters: parseInt(stats.in_progress_chapters),
          total_time_seconds: parseInt(stats.total_time_seconds) || 0,
          total_time_hours: ((parseInt(stats.total_time_seconds) || 0) / 3600).toFixed(1),
          completion_percentage: parseFloat(stats.completion_percentage) || 0,
        },
        recent_chapters: recentResult.rows,
      };

      return NextResponse.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
