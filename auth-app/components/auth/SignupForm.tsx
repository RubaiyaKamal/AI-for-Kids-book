"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface SignupFormData {
    email: string;
    password: string;
    name: string;
}

interface BackgroundData {
    software_experience: string;
    hardware_experience: string;
    interests: string[];
}

export default function SignupForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 1: Basic signup
    const [formData, setFormData] = useState<SignupFormData>({
        email: "",
        password: "",
        name: "",
    });

    // Step 2: Background questionnaire
    const [background, setBackground] = useState<BackgroundData>({
        software_experience: "",
        hardware_experience: "",
        interests: [],
    });

    const handleBasicSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log("=== Starting Signup Process ===");
            console.log("Form data:", { email: formData.email, name: formData.name });

            // Step 1: Sign up with Better Auth
            console.log("Step 1: Attempting signup...");
            const { data, error: signupError } = await authClient.signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                callbackURL: "/book",
            });

            console.log("Signup response:", { data, error: signupError });

            if (signupError) {
                console.error("Signup error details:", signupError);
                throw new Error(signupError.message || "Signup failed");
            }

            console.log("✓ Signup successful!");

            // Step 2: Sign in automatically to establish session
            console.log("Step 2: Attempting auto sign-in...");
            const { error: signinError } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
            });

            if (signinError) {
                console.error("Auto sign-in error:", signinError);
                // Signup succeeded but auto-login failed, redirect to signin
                setError("Account created! Please sign in manually.");
                router.push("/signin");
                return;
            }

            console.log("✓ Auto sign-in successful!");

            // Step 3: Store user profile/background data
            console.log("Step 3: Saving user profile...");
            const profileResponse = await fetch("/api/user-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    software_experience: background.software_experience,
                    hardware_experience: background.hardware_experience,
                    interests: background.interests,
                }),
            });

            console.log("Profile response status:", profileResponse.status);

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                console.error("Failed to save user profile:", errorData);
                // Don't fail the whole signup if profile save fails
            } else {
                console.log("✓ Profile saved successfully!");
            }

            // Success! Redirect to book page
            console.log("=== Signup Complete! Redirecting to /book ===");
            router.push("/book");
            router.refresh();
        } catch (err: any) {
            console.error("=== Signup Failed ===");
            console.error("Error object:", err);
            console.error("Error message:", err.message);
            console.error("Error stack:", err.stack);
            setError(err.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest: string) => {
        if (background.interests.includes(interest)) {
            setBackground({
                ...background,
                interests: background.interests.filter((i) => i !== interest),
            });
        } else {
            setBackground({
                ...background,
                interests: [...background.interests, interest],
            });
        }
    };

    const handleSocialLogin = async (provider: "google" | "github") => {
        setLoading(true);
        setError("");
        try {
            await authClient.signIn.social({
                provider,
                callbackURL: "/book", // Redirect to book page after login
            });
        } catch (err: any) {
            console.error(`${provider} login error:`, err);
            setError(`Failed to login with ${provider}`);
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="max-w-md mx-auto p-6 bg-cream dark:bg-dark-brown rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-dark-brown dark:text-cream">Create Your Account</h2>

                <form onSubmit={handleBasicSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-brown dark:text-cream">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg focus:ring-2 focus:ring-goldenrod bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream"
                            required
                        />
                    </div>

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
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-goldenrod dark:bg-goldenrod text-dark-brown dark:text-dark-brown py-2 rounded-lg hover:bg-goldenrod/90 dark:hover:bg-goldenrod/80 font-semibold"
                    >
                        Continue
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
            </div>
        );
    }

    // Step 2: Background Questionnaire
    return (
        <div className="max-w-2xl mx-auto p-6 bg-cream dark:bg-dark-brown rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2 text-dark-brown dark:text-cream">Tell Us About Yourself</h2>
            <p className="text-dark-brown/70 dark:text-cream/70 mb-6">
                This helps us personalize your learning experience
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleFinalSubmit} className="space-y-6">
                {/* Software Background */}
                <div className="border-b border-gray-300 dark:border-dark-brown/30 pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-dark-brown dark:text-cream">Software Experience</h3>
                    <select
                        value={background.software_experience}
                        onChange={(e) =>
                            setBackground({
                                ...background,
                                software_experience: e.target.value,
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream focus:ring-2 focus:ring-goldenrod"
                        required
                    >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>

                {/* Hardware Background */}
                <div className="border-b border-gray-300 dark:border-dark-brown/30 pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-dark-brown dark:text-cream">Hardware Experience</h3>
                    <select
                        value={background.hardware_experience}
                        onChange={(e) =>
                            setBackground({
                                ...background,
                                hardware_experience: e.target.value,
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-brown/30 rounded-lg bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream focus:ring-2 focus:ring-goldenrod"
                        required
                    >
                        <option value="">Select level</option>
                        <option value="none">None</option>
                        <option value="arduino">Arduino</option>
                        <option value="raspberry_pi">Raspberry Pi</option>
                        <option value="professional">Professional Robotics</option>
                    </select>
                </div>

                {/* Interests */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-dark-brown dark:text-cream">Interests</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {["ROS", "Computer Vision", "Reinforcement Learning", "Simulations", "Hardware Design"].map((interest) => (
                            <label key={interest} className="flex items-center text-dark-brown dark:text-cream">
                                <input
                                    type="checkbox"
                                    checked={background.interests.includes(interest)}
                                    onChange={() => toggleInterest(interest)}
                                    className="mr-2"
                                />
                                {interest}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 px-4 py-3 border border-gray-300 dark:border-dark-brown/30 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-brown/30 text-dark-brown dark:text-cream"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-2/3 bg-mint dark:bg-mint text-white py-3 rounded-lg hover:bg-mint/90 dark:hover:bg-mint/80 font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    >
                        {loading ? "Creating Account..." : "Complete Setup"}
                    </button>
                </div>
            </form>
        </div>
    );
}
