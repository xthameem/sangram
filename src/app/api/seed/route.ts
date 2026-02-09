import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function POST() {
    const supabase = await createClient();

    try {
        // Insert questions
        for (const q of allQuestions) {
            const { error } = await supabase
                .from('questions')
                .upsert({
                    slug: q.slug,
                    title: q.title,
                    exam: q.exam,
                    subject: q.subject,
                    chapter: q.chapter,
                    topic: q.topic,
                    question_text: q.question_text,
                    options: JSON.stringify(q.options),
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    hints: JSON.stringify(q.hints),
                    source: q.source || null,
                    year: q.year || null,
                }, { onConflict: 'slug' });

            if (error) {
                console.error(`Error inserting question ${q.slug}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${allQuestions.length} questions successfully`
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Failed to seed questions' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to seed the database',
        totalQuestions: allQuestions.length
    });
}
