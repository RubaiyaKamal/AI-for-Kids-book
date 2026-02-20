/**
 * Fix Quiz Chapter IDs
 *
 * Updates quiz chapter_id values to match the actual book navigation structure
 */

const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });

async function fixQuizChapterIds() {
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing quiz chapter IDs...\n');

    // Map of old chapter IDs to new ones matching bookNavigation
    const updates = [
      {
        old: 'chapter-02-markdown-quiz',
        new: 'part-2-markdown-prompt-context/chapter-02-markdown/06-quiz-markdown'
      },
      {
        old: 'chapter-03-prompt-engineering-quiz',
        new: 'part-2-markdown-prompt-context/chapter-03-prompt-engineering/09-quiz-prompt-engineering'
      },
      {
        old: 'chapter-04-context-engineering-quiz',
        new: 'part-2-markdown-prompt-context/chapter-04-context-engineering/10-quiz-context-engineering'
      },
      {
        old: 'chapter-05-python-uv-quiz',
        new: 'part-3-python-fundamentals/chapter-05-python-uv/04-quiz-python-uv'
      },
      {
        old: 'chapter-06-intro-modern-python-quiz',
        new: 'part-3-python-fundamentals/chapter-06-intro-modern-python/04-quiz-intro-modern-python'
      },
      {
        old: 'chapter-07-data-types-quiz',
        new: 'part-3-python-fundamentals/chapter-07-data-types/06-quiz-data-types'
      },
      {
        old: 'chapter-08-operators-keywords-variables-quiz',
        new: 'part-3-python-fundamentals/chapter-08-operators-keywords-variables/06-quiz-operators-keywords-variables'
      },
      {
        old: 'chapter-09-strings-type-casting-quiz',
        new: 'part-3-python-fundamentals/chapter-09-strings-type-casting/05-quiz-strings-type-casting'
      },
      {
        old: 'chapter-10-control-flow-loops-quiz',
        new: 'part-3-python-fundamentals/chapter-10-control-flow-loops/06-quiz-control-flow-loops'
      },
      {
        old: 'chapter-11-lists-tuples-dictionary-quiz',
        new: 'part-3-python-fundamentals/chapter-11-lists-tuples-dictionary/04-quiz-lists-tuples-dictionary'
      }
    ];

    for (const update of updates) {
      const result = await client.query(
        'UPDATE quizzes SET chapter_id = $1 WHERE chapter_id = $2',
        [update.new, update.old]
      );

      if (result.rowCount > 0) {
        console.log(`✅ Updated: ${update.old.substring(0, 30)}... -> ${update.new.substring(0, 40)}...`);
      }
    }

    console.log('\n📊 Verification:');
    const result = await client.query('SELECT chapter_id, title FROM quizzes ORDER BY id');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.title}`);
      console.log(`   ID: ${row.chapter_id}`);
    });

    console.log('\n✅ Quiz chapter IDs updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixQuizChapterIds();
