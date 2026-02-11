'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, CheckCircle2, Circle, Atom, FlaskConical, Calculator, BookOpen, Loader2 } from 'lucide-react';
import { allQuestionsWithClass, chapterToSlug, getClassLevel } from '@/data/questions';

interface QuestionWithProgress {
    id: string;
    slug: string;
    chapter: string;
    subject: string;
    class_level: number;
    userStatus: 'solved' | 'attempted' | 'unattempted';
}

export default function ClassChaptersPage({ params }: { params: Promise<{ classLevel: string }> }) {
    const resolvedParams = use(params);
    const classLevel = parseInt(resolvedParams.classLevel) as 11 | 12;
    const [questions, setQuestions] = useState<QuestionWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string>('all');

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`/api/questions?classLevel=${classLevel}`);
                const data = await res.json();
                setQuestions(data.questions || []);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
                // Fallback to local data
                const localQ = allQuestionsWithClass
                    .filter(q => q.class_level === classLevel)
                    .map(q => ({ ...q, id: q.slug, userStatus: 'unattempted' as const }));
                setQuestions(localQ);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [classLevel]);

    // Get unique chapters grouped by subject
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const subjectIcons: Record<string, React.ElementType> = {
        'Physics': Atom,
        'Chemistry': FlaskConical,
        'Mathematics': Calculator,
    };
    const subjectColors: Record<string, string> = {
        'Physics': 'text-blue-500 bg-blue-500/10',
        'Chemistry': 'text-green-500 bg-green-500/10',
        'Mathematics': 'text-orange-500 bg-orange-500/10',
    };

    const getChapterData = () => {
        const chapterMap = new Map<string, {
            chapter: string;
            subject: string;
            total: number;
            solved: number;
            attempted: number;
        }>();

        questions.forEach(q => {
            const key = q.chapter;
            if (!chapterMap.has(key)) {
                chapterMap.set(key, {
                    chapter: q.chapter,
                    subject: q.subject,
                    total: 0,
                    solved: 0,
                    attempted: 0,
                });
            }
            const data = chapterMap.get(key)!;
            data.total++;
            if (q.userStatus === 'solved') data.solved++;
            else if (q.userStatus === 'attempted') data.attempted++;
        });

        let chapters = Array.from(chapterMap.values());
        if (activeSubject !== 'all') {
            chapters = chapters.filter(c => c.subject === activeSubject);
        }
        return chapters;
    };

    const chapters = getChapterData();
    const totalSolved = questions.filter(q => q.userStatus === 'solved').length;
    const totalQuestions = questions.length;

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/keam" className="hover:text-foreground transition-colors">KEAM</Link>
                <ChevronRight size={14} />
                <Link href="/keam/chapterwise" className="hover:text-foreground transition-colors">Chapterwise</Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">Class {classLevel}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/keam/chapterwise"
                    className="p-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground">Class {classLevel} Chapters</h1>
                    <p className="text-muted-foreground mt-1">
                        {totalSolved}/{totalQuestions} questions solved across {chapters.length} chapters
                    </p>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                        {totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0}%
                    </span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${totalQuestions > 0 ? (totalSolved / totalQuestions) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Subject Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveSubject('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeSubject === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All Subjects
                </button>
                {subjects.map(subject => {
                    const Icon = subjectIcons[subject];
                    const hasQuestions = questions.some(q => q.subject === subject);
                    if (!hasQuestions) return null;
                    return (
                        <button
                            key={subject}
                            onClick={() => setActiveSubject(subject)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeSubject === subject
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon size={16} />
                            {subject}
                        </button>
                    );
                })}
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
                {chapters.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                        <h3 className="font-semibold text-lg mb-2">No chapters found</h3>
                        <p className="text-muted-foreground text-sm">
                            No questions available for this class level yet.
                        </p>
                    </div>
                ) : (
                    chapters.map((chapter, index) => {
                        const Icon = subjectIcons[chapter.subject] || BookOpen;
                        const colorClass = subjectColors[chapter.subject] || 'text-primary bg-primary/10';
                        const progress = chapter.total > 0 ? (chapter.solved / chapter.total) * 100 : 0;
                        const isComplete = chapter.solved === chapter.total && chapter.total > 0;

                        return (
                            <Link
                                key={chapter.chapter}
                                href={`/keam/chapterwise/${classLevel}/${chapterToSlug(chapter.chapter)}`}
                                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                            >
                                {/* Chapter Number + Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                                    {isComplete ? (
                                        <CheckCircle2 size={22} />
                                    ) : (
                                        <Icon size={22} />
                                    )}
                                </div>

                                {/* Chapter Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground truncate">{chapter.chapter}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{chapter.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span>{chapter.total} questions</span>
                                        {chapter.solved > 0 && (
                                            <span className="text-green-500 font-medium">{chapter.solved} solved</span>
                                        )}
                                        {chapter.attempted > 0 && (
                                            <span className="text-red-500 font-medium">{chapter.attempted} attempted</span>
                                        )}
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
