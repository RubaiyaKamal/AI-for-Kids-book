"use client";

import { useState } from "react";
import { bookNavigation, BookSection } from "@/lib/bookData";

interface BookSidebarProps {
    activeId: string;
    onSelect: (id: string) => void;
}

export default function BookSidebar({ activeId, onSelect }: BookSidebarProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['module-1']));

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const renderSection = (section: BookSection, level: number = 0) => {
        const isExpanded = expandedIds.has(section.id);
        const isActive = activeId === section.id;
        const hasChildren = section.items && section.items.length > 0;

        return (
            <div key={section.id} className="mb-1">
                <button
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpand(section.id);
                        }
                        if (section.type === 'doc') {
                            onSelect(section.id);
                        }
                    }}
                    className={`
                        w-full text-left px-3 py-2 rounded-lg transition-colors
                        ${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}
                        ${isActive
                            ? 'bg-goldenrod text-dark-brown'
                            : 'text-dark-brown dark:text-cream hover:bg-cream/50 dark:hover:bg-dark-brown/50'
                        }
                    `}
                    style={{ paddingLeft: `${level * 12 + 12}px` }}
                >
                    <div className="flex items-center justify-between">
                        <span className="flex-1">{section.label}</span>
                        {hasChildren && (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </div>
                </button>

                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {section.items!.map((item) => renderSection(item, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-cream dark:bg-dark-brown border-r border-dark-brown/10 dark:border-cream/10 overflow-y-auto">
            <div className="p-4">
                <h2 className="text-xl font-bold text-dark-brown dark:text-cream mb-4 flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-goldenrod"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Contents
                </h2>
                <div className="space-y-1">
                    {bookNavigation.map((section) => renderSection(section))}
                </div>
            </div>
        </div>
    );
}
