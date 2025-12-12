"use client";

interface RelatedSidebarProps {
    sections: string[];
    currentSection?: string;
}

export default function RelatedSidebar({ sections, currentSection }: RelatedSidebarProps) {
    const scrollToSection = (sectionName: string) => {
        const element = document.getElementById(sectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="h-full bg-cream dark:bg-dark-brown border-l border-dark-brown/10 dark:border-cream/10 overflow-y-auto">
            <div className="p-4 sticky top-0">
                <h3 className="text-lg font-bold text-dark-brown dark:text-cream mb-4 flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-mint"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    In This Chapter
                </h3>

                {sections.length > 0 ? (
                    <ul className="space-y-2">
                        {sections.map((section, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => scrollToSection(section)}
                                    className="text-sm text-dark-brown/70 dark:text-cream/70 hover:text-goldenrod dark:hover:text-goldenrod transition-colors text-left w-full py-1 px-2 rounded hover:bg-warm-white dark:hover:bg-dark-brown/50"
                                >
                                    {section}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-dark-brown/50 dark:text-cream/50 italic">
                        No sections available
                    </p>
                )}

                <div className="mt-8 p-4 bg-mint/10 dark:bg-mint/5 rounded-lg border border-mint/30">
                    <h4 className="text-sm font-semibold text-dark-brown dark:text-cream mb-2 flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 text-mint"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Quick Tip
                    </h4>
                    <p className="text-xs text-dark-brown/70 dark:text-cream/70">
                        Select any text and ask the chatbot for explanations!
                    </p>
                </div>

            </div>
        </div>
    );
}
