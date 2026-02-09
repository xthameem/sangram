'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, XCircle, Flag, AlertTriangle, Shield, Trophy, Zap, MessageSquare, X } from 'lucide-react';

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    chapter: string;
    subject: string;
}

interface Answer {
    questionId: string;
    selectedAnswer: string | null;
    isMarkedForReview: boolean;
}

type TestStage = 'confirm' | 'instructions' | 'test' | 'results';

export default function MockTestPage() {
    const [stage, setStage] = useState<TestStage>('confirm');
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(150 * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/mocktest');
                if (res.ok) {
                    const data = await res.json();
                    if (data.questions?.length > 0) {
                        const parsed = data.questions.map((q: Question) => ({
                            ...q,
                            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                        }));
                        setQuestions(parsed);
                        setAnswers(parsed.map((q: Question) => ({
                            questionId: q.id,
                            selectedAnswer: null,
                            isMarkedForReview: false
                        })));
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Anti-cheating: Detect tab switch
    useEffect(() => {
        if (stage !== 'test' || isSubmitted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        setWarningMessage('⚠️ Test auto-submitted due to repeated tab switching!');
                        setShowWarning(true);
                        setTimeout(() => handleSubmit(), 2000);
                    } else {
                        setWarningMessage(`⚠️ Warning ${newCount}/3: Tab switching detected! Test will auto-submit after 3 warnings.`);
                        setShowWarning(true);
                        setTimeout(() => setShowWarning(false), 3000);
                    }
                    return newCount;
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [stage, isSubmitted]);

    // Anti-cheating: Disable copy/paste/right-click
    useEffect(() => {
        if (stage !== 'test' || isSubmitted) return;

        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            setWarningMessage('⚠️ Copying is disabled during the test!');
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 2000);
        };

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setWarningMessage('⚠️ Right-click is disabled during the test!');
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 2000);
        };

        const preventKeyboard = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
                e.preventDefault();
                setWarningMessage('⚠️ Keyboard shortcuts are disabled!');
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 2000);
            }
        };

        document.addEventListener('copy', preventCopy);
        document.addEventListener('paste', preventCopy);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('keydown', preventKeyboard);

        return () => {
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('paste', preventCopy);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('keydown', preventKeyboard);
        };
    }, [stage, isSubmitted]);

    // Timer
    useEffect(() => {
        if (stage !== 'test' || isSubmitted || timeRemaining <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [stage, isSubmitted]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (answer: string) => {
        if (isSubmitted) return;
        const newAnswers = [...answers];
        newAnswers[currentIndex].selectedAnswer = answer;
        setAnswers(newAnswers);
    };

    const handleMarkForReview = () => {
        const newAnswers = [...answers];
        newAnswers[currentIndex].isMarkedForReview = !newAnswers[currentIndex].isMarkedForReview;
        setAnswers(newAnswers);
    };

    const handleSubmit = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSubmitted(true);
        setStage('results');
    }, []);

    const calculateScore = () => {
        let correct = 0, wrong = 0, unattempted = 0;
        questions.forEach((q, idx) => {
            const ans = answers[idx];
            if (!ans?.selectedAnswer) unattempted++;
            else if (ans.selectedAnswer === q.correct_answer) correct++;
            else wrong++;
        });
        const score = correct * 4 - wrong;
        const leaderboardPoints = Math.max(0, score * 2 + correct * 3);
        return { correct, wrong, unattempted, score, total: questions.length * 4, leaderboardPoints };
    };

    const getQuestionStatus = (idx: number) => {
        const ans = answers[idx];
        if (ans?.isMarkedForReview && ans?.selectedAnswer) return 'review-answered';
        if (ans?.isMarkedForReview) return 'review';
        if (ans?.selectedAnswer) return 'answered';
        return 'not-visited';
    };

    const handleReport = () => {
        setReportSubmitted(true);
        setTimeout(() => {
            setShowReportModal(false);
            setReportReason('');
            setReportSubmitted(false);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Mock Test Available</h2>
                <Link href="/keam" className="text-primary hover:underline">Back to KEAM</Link>
            </div>
        );
    }

    // Stage 1: Confirmation
    if (stage === 'confirm') {
        return (
            <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-8">
                    <div className="text-center mb-6">
                        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={56} />
                        <h1 className="text-2xl font-bold mb-2">Are you ready?</h1>
                        <p className="text-muted-foreground">This is a serious examination simulation</p>
                    </div>

                    <div className="space-y-3 mb-8 text-sm">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                            <Clock className="text-primary mt-0.5" size={18} />
                            <div><strong>2.5 hours</strong> - Once started, timer cannot be paused</div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                            <Shield className="text-red-500 mt-0.5" size={18} />
                            <div><strong>Anti-cheating</strong> - Tab switching, copy-paste disabled</div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                            <Trophy className="text-yellow-500 mt-0.5" size={18} />
                            <div><strong>2x Points</strong> - Mock tests give double leaderboard points!</div>
                        </div>
                    </div>

                    <p className="text-center text-muted-foreground mb-6">Do you want to proceed?</p>

                    <div className="flex gap-4">
                        <Link href="/keam" className="flex-1 py-3 rounded-xl border border-border text-center hover:bg-secondary transition-colors">
                            Not Now
                        </Link>
                        <button onClick={() => setStage('instructions')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:opacity-90 transition-opacity">
                            YES, I&apos;m Ready
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Stage 2: Instructions
    if (stage === 'instructions') {
        return (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-border bg-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-primary/10"><Zap className="text-primary" size={24} /></div>
                        <div>
                            <h1 className="text-2xl font-bold">KEAM Mock Test</h1>
                            <p className="text-muted-foreground">Instructions & Benefits</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="rounded-xl bg-secondary/50 p-4 text-center">
                            <p className="text-3xl font-bold text-primary">{questions.length}</p>
                            <p className="text-sm text-muted-foreground">Questions</p>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-4 text-center">
                            <p className="text-3xl font-bold text-primary">2:30:00</p>
                            <p className="text-sm text-muted-foreground">Duration</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <h3 className="font-semibold">Marking Scheme:</h3>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                                <p className="text-green-500 font-bold">+4</p><p>Correct</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                <p className="text-red-500 font-bold">-1</p><p>Wrong</p>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                                <p className="text-yellow-500 font-bold">0</p><p>Skipped</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 mb-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                            <Trophy className="text-yellow-500" size={18} />Leaderboard Benefits
                        </h3>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• <strong>2x points</strong> for mock test scores</li>
                            <li>• <strong>+3 bonus</strong> points per correct answer</li>
                            <li>• Higher rank visibility on leaderboard</li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                        <h3 className="font-semibold text-red-500 mb-2">⚠️ Rules:</h3>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Tab switching will trigger warnings (3 = auto-submit)</li>
                            <li>• Copy/paste and right-click are disabled</li>
                            <li>• Test auto-submits when time expires</li>
                        </ul>
                    </div>

                    <button onClick={() => setStage('test')} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity">
                        Start Test Now
                    </button>
                </div>
            </div>
        );
    }

    // Stage 4: Results
    if (stage === 'results') {
        const { correct, wrong, unattempted, score, total, leaderboardPoints } = calculateScore();
        const percentage = Math.max(0, Math.round((score / total) * 100));

        return (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-border bg-card p-8">
                    <h1 className="text-3xl font-bold text-center mb-6">Test Results</h1>

                    <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="12" />
                                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" className="text-primary" strokeWidth="12"
                                    strokeDasharray={440} strokeDashoffset={440 - (440 * Math.max(0, percentage)) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{score}</span>
                                <span className="text-sm text-muted-foreground">/ {total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                            <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-green-500">{correct}</p>
                            <p className="text-xs text-muted-foreground">Correct</p>
                        </div>
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
                            <XCircle className="mx-auto text-red-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-red-500">{wrong}</p>
                            <p className="text-xs text-muted-foreground">Wrong</p>
                        </div>
                        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center">
                            <AlertCircle className="mx-auto text-yellow-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-yellow-500">{unattempted}</p>
                            <p className="text-xs text-muted-foreground">Skipped</p>
                        </div>
                        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-4 text-center">
                            <Trophy className="mx-auto text-purple-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-purple-500">+{leaderboardPoints}</p>
                            <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                    </div>

                    {tabSwitchCount > 0 && (
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-6 text-center">
                            <p className="text-orange-500">⚠️ Tab switch warnings: {tabSwitchCount}/3</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button onClick={() => { setStage('test'); setIsSubmitted(false); }} className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary transition-colors">
                            Review Answers
                        </button>
                        <Link href="/leaderboard" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center font-medium hover:opacity-90">
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Stage 3: Test
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];

    return (
        <div className="max-w-6xl mx-auto select-none">
            {/* Warning Toast */}
            {showWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg animate-in fade-in slide-in-from-top-4">
                    {warningMessage}
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 mb-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="font-semibold">KEAM Mock Test</h1>
                        {tabSwitchCount > 0 && (
                            <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-500 text-xs">
                                ⚠️ {tabSwitchCount}/3
                            </span>
                        )}
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                        <Clock size={18} />
                        <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Question Panel */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">Question {currentIndex + 1} / {questions.length}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    title="Report issue"
                                >
                                    <MessageSquare size={12} />
                                    Report
                                </button>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                                    currentQuestion.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>{currentQuestion.difficulty}</span>
                                <span className="text-xs text-muted-foreground">{currentQuestion.chapter}</span>
                            </div>
                        </div>

                        <h2 className="text-lg font-medium leading-relaxed mb-6">{currentQuestion.question_text}</h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => {
                                const optionLetter = String.fromCharCode(65 + idx);
                                const isSelected = currentAnswer?.selectedAnswer === optionLetter;
                                const isCorrect = isSubmitted && currentQuestion.correct_answer === optionLetter;
                                const isWrong = isSubmitted && isSelected && currentQuestion.correct_answer !== optionLetter;

                                let optionClass = 'border-border hover:border-primary/50';
                                if (isSubmitted) {
                                    if (isCorrect) optionClass = 'border-green-500 bg-green-500/10';
                                    else if (isWrong) optionClass = 'border-red-500 bg-red-500/10';
                                } else if (isSelected) {
                                    optionClass = 'border-primary bg-primary/10';
                                }

                                return (
                                    <button key={idx} onClick={() => handleAnswerSelect(optionLetter)} disabled={isSubmitted}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${optionClass}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${isSubmitted && isCorrect ? 'bg-green-500 text-white' :
                                                isSubmitted && isWrong ? 'bg-red-500 text-white' :
                                                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                                                }`}>{optionLetter}</div>
                                            <span className="flex-1">{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {isSubmitted && currentQuestion.explanation && (
                            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                                <h4 className="font-medium mb-2">Explanation</h4>
                                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleMarkForReview} disabled={isSubmitted}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${currentAnswer?.isMarkedForReview ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'border-border hover:bg-secondary'
                                }`}>
                            <Flag size={16} />{currentAnswer?.isMarkedForReview ? 'Marked' : 'Mark for Review'}
                        </button>
                        <div className="flex-1"></div>
                        <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border hover:bg-secondary disabled:opacity-50">
                            <ChevronLeft size={18} /> Previous
                        </button>
                        {currentIndex < questions.length - 1 ? (
                            <button onClick={() => setCurrentIndex(currentIndex + 1)}
                                className="flex items-center gap-1 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                                Next <ChevronRight size={18} />
                            </button>
                        ) : !isSubmitted ? (
                            <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600">
                                Submit Test
                            </button>
                        ) : (
                            <button onClick={() => setStage('results')} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground">
                                View Results
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Navigator */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-border bg-card p-4 sticky top-20">
                        <h3 className="font-semibold mb-3">Navigator</h3>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {questions.map((_, idx) => {
                                const status = getQuestionStatus(idx);
                                let btnClass = 'bg-secondary text-muted-foreground';
                                if (idx === currentIndex) btnClass = 'ring-2 ring-primary bg-primary/20 text-primary';
                                else if (status === 'answered') btnClass = 'bg-green-500 text-white';
                                else if (status === 'review') btnClass = 'bg-purple-500 text-white';
                                else if (status === 'review-answered') btnClass = 'bg-purple-500 text-white ring-2 ring-green-500';

                                return (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${btnClass}`}>
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-2 text-xs mb-4">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary"></div><span>Not Attempted</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div><span>Answered</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500"></div><span>Marked</span></div>
                        </div>
                        {!isSubmitted && (
                            <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90">
                                Submit Test
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <MessageSquare className="text-primary" size={20} />
                                Report Question Issue
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="p-1 rounded hover:bg-secondary">
                                <X size={20} />
                            </button>
                        </div>

                        {reportSubmitted ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
                                <p className="font-medium">Report Submitted!</p>
                                <p className="text-sm text-muted-foreground">Thank you for helping us improve.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Question {currentIndex + 1}: Report any issues to help us improve.
                                </p>
                                <div className="space-y-2 mb-4">
                                    {['Wrong answer marked as correct', 'Typo in question/options', 'Unclear question', 'Wrong explanation', 'Other'].map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => setReportReason(reason)}
                                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${reportReason === reason ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-secondary border border-border'
                                                }`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleReport}
                                    disabled={!reportReason}
                                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    Submit Report
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
