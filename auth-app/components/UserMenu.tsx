"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function UserMenu() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    if (isPending) {
        return (
            <div className="flex items-center space-x-4">
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center space-x-4">
                <Link
                    href="/signin"
                    className="px-4 py-2 border border-goldenrod text-dark-brown dark:text-cream rounded-lg hover:bg-goldenrod hover:text-dark-brown transition-colors font-semibold"
                >
                    Sign In
                </Link>
                <Link
                    href="/signup"
                    className="px-4 py-2 border border-goldenrod text-dark-brown dark:text-cream rounded-lg hover:bg-goldenrod hover:text-dark-brown transition-colors font-semibold"
                >
                    Sign Up
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-goldenrod/20 flex items-center justify-center text-goldenrod font-bold">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-dark-brown dark:text-cream font-medium hidden sm:block">
                    {session.user.name || "User"}
                </span>
            </div>
            <button
                onClick={handleSignOut}
                className="text-sm text-dark-brown/70 dark:text-cream/70 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
}
