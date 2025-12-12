// auth-app/app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Simple in-memory cache for translations
const translationCache = new Map<string, { translatedText: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

import { marked } from 'marked';

// Configure marked with custom renderer for proper styling (matching book-content route)
const renderer = new marked.Renderer();

// Custom heading renderer to add IDs and classes
renderer.heading = ({ text, depth }) => {
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const classes = {
        1: 'text-4xl font-bold text-dark-brown dark:text-cream mb-6 mt-8',
        2: 'text-3xl font-semibold text-dark-brown dark:text-cream mb-4 mt-6 border-b-2 border-goldenrod/30 pb-2',
        3: 'text-2xl font-semibold text-dark-brown dark:text-cream mb-3 mt-4',
        4: 'text-xl font-semibold text-goldenrod dark:text-goldenrod mb-2 mt-3',
        5: 'text-lg font-semibold text-dark-brown dark:text-cream mb-2 mt-2',
        6: 'text-base font-semibold text-dark-brown dark:text-cream mb-2 mt-2'
    };

    return `<h${depth} id="${id}" class="${classes[depth as keyof typeof classes]}">${text}</h${depth}>`;
};

// Custom strong renderer for goldenrod color
renderer.strong = ({ text }) => {
    return `<strong class="text-goldenrod font-semibold">${text}</strong>`;
};

// Custom code renderer for inline code
renderer.codespan = ({ text }) => {
    return `<code class="bg-cream dark:bg-dark-brown/50 px-2 py-1 rounded text-sm font-mono text-mint">${text}</code>`;
};

// Custom link renderer
renderer.link = ({ href, text }) => {
    return `<a href="${href}" class="text-goldenrod hover:text-goldenrod/80 underline">${text}</a>`;
};

marked.setOptions({
    gfm: true,
    breaks: true,
    renderer: renderer
});

export async function POST(req: NextRequest) {
    // Initialize OpenAI client (lazy initialization to avoid build-time errors)
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    try {
        const { text, targetLang, chapterId } = await req.json();

        if (!text || !targetLang) {
            return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
        }

        // Only support Urdu translation for now
        if (targetLang !== 'ur') {
            return NextResponse.json({ error: 'Only Urdu (ur) translation is supported' }, { status: 400 });
        }

        // Create cache key
        const cacheKey = `${chapterId || 'unknown'}_${targetLang}_${text.substring(0, 100)}`;

        // Check cache
        const cached = translationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached translation');
            return NextResponse.json({
                translatedText: cached.translatedText,
                cached: true
            });
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not configured in .env file');
            return NextResponse.json({
                error: 'Translation service not configured. Please add OPENAI_API_KEY to .env file.'
            }, { status: 500 });
        }

        // Call OpenAI API for translation
        console.log(`Translating chapter to Urdu using OpenAI...`);
        console.log(`API Key present: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
        console.log(`API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Using gpt-3.5-turbo instead of gpt-4 for better availability
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator specializing in technical content translation from English to Urdu.

Your task is to translate the provided markdown content to Urdu while:
1. Preserving all markdown formatting (headers, lists, code blocks, links, etc.)
2. Keeping technical terms in English when appropriate (e.g., ROS 2, NVIDIA Isaac, Python)
3. Maintaining the structure and readability
4. Using formal, educational Urdu suitable for a technical textbook
5. Keeping code snippets and commands unchanged
6. Translating only the descriptive text, not technical identifiers

Return ONLY the translated markdown content, nothing else.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3, // Lower temperature for more consistent translations
            max_tokens: 4000,
        });

        const markdownText = completion.choices[0]?.message?.content || '';

        if (!markdownText) {
            throw new Error('No translation received from OpenAI');
        }

        // Convert markdown to HTML
        const translatedText = await marked(markdownText);

        // Cache the translation (HTML)
        translationCache.set(cacheKey, {
            translatedText,
            timestamp: Date.now()
        });

        // Clean old cache entries (simple cleanup)
        if (translationCache.size > 100) {
            const now = Date.now();
            for (const [key, value] of Array.from(translationCache.entries())) {
                if (now - value.timestamp > CACHE_DURATION) {
                    translationCache.delete(key);
                }
            }
        }

        return NextResponse.json({
            translatedText,
            cached: false
        });

    } catch (error: any) {
        console.error('=== Translation API Error ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error status:', error?.status);
        console.error('Error code:', error?.code);
        console.error('Full error:', JSON.stringify(error, null, 2));
        console.error('============================');

        // Handle specific OpenAI errors
        if (error?.status === 401) {
            return NextResponse.json({ error: 'API authentication failed' }, { status: 500 });
        }
        if (error?.status === 429) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
        }

        return NextResponse.json({
            error: 'Translation failed. Please try again later.',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
