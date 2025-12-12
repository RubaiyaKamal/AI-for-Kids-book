"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SigninForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error: authError } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
            });

            if (authError) {
                throw new Error(authError.message || "Signin failed");
            }

            // Redirect to book page on successful login
            router.push("/book");
            router.refresh(); // Refresh to update session state
        } catch (err: any) {
            console.error("Signin error:", err);
            setError(err.message || "Signin failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: "google" | "github") => {
        console.log(`Attempting ${provider} login from SigninForm`);
        setLoading(true);
        setError("");
        try {
            const result = await authClient.signIn.social({
                provider,
                callbackURL: "/book",
            });
            console.log(`${provider} login initiated`, result);
        } catch (err: any) {
            console.error(`${provider} login error details:`, err);
            setError(err.message || `Failed to login with ${provider}`);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-cream dark:bg-dark-brown rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-dark-brown dark:text-cream">Welcome Back</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded">{error}</div>
            )}

            <form onSubmit={handleSignin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-dark-brown dark:text-cream">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg focus:ring-2 focus:ring-goldenrod bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-dark-brown dark:text-cream">Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg focus:ring-2 focus:ring-goldenrod bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-goldenrod dark:bg-goldenrod text-dark-brown dark:text-dark-brown py-2 rounded-lg hover:bg-goldenrod/90 dark:hover:bg-goldenrod/80 disabled:bg-gray-400 dark:disabled:bg-gray-600 font-semibold"
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-dark-brown/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-cream dark:bg-dark-brown text-gray-600 dark:text-cream/70">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin("google")}
                        disabled={loading}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg bg-gray-100 dark:bg-dark-brown/30 text-dark-brown dark:text-cream hover:bg-gray-200 dark:hover:bg-dark-brown/50 disabled:opacity-50"
                    >
                        Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin("github")}
                        disabled={loading}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg bg-gray-100 dark:bg-dark-brown/30 text-dark-brown dark:text-cream hover:bg-gray-200 dark:hover:bg-dark-brown/50 disabled:opacity-50"
                    >
                        GitHub
                    </button>
                </div>
            </div>

            <p className="mt-4 text-center text-sm text-dark-brown/70 dark:text-cream/70">
                Don't have an account?{" "}
                <Link href="/signup" className="text-goldenrod hover:underline font-semibold">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
