'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Clock, Trophy, ChevronRight,
    Atom, FlaskConical, Calculator, FileText, History
} from 'lucide-react';

const sections = [
    {
        id: 'chapterwise',
        title: 'Chapterwise Practice',
        description: 'Practice questions chapter by chapter',
        icon: BookOpen,
        href: '/keam/chapterwise',
        available: true,
    },
    {
        id: 'mocktest',
        title: 'Mock Tests',
        description: 'Full-length timed mock tests',
        icon: Clock,
        href: '/keam/mocktest',
        available: true,
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
                            {!section.available && (
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

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
                <h3 className="text-lg font-semibold mb-4">About KEAM</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total Marks:</span>
                        <span className="ml-2 font-medium">480</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">2.5 Hours per paper</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Subjects:</span>
                        <span className="ml-2 font-medium">Physics, Chemistry, Mathematics</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
