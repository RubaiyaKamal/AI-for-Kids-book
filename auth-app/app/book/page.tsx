"use client";

import { useState, useEffect } from "react";
import BookSidebar from "@/components/BookSidebar";
import RelatedSidebar from "@/components/RelatedSidebar";
import Chatbot from "@/components/Chatbot";
import TranslatorButton from "@/components/TranslatorButton";
import UserMenu from "@/components/UserMenu";
import { authClient } from "@/lib/auth-client";

interface BookContent {
    title: string;
    content: string;
    sections: string[];
}

export default function BookReaderPage() {
    const [activeId, setActiveId] = useState("intro");
    const [selectedText, setSelectedText] = useState("");
    const [currentContent, setCurrentContent] = useState<BookContent>({
        title: "Loading...",
        content: "",
        sections: [],
    });
    const [loading, setLoading] = useState(true);
    const [isPersonalized, setIsPersonalized] = useState(false);
    const [personalizing, setPersonalizing] = useState(false);
    const [originalContent, setOriginalContent] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [translatedContent, setTranslatedContent] = useState("");
    const [translationError, setTranslationError] = useState("");
    const [userExperienceLevel, setUserExperienceLevel] = useState<string | null>(null);
    const [isAutoPersonalized, setIsAutoPersonalized] = useState(false);

    const { data: session } = authClient.useSession();


    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || "";
        if (text) {
            setSelectedText(text);
        }
    };


    const handlePersonalize = async () => {
        if (!session) {
            if (confirm("You need to log in to personalize content. Go to login page?")) {
                window.location.href = "/signin";
            }
            return;
        }

        setPersonalizing(true);
        try {
            console.log("Starting personalization for chapter:", activeId);
            console.log("User session:", session.user);

            const response = await fetch("/api/personalize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chapterId: activeId,
                    originalContent: originalContent,
                }),
            });

            console.log("Personalize response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("✓ Personalization successful!");
                setCurrentContent({
                    ...currentContent,
                    content: data.personalizedContent,
                });
                setIsPersonalized(true);
                setUserExperienceLevel(data.experienceLevel || "intermediate");
            } else {
                const error = await response.json();
                console.error("Personalization failed:", error);

                // Show a more helpful error message
                if (response.status === 404) {
                    alert("Profile not found. Creating a default profile for you. Please try again.");
                } else if (response.status === 401) {
                    alert("Your session has expired. Please log in again.");
                    window.location.href = "/signin";
                } else {
                    alert(error.error || "Failed to personalize content. Please try again.");
                }
            }
        } catch (error) {
            console.error("Personalization error:", error);
            alert("Failed to personalize content. Please check your internet connection and try again.");
        } finally {
            setPersonalizing(false);
        }
    };

    const handleResetContent = () => {
        setCurrentContent({
            ...currentContent,
            content: originalContent,
        });
        setIsPersonalized(false);
    };

    const handleTranslate = async () => {
        setIsTranslating(true);
        setTranslationError("");

        try {
            const contentToTranslate = isPersonalized ? currentContent.content : originalContent;

            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: contentToTranslate,
                    targetLang: "ur",
                    chapterId: activeId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTranslatedContent(data.translatedText);
                setShowTranslation(true);

                // Copy to clipboard
                try {
                    await navigator.clipboard.writeText(data.translatedText);
                    // Show success notification
                    alert("✅ Chapter translated to Urdu and copied to clipboard!");
                } catch (clipboardError) {
                    console.error("Clipboard error:", clipboardError);
                    alert("✅ Chapter translated to Urdu! (Clipboard access denied)");
                }
            } else {
                const error = await response.json();
                setTranslationError(error.error || "Failed to translate content");
                alert("❌ Translation failed: " + (error.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Translation error:", error);
            setTranslationError("Failed to translate content. Please try again.");
            alert("❌ Translation failed. Please check your internet connection.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleToggleTranslation = () => {
        setShowTranslation(!showTranslation);
    };


    const MODULE_1_CHAPTERS = [
        "intro-physical-ai",
        "embodied-intelligence",
        "humanoid-landscape",
        "sensor-systems"
    ];





    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            setIsPersonalized(false);
            try {
                const response = await fetch(`/api/book-content?id=${activeId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCurrentContent(data);
                    setOriginalContent(data.content);
                } else {
                    setCurrentContent({
                        title: "Error",
                        content: "# Content Not Found\n\nThe requested content could not be loaded.",
                        sections: [],
                    });
                }
            } catch (error) {
                setCurrentContent({
                    title: "Error",
                    content: "# Error Loading Content\n\nPlease try again later.",
                    sections: [],
                });
            }
            setLoading(false);
        }
        loadContent();
    }, [activeId]);

    useEffect(() => {
        if (activeId) {
            const element = document.getElementById(activeId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [activeId]);


    return (
        <div className="h-screen flex flex-col bg-warm-white dark:bg-dark-brown">
            {/* Header */}
            <header className="bg-cream dark:bg-dark-brown border-b border-dark-brown/10 dark:border-cream/10 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <a href="/" className="text-2xl font-bold text-dark-brown dark:text-cream hover:text-goldenrod transition-colors">
                            Physical AI & Humanoid Robotics
                        </a>
                    </div>
                    <div className="flex items-center space-x-6">
                        {session ? (
                            <UserMenu />
                        ) : (
                            <div className="flex items-center space-x-4">
                                <a
                                    href="/signup"
                                    className="px-4 py-2 text-dark-brown dark:text-cream font-semibold rounded-lg hover:bg-goldenrod hover:text-dark-brown transition-all duration-300"
                                >
                                    Sign Up
                                </a>
                                <a
                                    href="/signin"
                                    className="px-4 py-2 text-dark-brown dark:text-cream font-semibold rounded-lg hover:bg-goldenrod hover:text-dark-brown transition-all duration-300"
                                >
                                    Sign In
                                </a>
                            </div>
                        )}
                        <a
                            href="https://github.com/RubaiyaKamal/Book-for-project-hackathon"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-dark-brown dark:text-cream hover:text-goldenrod transition-colors"
                            aria-label="View on GitHub"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                            <span className="font-medium">GitHub</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Navigation */}
                <aside className="w-80 flex-shrink-0 overflow-hidden">
                    <BookSidebar activeId={activeId} onSelect={setActiveId} />
                </aside>

                {/* Center - Book Content */}
                <main className="flex-1 overflow-y-auto px-8 py-6 bg-cream/30 dark:bg-dark-brown" onMouseUp={handleTextSelection}>
                    <article className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
                            </div>
                        ) : (
                            <>
                                {/* Action Buttons Row */}
                                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                                    {/* Personalize Button */}
                                    <div className="flex-1 flex items-center justify-between p-4 bg-goldenrod/10 dark:bg-goldenrod/5 rounded-lg border border-goldenrod/30">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">✨</span>
                                            <div>
                                                <h3 className="text-sm font-semibold text-dark-brown dark:text-cream">
                                                    {isPersonalized ? "Personalized for You" : "Personalize This Chapter"}
                                                </h3>
                                                <p className="text-xs text-dark-brown/70 dark:text-cream/70">
                                                    {isPersonalized
                                                        ? "Content adapted to your experience level and interests"
                                                        : "Customize content based on your profile"}
                                                </p>
                                                {/* Experience Level Badge */}
                                                {isPersonalized && userExperienceLevel && (
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${userExperienceLevel === "beginner"
                                                            ? "bg-mint/20 text-mint border border-mint/40"
                                                            : userExperienceLevel === "expert"
                                                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40"
                                                                : "bg-goldenrod/20 text-goldenrod border border-goldenrod/40"
                                                            }`}>
                                                            🎓 Learning as: {userExperienceLevel.charAt(0).toUpperCase() + userExperienceLevel.slice(1)}
                                                        </span>
                                                        {isAutoPersonalized && (
                                                            <span className="ml-2 text-xs text-mint">
                                                                (Auto-personalized)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            {isPersonalized ? (
                                                <button
                                                    onClick={handleResetContent}
                                                    className="px-4 py-2 text-sm bg-cream dark:bg-dark-brown text-dark-brown dark:text-cream rounded-lg hover:bg-goldenrod/20 transition-colors border border-dark-brown/10 dark:border-cream/10"
                                                >
                                                    Reset to Original
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handlePersonalize}
                                                    disabled={personalizing}
                                                    className="px-4 py-2 text-sm bg-goldenrod text-dark-brown rounded-lg hover:bg-goldenrod/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {personalizing ? "Personalizing..." : "Personalize Content"}
                                                </button>
                                            )}
                                        </div>
                                    </div>


                                    {/* Translator Button */}
                                    <div className="flex items-center space-x-2">
                                        {showTranslation && translatedContent ? (
                                            <button
                                                onClick={() => {
                                                    setShowTranslation(false);
                                                    setTranslatedContent("");
                                                }}
                                                className="px-4 py-2 text-sm bg-cream dark:bg-dark-brown text-dark-brown dark:text-cream rounded-lg hover:bg-goldenrod/20 transition-colors border border-dark-brown/10 dark:border-cream/10 font-semibold"
                                            >
                                                    (Reset to Original)
                                            </button>
                                        ) : (
                                            <TranslatorButton
                                                onClick={handleTranslate}
                                                isTranslating={isTranslating}
                                                showTranslation={showTranslation}
                                                onToggle={handleToggleTranslation}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Translation Area */}
                                {showTranslation && translatedContent && (
                                    <div className="mb-8 p-6 bg-white dark:bg-dark-brown/50 rounded-xl border border-goldenrod/20 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-dark-brown dark:text-cream flex items-center">
                                                <span className="mr-2">🇵🇰</span> Urdu Translation
                                            </h3>
                                            <button
                                                onClick={handleToggleTranslation}
                                                className="text-sm text-dark-brown/60 dark:text-cream/60 hover:text-goldenrod"
                                            >
                                                Hide
                                            </button>
                                        </div>
                                        <div
                                            className="prose prose-lg max-w-none font-urdu text-right"
                                            dangerouslySetInnerHTML={{ __html: translatedContent }}
                                        />
                                    </div>
                                )}

                                <div
                                    className="prose prose-lg max-w-none prose-headings:text-dark-brown dark:prose-headings:text-cream prose-p:text-dark-brown/80 dark:prose-p:text-cream/80 prose-strong:text-goldenrod prose-code:text-mint prose-code:bg-cream dark:prose-code:bg-dark-brown/50 prose-a:text-goldenrod prose-a:no-underline hover:prose-a:underline"
                                    dangerouslySetInnerHTML={{
                                        __html: currentContent.content
                                    }}
                                />

                                {/* Navigation Buttons */}
                                <div className="mt-12 pt-6 border-t border-dark-brown/10 dark:border-cream/10 flex justify-between">
                                    <button
                                        onClick={() => {
                                            const currentIndex = MODULE_1_CHAPTERS.indexOf(activeId);
                                            if (currentIndex > 0) {
                                                setActiveId(MODULE_1_CHAPTERS[currentIndex - 1]);
                                            }
                                        }}
                                        disabled={MODULE_1_CHAPTERS.indexOf(activeId) === 0}
                                        className="px-6 py-3 bg-cream dark:bg-dark-brown/50 text-dark-brown dark:text-cream rounded-lg hover:bg-goldenrod/20 transition-colors border border-dark-brown/10 dark:border-cream/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Previous Chapter
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex = MODULE_1_CHAPTERS.indexOf(activeId);
                                            if (currentIndex < MODULE_1_CHAPTERS.length - 1) {
                                                setActiveId(MODULE_1_CHAPTERS[currentIndex + 1]);
                                            }
                                        }}
                                        disabled={MODULE_1_CHAPTERS.indexOf(activeId) === MODULE_1_CHAPTERS.length - 1}
                                        className="px-6 py-3 bg-goldenrod text-dark-brown rounded-lg hover:bg-goldenrod/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Chapter →
                                    </button>
                                </div>
                            </>
                        )}
                    </article>
                </main>

                {/* Right Sidebar - Related Content */}
                <aside className="w-72 flex-shrink-0 overflow-hidden">
                    <RelatedSidebar sections={currentContent.sections} />
                </aside>
            </div>

            {/* Chatbot */}
            <Chatbot selectedText={selectedText} />
        </div>
    );
}
