import { NextResponse } from 'next/server';

export async function GET() {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const data = {
        stats: [
            { label: 'Total Questions', value: '3,248', change: '+12%', trend: 'up' },
            { label: 'Accuracy Rate', value: '86.4%', change: '+2.1%', trend: 'up' },
            { label: 'Study Time', value: '42h', change: '-5%', trend: 'down' },
            { label: 'Tests Taken', value: '24', change: '+4', trend: 'up' },
        ],
        radarData: [
            { subject: 'Physics', A: 90, fullMark: 100 },
            { subject: 'Chemistry', A: 78, fullMark: 100 },
            { subject: 'Mathematics', A: 72, fullMark: 100 },
            { subject: 'Biology', A: 85, fullMark: 100 },
            { subject: 'English', A: 65, fullMark: 100 },
        ],
        subjects: [
            { name: 'Physics', accuracy: '90.00%', questions: 32, strong: 'Kinematics', weak: 'Thermodynamics' },
            { name: 'Chemistry', accuracy: '96.00%', questions: 33, strong: 'Organic', weak: 'Solutions' },
            { name: 'Math', accuracy: '96.00%', questions: 22, strong: 'Calculus', weak: 'Vectors' },
        ],
        recentTests: [
            { name: 'Last Few Mock Test 1', date: 'Oct 19, 2023', score: 80.00, accuracy: '96.00%' },
            { name: 'Last Few Mock Test 2', date: 'Oct 27, 2023', score: 78.00, accuracy: '75.00%' },
            { name: 'Last Few Mock Test 3', date: 'Oct 17, 2023', score: 72.00, accuracy: '70.00%' },
        ]
    };

    return NextResponse.json(data);
}
