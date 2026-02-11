import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestionsWithClass, getClassLevel } from '@/data/questions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const classLevel = searchParams.get('classLevel');
    const exam = searchParams.get('exam') || 'KEAM';

    // 1. Start with Local Questions as Source of Truth
    let questions = allQuestionsWithClass.filter(q => q.exam === exam);

    if (classLevel) {
        questions = questions.filter(q => q.class_level === parseInt(classLevel));
    }
    if (subject) {
        questions = questions.filter(q => q.subject === subject);
    }
    if (chapter) {
        questions = questions.filter(q => q.chapter === chapter);
    }
    if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // 2. Fetch User Progress from DB
            const { data: dbQuestions } = await supabase
                .from('questions')
                .select('id, slug, question_text')
                .eq('exam', exam);

            const dbIdMap = new Map<string, string>();
            if (dbQuestions) {
                dbQuestions.forEach(q => {
                    if (q.slug) dbIdMap.set(q.slug, q.id);
                    dbIdMap.set(q.question_text, q.id);
                });
            }

            const { data: userProgress } = await supabase
                .from('user_progress')
                .select('question_id, is_correct')
                .eq('user_id', user.id);

            const progressMap = new Map<string, boolean>();
            if (userProgress) {
                userProgress.forEach(p => {
                    progressMap.set(p.question_id, p.is_correct);
                });
            }

            // 3. Merge Progress into Local Questions
            const questionsWithProgress = questions.map(localQ => {
                const dbId = dbIdMap.get(localQ.slug) || dbIdMap.get(localQ.question_text);
                let userStatus: 'solved' | 'attempted' | 'unattempted' = 'unattempted';
                if (dbId && progressMap.has(dbId)) {
                    userStatus = progressMap.get(dbId) ? 'solved' : 'attempted';
                }

                return {
                    ...localQ,
                    id: localQ.slug,
                    dbId: dbId,
                    userStatus: userStatus,
                    class_level: localQ.class_level || getClassLevel(localQ.chapter),
                };
            });

            return NextResponse.json({
                questions: questionsWithProgress,
                total: questionsWithProgress.length
            });
        }
    } catch (error) {
        console.error('Supabase error, using local data only:', error);
    }

    // 4. Fallback (No DB/Auth or Error)
    const questionsWithProgress = questions.map(q => ({
        ...q,
        id: q.slug,
        userStatus: 'unattempted' as const,
        class_level: q.class_level || getClassLevel(q.chapter),
    }));

    return NextResponse.json({
        questions: questionsWithProgress,
        total: questionsWithProgress.length
    });
}
