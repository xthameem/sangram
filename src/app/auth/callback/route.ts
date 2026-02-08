import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Get the origin from the request, this will work correctly in production
    const origin = requestUrl.origin;

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', origin));
}
