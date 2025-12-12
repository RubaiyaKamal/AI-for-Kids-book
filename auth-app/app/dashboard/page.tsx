"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
    software_experience: string;
    hardware_experience: string;
    interests?: string[];
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/signin");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        async function fetchProfile() {
            if (session?.user) {
                try {
                    const response = await fetch("/api/profile");
                    if (response.ok) {
                        const data = await response.json();
                        setProfile(data.profile);
                    }
                } catch (error) {
                    console.error("Failed to fetch profile:", error);
                } finally {
                    setLoadingProfile(false);
                }
            }
        }
        fetchProfile();
    }, [session]);

    if (isPending || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warm-white dark:bg-dark-brown">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod dark:border-goldenrod"></div>
            </div>
        );
    }

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    return (
        <div className="min-h-screen bg-warm-white dark:bg-dark-brown">
            <nav className="bg-cream dark:bg-dark-brown border-b border-dark-brown/10 dark:border-cream/10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-dark-brown dark:text-cream">
                                Physical AI Course
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-dark-brown dark:text-cream">
                                Welcome, {session.user.email}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-cream dark:bg-dark-brown overflow-hidden shadow rounded-lg divide-y divide-dark-brown/10 dark:divide-cream/10 border border-dark-brown/10 dark:border-cream/10">
                        <div className="px-4 py-5 sm:px-6">
                            <h2 className="text-lg font-medium text-dark-brown dark:text-cream">
                                Your Learning Profile
                            </h2>
                            <p className="mt-1 text-sm text-dark-brown/70 dark:text-cream/70">
                                Based on your background, we've personalized your content.
                            </p>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {profile ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <h3 className="text-sm font-medium text-dark-brown/60 dark:text-cream/60 uppercase tracking-wider">
                                            Software Background
                                        </h3>
                                        <dl className="mt-2 space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-dark-brown/80 dark:text-cream/80">Experience:</dt>
                                                <dd className="text-sm font-medium text-dark-brown dark:text-cream capitalize">
                                                    {profile.software_experience}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-dark-brown/80 dark:text-cream/80">Interests:</dt>
                                                <dd className="text-sm font-medium text-dark-brown dark:text-cream">
                                                    {profile.interests?.join(", ") || "None"}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-dark-brown/60 dark:text-cream/60 uppercase tracking-wider">
                                            Hardware Background
                                        </h3>
                                        <dl className="mt-2 space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-dark-brown/80 dark:text-cream/80">Experience:</dt>
                                                <dd className="text-sm font-medium text-dark-brown dark:text-cream capitalize">
                                                    {profile.hardware_experience}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-dark-brown/60 dark:text-cream/60">No profile data available.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-4 sm:px-6 bg-warm-white/50 dark:bg-dark-brown/50">
                            <Link
                                href="/book"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-dark-brown bg-goldenrod hover:bg-goldenrod/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-goldenrod"
                            >
                                Go to Course Content
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
