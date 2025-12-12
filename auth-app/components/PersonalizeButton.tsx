"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import "./PersonalizeButton.css";

interface PersonalizeButtonProps {
    chapterId: string;
    originalContent: string;
    onPersonalized: (content: string, profile: any) => void;
}

export default function PersonalizeButton({
    chapterId,
    originalContent,
    onPersonalized,
}: PersonalizeButtonProps) {
    const [loading, setLoading] = useState(false);
    const [personalized, setPersonalized] = useState(false);
    const [error, setError] = useState("");
    const { data: session } = authClient.useSession();

    const handlePersonalize = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/personalize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chapterId,
                    originalContent,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onPersonalized(data.personalizedContent, data.profile);
                setPersonalized(true);
            } else {
                setError(data.error || "Failed to personalize content");
            }
        } catch (err) {
            console.error("Personalization error:", err);
            setError("Failed to personalize content. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        onPersonalized(originalContent, null);
        setPersonalized(false);
    };

    // Don't show button if not logged in
    if (!session) {
        return (
            <div className="personalize-login-prompt">
                <p>
                    <a href="/signin">Sign in</a> to personalize this chapter based on
                    your background and learning preferences.
                </p>
            </div>
        );
    }

    return (
        <div className="personalize-container">
            {error && <div className="error-message">{error}</div>}

            {!personalized ? (
                <button
                    onClick={handlePersonalize}
                    disabled={loading}
                    className="personalize-button"
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Personalizing content for you...
                        </>
                    ) : (
                        <>
                            <svg
                                className="icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Personalize for Me
                        </>
                    )}
                </button>
            ) : (
                <div className="personalized-banner">
                    <div className="banner-content">
                        <svg
                            className="check-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>✨ Content personalized for your profile</span>
                    </div>
                    <button onClick={handleReset} className="reset-button">
                        Show Original
                    </button>
                </div>
            )}
        </div>
    );
}
