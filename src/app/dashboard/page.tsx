'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const subjects = [
    { name: 'Physics', chapters: 28, solved: 145, total: 500, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Chemistry', chapters: 30, solved: 210, total: 550, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { name: 'Mathematics', chapters: 25, solved: 110, total: 450, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
];

const dailyQuestions = [
    { id: 1, type: 'Easy', text: 'If a particle moves with constant velocity, its acceleration is:', subject: 'Physics' },
    { id: 2, type: 'Medium', text: 'Find the integration of sin(x) * cos(x) dx.', subject: 'Mathematics' },
    { id: 3, type: 'Hard', text: 'Explain the mechanism of SN1 reaction with an example.', subject: 'Chemistry' },
];

const mockTests = [
    { title: 'Full Syllabus Mock Test 1', duration: '3 Hours', difficulty: 'Hard', questions: 90 },
    { title: 'Physics Chapterwise Test: Waves', duration: '1 Hour', difficulty: 'Medium', questions: 30 },
    { title: 'Chemistry: Organic Full Test', duration: '1.5 Hours', difficulty: 'Medium', questions: 45 },
];

export default function DashboardOverview() {
    const [profileComplete, setProfileComplete] = useState(false); // Simulate incomplete profile

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Profile Completion Alert */}
            {!profileComplete && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 flex items-start gap-4">
                    <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-500">
                        <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">Complete your profile</h3>
                        <p className="text-muted-foreground text-sm mb-3">Please provide your target exam and current class to get personalized recommendations.</p>
                        <Link href="/dashboard/profile" className="text-sm font-semibold text-yellow-500 hover:text-yellow-600 hover:underline">
                            Go to Profile &rarr;
                        </Link>
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Left Column: Main Content */}
                <div className="flex-1 space-y-8">

                    {/* Daily Challenge - LeetCode Style */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Target className="text-primary" /> Daily Challenge
                            </h2>
                            <span className="text-sm text-muted-foreground">3 Questions Left</span>
                        </div>
                        <div className="space-y-3">
                            {dailyQuestions.map((q) => (
                                <div key={q.id} className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide
                                            ${q.type === 'Easy' ? 'bg-green-500/10 text-green-500' :
                                                        q.type === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-red-500/10 text-red-500'}`}>
                                                    {q.type}
                                                </span>
                                                <span className="text-xs text-muted-foreground">• {q.subject}</span>
                                            </div>
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {q.text}
                                            </h3>
                                        </div>
                                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Continue Learning */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground">Continue Practice</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {subjects.map((sub) => (
                                <div key={sub.name} className={`rounded-xl border ${sub.border} ${sub.bg} p-5 relative overflow-hidden group cursor-pointer`}>
                                    <div className="relative z-10">
                                        <h3 className={`font-bold text-lg mb-1 ${sub.color}`}>{sub.name}</h3>
                                        <div className="text-sm text-muted-foreground mb-4">
                                            {sub.solved} / {sub.total} Questions
                                        </div>
                                        <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${sub.name === 'Physics' ? 'bg-blue-500' : sub.name === 'Chemistry' ? 'bg-purple-500' : 'bg-pink-500'}`}
                                                style={{ width: `${(sub.solved / sub.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${sub.name === 'Physics' ? 'bg-blue-500' : sub.name === 'Chemistry' ? 'bg-purple-500' : 'bg-pink-500'}`} />
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Right Column: Mock Tests & Updates */}
                <div className="w-full xl:w-1/3 space-y-8">
                    <section className="rounded-2xl border border-border bg-card p-6 h-full">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <BookOpen className="text-primary" /> Mock Tests
                        </h2>
                        <div className="space-y-4">
                            {mockTests.map((test, i) => (
                                <div key={i} className="rounded-xl border border-border bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-foreground text-sm line-clamp-2">{test.title}</h4>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-background
                                      ${test.difficulty === 'Hard' ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {test.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {test.duration}</span>
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {test.questions} Qs</span>
                                    </div>
                                    <button className="mt-3 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                                        Start Test
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Link href="/dashboard/mock-tests" className="mt-4 block text-center text-sm font-medium text-primary hover:underline">
                            View All Tests
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
