import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function GET() {
    // For mock test, we'll use questions from our local data
    // Shuffle and select questions for a balanced test

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

    // Select questions for mock test (aim for 40 questions)
    // In real KEAM, there are 120 questions (60 each for Physics+Chemistry and Mathematics)
    // For now, we'll use all available physics questions
    const mockTestQuestions = shuffled.slice(0, Math.min(40, shuffled.length));

    // Format for frontend
    const formattedQuestions = mockTestQuestions.map(q => ({
        id: q.slug,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        chapter: q.chapter,
        subject: q.subject,
    }));

    return NextResponse.json({
        questions: formattedQuestions,
        total: formattedQuestions.length,
        duration: 150 * 60, // 2.5 hours in seconds
        examName: 'KEAM Mock Test'
    });
}
