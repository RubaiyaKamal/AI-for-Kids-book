import React from 'react';

interface TranslatorButtonProps {
    onClick: () => void;
    isTranslating: boolean;
    showTranslation?: boolean;
    onToggle?: () => void;
    disabled?: boolean;
}

export default function TranslatorButton({
    onClick,
    isTranslating,
    showTranslation = false,
    onToggle,
    disabled = false
}: TranslatorButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isTranslating}
            className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                transition-all duration-200 border
                ${showTranslation
                    ? 'bg-mint/20 text-mint border-mint hover:bg-mint/30'
                    : 'bg-goldenrod/10 text-goldenrod border-goldenrod/30 hover:bg-goldenrod/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-goldenrod/50
            `}
            title={showTranslation ? 'Translated to Urdu (copied to clipboard)' : 'Translate to Urdu'}
        >
            {isTranslating ? (
                <>
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Translating...</span>
                </>
            ) : (
                <>
                    {/* Translator/Language Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                    <span>{showTranslation ? 'Translated ✓' : 'Translate to Urdu'}</span>
                </>
            )}
        </button>
    );
}
