import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const summaryData = await kv.get('summary:uk-wide');

        if (!summaryData) {
            return NextResponse.json({ message: 'UK-wide summary not found.' }, { status: 404 });
        }

        // The data is stored as a string, so we need to parse it
        return NextResponse.json(JSON.parse(summaryData as string));

    } catch (error) {
        console.error('Error fetching summary:', error);
        return NextResponse.json(
            { message: 'Error fetching summary', error: (error as Error).message }, 
            { status: 500 }
        );
    }
} 