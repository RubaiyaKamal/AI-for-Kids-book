/**
 * Quiz Parser Script
 *
 * Parses quiz markdown files and inserts them into the database.
 * Run with: npx tsx scripts/parse-quizzes.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

interface QuizOption {
  key: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
}

interface ParsedQuiz {
  chapter_id: string;
  title: string;
  description: string;
  passing_percentage: number;
  questions: QuizQuestion[];
}

/**
 * Recursively find all quiz markdown files
 */
function findQuizFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      findQuizFiles(filePath, fileList);
    } else if (file.includes('quiz') && file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract chapter ID from file path
 * Example: part-2-markdown-prompt-context/chapter-02-markdown/06-quiz-markdown.md
 * Returns: chapter-02-markdown-quiz
 */
function extractChapterId(filePath: string): string {
  const parts = filePath.split(/[\/\\]/);
  const chapterPart = parts.find(p => p.startsWith('chapter-'));
  const fileName = parts[parts.length - 1].replace('.md', '');

  if (chapterPart) {
    return `${chapterPart}-quiz`;
  }

  return fileName;
}

/**
 * Parse a quiz markdown file
 */
function parseQuizFile(filePath: string): ParsedQuiz | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const chapter_id = extractChapterId(filePath);
    let title = '';
    let description = '';
    const questions: QuizQuestion[] = [];
    const answers: Map<number, { answer: string; explanation: string }> = new Map();

    // Extract title (first # heading)
    for (const line of lines) {
      if (line.startsWith('# ') && !title) {
        title = line.replace('# ', '').replace(/[🎯✨]/g, '').trim();
        break;
      }
    }

    // Extract description (text after title before questions section)
    let inDescription = false;
    for (const line of lines) {
      if (line.startsWith('# ') && !inDescription) {
        inDescription = true;
        continue;
      }
      if (inDescription && line.includes('## 📝 Questions')) {
        break;
      }
      if (inDescription && line.trim() && !line.startsWith('**') && !line.startsWith('-') && !line.startsWith('#')) {
        description += line.trim() + ' ';
      }
    }
    description = description.trim().substring(0, 200);

    // Parse questions
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect question start: ### Question N: Title
      if (line.match(/^### Question (\d+):/)) {
        if (currentQuestion && currentQuestion.question && currentQuestion.options) {
          questions.push(currentQuestion as QuizQuestion);
        }

        questionNumber++;
        const questionTitle = line.split(':').slice(1).join(':').trim();

        // Next line is the question text in bold
        const questionText = lines[i + 1]?.replace(/\*\*/g, '').trim() || questionTitle;

        currentQuestion = {
          id: `q${questionNumber}`,
          question: questionText,
          options: [],
          correct_answer: '',
          explanation: ''
        };
      }

      // Detect options: A), B), C), D) or **A)**, **B)**, etc.
      const optionMatch = line.match(/^\*\*([A-D])\)\*\*\s+(.+)/) || line.match(/^([A-D])\)\s+(.+)/);
      if (currentQuestion && optionMatch) {
        const key = optionMatch[1];
        const text = optionMatch[2].trim();
        currentQuestion.options!.push({ key, text });
      }

      // Parse answer from details block: **Answer: B)** or answer key section
      const answerInDetailsMatch = line.match(/\*\*Answer:\s+([A-D])\)/);
      if (answerInDetailsMatch && currentQuestion) {
        currentQuestion.correct_answer = answerInDetailsMatch[1];
      }

      // Parse explanation from details block
      const explanationMatch = line.match(/\*\*Explanation:\*\*\s+(.+)/);
      if (explanationMatch && currentQuestion) {
        currentQuestion.explanation = explanationMatch[1].trim();
      }

      // Also support old answer key format
      if (line.match(/^\d+\.\s+\*\*[A-D]\*\*/)) {
        const match = line.match(/^(\d+)\.\s+\*\*([A-D])\*\*\s+-\s+(.+)/);
        if (match) {
          const num = parseInt(match[1]);
          const answer = match[2];
          const explanation = match[3].trim();
          answers.set(num, { answer, explanation });
        }
      }
    }

    // Add last question
    if (currentQuestion && currentQuestion.question && currentQuestion.options) {
      questions.push(currentQuestion as QuizQuestion);
    }

    // Match answers to questions
    questions.forEach((q, index) => {
      const answerData = answers.get(index + 1);
      if (answerData) {
        q.correct_answer = answerData.answer;
        q.explanation = answerData.explanation;
      }
    });

    // Validate
    if (questions.length === 0) {
      console.warn(`⚠️  No questions found in ${filePath}`);
      return null;
    }

    const invalidQuestions = questions.filter(q =>
      !q.correct_answer || q.options.length === 0
    );

    if (invalidQuestions.length > 0) {
      console.warn(`⚠️  ${invalidQuestions.length} questions missing answers in ${filePath}`);
    }

    return {
      chapter_id,
      title: title || 'Quiz',
      description: description || 'Test your knowledge!',
      passing_percentage: 70,
      questions
    };
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Insert quiz into database
 */
async function insertQuiz(pool: Pool, quiz: ParsedQuiz): Promise<void> {
  const client = await pool.connect();

  try {
    const questionsJson = JSON.stringify({ questions: quiz.questions });

    await client.query(`
      INSERT INTO quizzes (chapter_id, title, description, passing_percentage, questions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (chapter_id) DO UPDATE
      SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        passing_percentage = EXCLUDED.passing_percentage,
        questions = EXCLUDED.questions,
        updated_at = CURRENT_TIMESTAMP
    `, [
      quiz.chapter_id,
      quiz.title,
      quiz.description,
      quiz.passing_percentage,
      questionsJson
    ]);

    console.log(`✅ Inserted quiz: ${quiz.title} (${quiz.questions.length} questions)`);
  } catch (error) {
    console.error(`❌ Failed to insert quiz ${quiz.chapter_id}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Finding quiz files...\n');

  const docsDir = join(process.cwd(), 'docs');
  const quizFiles = findQuizFiles(docsDir);

  console.log(`Found ${quizFiles.length} quiz files:\n`);
  quizFiles.forEach(f => console.log(`  - ${relative(process.cwd(), f)}`));
  console.log();

  console.log('📖 Parsing quiz files...\n');

  const quizzes: ParsedQuiz[] = [];
  for (const file of quizFiles) {
    const quiz = parseQuizFile(file);
    if (quiz) {
      quizzes.push(quiz);
      console.log(`✓ Parsed: ${quiz.title} (${quiz.questions.length} questions)`);
    }
  }

  console.log(`\n✅ Successfully parsed ${quizzes.length} quizzes\n`);

  if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL not found in environment variables');
    console.log('Set it in .env.local file');
    process.exit(1);
  }

  console.log('💾 Connecting to database...\n');

  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

  try {
    console.log('📝 Inserting quizzes into database...\n');

    for (const quiz of quizzes) {
      await insertQuiz(pool, quiz);
    }

    console.log(`\n🎉 Successfully inserted ${quizzes.length} quizzes!`);

    // Show summary
    const result = await pool.query(`
      SELECT
        chapter_id,
        title,
        jsonb_array_length((questions->'questions')::jsonb) as question_count
      FROM quizzes
      ORDER BY chapter_id
    `);

    console.log('\n📊 Database Summary:');
    console.log('─'.repeat(80));
    result.rows.forEach((row: any) => {
      console.log(`${row.chapter_id.padEnd(40)} | ${row.title.padEnd(25)} | ${row.question_count} questions`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { parseQuizFile, findQuizFiles };
