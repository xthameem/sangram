'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Clock, Trophy, ChevronRight,
    Atom, FlaskConical, Calculator, History, Zap, Target
} from 'lucide-react';

const sections = [
    {
        id: 'chapterwise',
        title: 'Chapterwise Practice',
        description: 'Practice questions chapter by chapter (+1 point per correct)',
        icon: BookOpen,
        href: '/keam/chapterwise',
        available: true,
        badge: '+1 pt',
        badgeColor: 'bg-blue-500/10 text-blue-500',
    },
    {
        id: 'mocktest',
        title: 'Mock Tests',
        description: 'Full-length timed tests with anti-cheating (2x points!)',
        icon: Clock,
        href: '/keam/mocktest',
        available: true,
        badge: '2x pts',
        badgeColor: 'bg-purple-500/10 text-purple-500',
    },
    {
        id: 'pyq',
        title: 'Previous Year Questions',
        description: 'Solve actual KEAM questions from past years',
        icon: History,
        href: '/keam/pyq',
        available: false,
    },
];

const mockTests = [
    {
        id: 1,
        name: 'Mock Test 1',
        questions: 40,
        duration: '2.5 hours',
        subjects: 'Physics, Chemistry, Maths',
        difficulty: 'Mixed',
        status: 'available',
    },
    {
        id: 2,
        name: 'Mock Test 2',
        questions: 40,
        duration: '2.5 hours',
        subjects: 'Physics, Chemistry, Maths',
        difficulty: 'Medium-Hard',
        status: 'available',
    },
];

export default function KEAMPage() {
    const router = useRouter();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">KEAM Preparation</h1>
                <p className="text-muted-foreground mt-1">
                    Kerala Engineering, Architecture & Medical Entrance Exam
                </p>
            </div>

            {/* Practice Sections */}
            <div className="grid md:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        onClick={() => section.available && router.push(section.href)}
                        className={`rounded-2xl border p-6 transition-all ${section.available
                            ? 'border-border bg-card hover:shadow-lg hover:border-primary/30 cursor-pointer'
                            : 'border-border bg-card/50 opacity-60'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <section.icon size={28} />
                            </div>
                            {section.badge ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${section.badgeColor}`}>
                                    {section.badge}
                                </span>
                            ) : !section.available && (
                                <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                                    Coming Soon
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                        {section.available && (
                            <div className="mt-4 flex items-center text-primary text-sm font-medium">
                                Start Practice <ChevronRight size={16} className="ml-1" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Available Mock Tests */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    Available Mock Tests
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {mockTests.map((test) => (
                        <Link
                            key={test.id}
                            href="/keam/mocktest"
                            className="rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold">{test.name}</h4>
                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                                    Ready
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Target size={14} />
                                    <span>{test.questions} questions</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{test.duration}</span>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                                {test.subjects} • {test.difficulty}
                            </div>
                            <div className="mt-3 text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Start Test <ChevronRight size={14} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
                <h3 className="text-lg font-semibold mb-4">About KEAM</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-background/50">
                        <span className="text-muted-foreground block">Total Marks</span>
                        <span className="text-xl font-bold">480</span>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                        <span className="text-muted-foreground block">Duration</span>
                        <span className="text-xl font-bold">2.5 hrs</span>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                        <span className="text-muted-foreground block">Marking</span>
                        <span className="text-xl font-bold">+4 / -1</span>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                        <span className="text-muted-foreground block">Questions</span>
                        <span className="text-xl font-bold">120</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
