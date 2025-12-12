"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export function useAuth() {
    return {
        signUp: authClient.signUp,
        signIn: authClient.signIn,
        signOut: authClient.signOut,
        useSession: authClient.useSession,
    };
}