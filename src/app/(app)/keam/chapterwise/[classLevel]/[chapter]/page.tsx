'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, CheckCircle2, XCircle, Circle, Loader2, BookOpen } from 'lucide-react';
import { slugToChapter, allQuestionsWithClass, chapterToSlug, getClassLevel } from '@/data/questions';

interface QuestionItem {
    id: string;
    slug: string;
    title: string;
    chapter: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    userStatus: 'solved' | 'attempted' | 'unattempted';
}

export default function ChapterQuestionsPage({ params }: { params: Promise<{ classLevel: string; chapter: string }> }) {
    const resolvedParams = use(params);
    const classLevel = parseInt(resolvedParams.classLevel) as 11 | 12;
    const chapterSlug = resolvedParams.chapter;
    const chapterName = slugToChapter(chapterSlug) || chapterSlug;

    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`/api/questions?classLevel=${classLevel}&chapter=${encodeURIComponent(chapterName)}`);
                const data = await res.json();
                setQuestions(data.questions || []);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
                // Fallback to local data
                const localQ = allQuestionsWithClass
                    .filter(q => q.chapter === chapterName && q.class_level === classLevel)
                    .map(q => ({ ...q, id: q.slug, userStatus: 'unattempted' as const }));
                setQuestions(localQ);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [classLevel, chapterName]);

    const solved = questions.filter(q => q.userStatus === 'solved').length;
    const attempted = questions.filter(q => q.userStatus === 'attempted').length;
    const fresh = questions.filter(q => q.userStatus === 'unattempted').length;
    const total = questions.length;
    const subject = questions[0]?.subject || 'Unknown';

    const difficultyColors: Record<string, string> = {
        easy: 'text-green-500 bg-green-500/10',
        medium: 'text-yellow-500 bg-yellow-500/10',
        hard: 'text-red-500 bg-red-500/10',
    };

    const statusConfig = {
        solved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Solved' },
        attempted: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Attempted' },
        unattempted: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Fresh' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Link href="/keam" className="hover:text-foreground transition-colors">KEAM</Link>
                <ChevronRight size={14} />
                <Link href="/keam/chapterwise" className="hover:text-foreground transition-colors">Chapterwise</Link>
                <ChevronRight size={14} />
                <Link href={`/keam/chapterwise/${classLevel}`} className="hover:text-foreground transition-colors">
                    Class {classLevel}
                </Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">{chapterName}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/keam/chapterwise/${classLevel}`}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{chapterName}</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        {subject} • Class {classLevel} • {total} questions
                    </p>
                </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">{solved}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Solved</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{attempted}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Attempted</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{fresh}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Fresh</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">
                        {total > 0 ? Math.round((solved / total) * 100) : 0}%
                    </span>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${total > 0 ? (solved / total) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2">
                {questions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                        <h3 className="font-semibold text-lg mb-2">No questions yet</h3>
                        <p className="text-muted-foreground text-sm">Questions for this chapter will be added soon.</p>
                    </div>
                ) : (
                    questions.map((question, index) => {
                        const status = statusConfig[question.userStatus];
                        const StatusIcon = status.icon;

                        return (
                            <Link
                                key={question.id}
                                href={`/keam/chapterwise/${classLevel}/${chapterSlug}/${question.slug}`}
                                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                            >
                                {/* Status Icon */}
                                <div className={`flex-shrink-0 w-9 h-9 rounded-full ${status.bg} ${status.color} flex items-center justify-center`}>
                                    <StatusIcon size={18} />
                                </div>

                                {/* Question number + title */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-mono">Q{index + 1}</span>
                                        <h3 className="font-medium text-foreground truncate text-sm">{question.title}</h3>
                                    </div>
                                </div>

                                {/* Difficulty badge */}
                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${difficultyColors[question.difficulty]}`}>
                                    {question.difficulty}
                                </span>

                                {/* Arrow */}
                                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
