import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function POST() {
    const supabase = await createClient();

    try {
        // First, check if slug column exists by trying a simple query
        const { data: testData, error: testError } = await supabase
            .from('questions')
            .select('id')
            .limit(1);

        // Check for slug column by attempting to select it
        const { error: slugCheckError } = await supabase
            .from('questions')
            .select('slug')
            .limit(1);

        const hasSlugColumn = !slugCheckError || !slugCheckError.message.includes("slug");

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        if (hasSlugColumn) {
            // Database has slug column - use upsert with slug
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
                    errorCount++;
                    errors.push(`${q.slug}: ${error.message}`);
                } else {
                    successCount++;
                }
            }
        } else {
            // Database doesn't have slug column - need to add columns first via SQL
            // Since we can't run ALTER TABLE via API, we'll try inserting without slug/title
            // and use question_text for uniqueness check

            // First clear existing questions to avoid duplicates
            // Then insert fresh

            for (const q of allQuestions) {
                // Check if question already exists by question_text
                const { data: existing } = await supabase
                    .from('questions')
                    .select('id')
                    .eq('question_text', q.question_text)
                    .eq('subject', q.subject)
                    .single();

                if (existing) {
                    // Update existing
                    const { error } = await supabase
                        .from('questions')
                        .update({
                            exam: q.exam,
                            chapter: q.chapter,
                            options: JSON.stringify(q.options),
                            correct_answer: q.correct_answer,
                            explanation: q.explanation,
                            difficulty: q.difficulty,
                            hints: JSON.stringify(q.hints),
                        })
                        .eq('id', existing.id);

                    if (error) {
                        errorCount++;
                        errors.push(`Update ${q.slug}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                } else {
                    // Insert new
                    const { error } = await supabase
                        .from('questions')
                        .insert({
                            exam: q.exam,
                            subject: q.subject,
                            chapter: q.chapter,
                            question_text: q.question_text,
                            options: JSON.stringify(q.options),
                            correct_answer: q.correct_answer,
                            explanation: q.explanation,
                            difficulty: q.difficulty,
                            hints: JSON.stringify(q.hints),
                        });

                    if (error) {
                        errorCount++;
                        errors.push(`Insert ${q.slug}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: errorCount === 0,
            message: `Seeded ${successCount}/${allQuestions.length} questions`,
            hasSlugColumn,
            errors: errors.slice(0, 10), // Only show first 10 errors
            tip: !hasSlugColumn ? 'Run the supabase-schema.sql to add slug/title columns for better functionality' : undefined
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({
            error: 'Failed to seed questions',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    const supabase = await createClient();

    // Check current status
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, subject, chapter')
        .eq('exam', 'KEAM');

    const chapters: Record<string, Set<string>> = {};
    questions?.forEach(q => {
        if (!chapters[q.subject]) chapters[q.subject] = new Set();
        chapters[q.subject].add(q.chapter);
    });

    const chapterSummary: Record<string, string[]> = {};
    Object.entries(chapters).forEach(([subject, chapterSet]) => {
        chapterSummary[subject] = Array.from(chapterSet);
    });

    return NextResponse.json({
        message: 'Use POST to seed the database',
        localQuestions: allQuestions.length,
        databaseQuestions: questions?.length || 0,
        chaptersBySubject: chapterSummary,
        needsSeed: (questions?.length || 0) < allQuestions.length
    });
}
