"use client";

import { useState, useEffect } from "react";
import BookSidebar from "@/components/BookSidebar";
import RelatedSidebar from "@/components/RelatedSidebar";
import Chatbot from "@/components/Chatbot";
import TranslatorButton from "@/components/TranslatorButton";
import UserMenu from "@/components/UserMenu";
import CompleteChapterButton from "@/components/CompleteChapterButton";
import QuizInterface from "@/components/QuizInterface";
import { authClient } from "@/lib/auth-client";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { bookNavigation } from "@/lib/bookData";

interface BookContent {
    title: string;
    content: string;
    sections: string[];
}

// Helper function to flatten book structure into a list of all chapter IDs
function getAllChapterIds(): string[] {
    const chapters: string[] = [];

    function traverse(sections: any[]) {
        for (const section of sections) {
            if (section.type === 'doc') {
                chapters.push(section.id);
            }
            if (section.items) {
                traverse(section.items);
            }
        }
    }

    traverse(bookNavigation);
    return chapters;
}

export default function BookReaderPage() {
    const [activeId, setActiveId] = useState("preface/welcome-to-learn-ai-for-kids");
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
    const [quizData, setQuizData] = useState<any>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    const { data: session } = authClient.useSession();
    const allChapters = getAllChapterIds();

    // Check if current chapter is a quiz
    const isQuizChapter = activeId.includes('quiz');

    // Auto-track time spent reading (every 30 seconds)
    useProgressTracking(activeId, !!session?.user);


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



    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            setIsPersonalized(false);
            setQuizData(null);

            // If it's a quiz chapter, fetch quiz data
            if (isQuizChapter && session?.user) {
                setLoadingQuiz(true);
                try {
                    const response = await fetch(`/api/quiz?chapter_id=${activeId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setQuizData(data);
                        setCurrentContent({
                            title: data.title || "Quiz",
                            content: "",
                            sections: [],
                        });
                    }
                } catch (error) {
                    console.error('Failed to load quiz:', error);
                } finally {
                    setLoadingQuiz(false);
                }
            } else {
                // Load regular content
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
            }
            setLoading(false);
        }
        loadContent();
    }, [activeId, isQuizChapter, session]);

    useEffect(() => {
        if (activeId) {
            const element = document.getElementById(activeId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [activeId]);


    return (
        <div className="h-screen flex flex-col bg-rose-50 pt-2">
            {/* Header */}


            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Navigation */}
                <aside className="w-80 flex-shrink-0 overflow-hidden">
                    <BookSidebar activeId={activeId} onSelect={setActiveId} />
                </aside>

                {/* Center - Book Content */}
                <main className="flex-1 overflow-y-auto px-8 py-6 bg-rose-50" onMouseUp={handleTextSelection}>
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
                                    <div className="flex-1 flex items-center justify-between p-4 bg-white rounded-xl border-2 border-pastel-peach shadow-sm">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">✨</span>
                                            <div>
                                                <h3 className="text-sm font-bold text-text-heading">
                                                    {isPersonalized ? "Personalized for You" : "Personalize This Chapter"}
                                                </h3>
                                                <p className="text-xs text-text-secondary">
                                                    {isPersonalized
                                                        ? "Content adapted to your experience level and interests"
                                                        : "Customize content based on your profile"}
                                                </p>
                                                {/* Experience Level Badge */}
                                                {isPersonalized && userExperienceLevel && (
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${userExperienceLevel === "beginner"
                                                            ? "bg-pastel-mint text-emerald-700 border border-emerald-200"
                                                            : userExperienceLevel === "expert"
                                                                ? "bg-pastel-lilac text-purple-700 border border-purple-200"
                                                                : "bg-pastel-yellow text-amber-700 border border-amber-200"
                                                            }`}>
                                                            🎓 Learning as: {userExperienceLevel.charAt(0).toUpperCase() + userExperienceLevel.slice(1)}
                                                        </span>
                                                        {isAutoPersonalized && (
                                                            <span className="ml-2 text-xs text-pastel-mint">
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
                                                    className="px-4 py-2 text-sm bg-white text-text-primary rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                                                >
                                                    Reset to Original
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handlePersonalize}
                                                    disabled={personalizing}
                                                    className="px-6 py-2 text-sm bg-pastel-peach text-pink-500 rounded-lg hover:brightness-95 transition-all shadow-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-pastel-coral/30"
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

                                {/* Quiz Interface or Regular Content */}
                                {isQuizChapter && quizData && session?.user ? (
                                    <QuizInterface
                                        quizId={quizData.quiz_id}
                                        chapterId={activeId}
                                        title={quizData.title}
                                        description={quizData.description || "Test your knowledge!"}
                                        questions={quizData.questions}
                                        passingPercentage={quizData.passing_percentage || 70}
                                        nextAttemptNumber={quizData.next_attempt_number || 1}
                                    />
                                ) : (
                                    <>
                                        <div
                                            className="prose prose-lg max-w-none prose-headings:text-text-heading prose-p:text-text-primary prose-strong:text-pastel-coral prose-code:text-purple-600 prose-code:bg-pastel-lilac/30 prose-code:px-1 prose-code:rounded prose-a:text-pastel-sky prose-a:no-underline hover:prose-a:underline prose-li:text-text-primary"
                                            dangerouslySetInnerHTML={{
                                                __html: currentContent.content
                                            }}
                                        />

                                        {/* Complete Chapter Button - Only show for logged-in users and non-quiz chapters */}
                                        {session?.user && !isQuizChapter && (
                                            <CompleteChapterButton chapterId={activeId} />
                                        )}
                                    </>
                                )}

                                {/* Navigation Buttons */}
                                <div className="mt-12 pt-6 border-t border-pastel-rose/50 flex justify-between">
                                    <button
                                        onClick={() => {
                                            const currentIndex = allChapters.indexOf(activeId);
                                            if (currentIndex > 0) {
                                                setActiveId(allChapters[currentIndex - 1]);
                                            }
                                        }}
                                        disabled={allChapters.indexOf(activeId) === 0}
                                        className="px-6 py-3 bg-white text-text-primary rounded-xl hover:bg-pastel-sky/20 transition-all border-2 border-pastel-sky disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        ← Previous Chapter
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex = allChapters.indexOf(activeId);
                                            if (currentIndex < allChapters.length - 1) {
                                                setActiveId(allChapters[currentIndex + 1]);
                                            }
                                        }}
                                        disabled={allChapters.indexOf(activeId) === allChapters.length - 1}
                                        className="px-6 py-3 bg-pastel-sky text-blue-900 rounded-xl hover:brightness-95 transition-all shadow-md font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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
