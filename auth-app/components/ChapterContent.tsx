"use client";

import { useState, useEffect } from "react";

import PersonalizeButton from "./PersonalizeButton";

import ReactMarkdown from "react-markdown";

import { useAuth } from "@/lib/auth-client"; // Import useAuth
import { Session } from "@/lib/auth";



interface ChapterContentProps {

    chapterId: string;

    originalContent: string;

    title: string;

}



export default function ChapterContent({

    chapterId,

    originalContent,

    title,

}: ChapterContentProps) {

    const { useSession } = useAuth(); // Use the useAuth hook

    const { data: session }: { data: Session | null | undefined } = useSession(); // Get session data



    const [content, setContent] = useState(originalContent);

    const [urduContent, setUrduContent] = useState<string | null>(null);

    const [isTranslated, setIsTranslated] = useState(false);

    const [profile, setProfile] = useState<any>(null);



    useEffect(() => {

        // Load translation preference from localStorage when component mounts

        if (typeof window !== 'undefined') {

            const savedTranslationPreference = localStorage.getItem('translateToUrdu');

            if (savedTranslationPreference === 'true') {

                setIsTranslated(true);

                // Automatically fetch translation if preference is to translate

                if (!urduContent) {

                    handleTranslate(); // Call translate to fetch content if not already fetched

                }

            }

        }

    }, [chapterId, originalContent]); // Re-run if chapter changes



    const handlePersonalized = (personalizedContent: string, userProfile: any) => {

        setContent(personalizedContent);

        setProfile(userProfile);

        setUrduContent(null); // Clear translation when personalizing

        setIsTranslated(false); // Reset translation when personalizing

        if (typeof window !== 'undefined') {

            localStorage.setItem('translateToUrdu', 'false'); // Also update localStorage

        }

    };



    const handleTranslate = async () => {

        const newState = !isTranslated;

        setIsTranslated(newState);

        if (typeof window !== 'undefined') {

            localStorage.setItem('translateToUrdu', String(newState));

        }



        if (newState && !urduContent) {

            // Only fetch if we haven't already translated this content and are switching to translated

            try {

                const response = await fetch('/api/translate', {

                    method: 'POST',

                    headers: {

                        'Content-Type': 'application/json',

                    },

                    body: JSON.stringify({ text: originalContent, targetLang: 'ur' }),

                });

                const data = await response.json();

                if (response.ok) {

                    setUrduContent(data.translatedText);

                } else {

                    console.error('Translation error:', data.error);

                    alert('Failed to translate content.');

                    // Revert state if translation fails

                    setIsTranslated(false);

                    if (typeof window !== 'undefined') {

                        localStorage.setItem('translateToUrdu', 'false');

                    }

                }

            } catch (error) {

                console.error('Network or API error during translation:', error);

                alert('An error occurred during translation.');

                // Revert state if translation fails

                setIsTranslated(false);

                if (typeof window !== 'undefined') {

                    localStorage.setItem('translateToUrdu', 'false');

                }

            }

        }

    };



    return (

        <div className="chapter-container">

            <h1 className="chapter-title">{title}</h1>



            <div className="button-group">

                {/* Personalization Button */}

                <PersonalizeButton

                    chapterId={chapterId}

                    originalContent={originalContent}

                    onPersonalized={handlePersonalized}

                />

                {/* Translate Button - Only visible to logged-in users */}

                {session?.user && (

                    <button onClick={handleTranslate} className="translate-button">

                        {isTranslated ? "Show Original" : "Translate to Urdu"}

                    </button>

                )}

            </div>



            {/* Show profile info if personalized */}

            {profile && (

                <div className="profile-info">

                    <div className="profile-badge">

                        <span className="badge-label">Difficulty:</span>

                        <span className="badge-value">{profile.difficulty}</span>

                    </div>

                    <div className="profile-badge">

                        <span className="badge-label">Learning Style:</span>

                        <span className="badge-value">{profile.learningStyle}</span>

                    </div>

                    {profile.hasHardware && (

                        <div className="profile-badge">

                            <span className="badge-label">🤖 Hardware Mode:</span>

                            <span className="badge-value">Enabled</span>

                        </div>

                    )}

                </div>

            )}



            {/* Chapter content */}

            <div className={profile ? "personalized-content markdown-body" : "markdown-body"}>

                <ReactMarkdown>{isTranslated && urduContent ? urduContent : content}</ReactMarkdown>

            </div>

        </div>

    );

}

