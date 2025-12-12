"use client";

import React, { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface User {
    email?: string;
    id: string;
    name?: string;
    image?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: () => void; // No-op for Better Auth as it handles its own state
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    loading: true,
    login: () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending, error } = authClient.useSession();
    const router = useRouter();

    const login = () => {
        // Better Auth handles login via its own client methods
        router.push("/signin");
    };

    const logout = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    const user = session?.user ? {
        ...session.user,
        id: session.user.id
    } : null;

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading: isPending,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
