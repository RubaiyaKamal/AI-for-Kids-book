import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { profileStore } from '@/lib/profile-store';

export async function POST(req: NextRequest) {
    try {
        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { software_experience, hardware_experience, interests } = await req.json();

        // Store in in-memory store
        await profileStore.set(session.user.id, {
            software_experience,
            hardware_experience,
            interests
        });

        console.log('User profile saved:', {
            userId: session.user.id,
            software_experience,
            hardware_experience,
            interests
        });

        return NextResponse.json({
            success: true,
            message: 'Profile saved successfully'
        });
    } catch (error: any) {
        console.error('User profile API error:', error);
        return NextResponse.json({
            error: 'Failed to save profile',
            details: error?.message
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await profileStore.get(session.user.id);

        if (!profile) {
            return NextResponse.json({
                software_experience: '',
                hardware_experience: '',
                interests: []
            });
        }

        return NextResponse.json({
            software_experience: profile.software_experience,
            hardware_experience: profile.hardware_experience,
            interests: profile.interests
        });
    } catch (error: any) {
        console.error('User profile GET error:', error);
        return NextResponse.json({
            error: 'Failed to fetch profile',
            details: error?.message
        }, { status: 500 });
    }
}
