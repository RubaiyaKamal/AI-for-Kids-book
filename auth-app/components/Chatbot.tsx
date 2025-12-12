"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: string[];
}

interface ChatbotProps {
    selectedText?: string;
}

export default function Chatbot({ selectedText }: ChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-populate question when text is selected
    useEffect(() => {
        if (selectedText && selectedText.trim()) {
            setInput(`Explain this: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`);
            setIsOpen(true);
        }
    }, [selectedText]);

    const resetChat = () => {
        setMessages([]);
        setInput("");
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || "http://127.0.0.1:8000/chat";
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: input,
                    selected_text: selectedText || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
                throw new Error(errorData.detail || "Failed to get response");
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: "assistant",
                content: data.answer,
                sources: data.sources,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error("Chat error:", error);
            let errorMsg = "Sorry, I couldn't connect to the chatbot service. ";

            if (error.message.includes("Failed to fetch")) {
                errorMsg += "Please make sure the chatbot API is running on http://127.0.0.1:8000";
            } else {
                errorMsg += error.message || "Something went wrong. Please try again.";
            }

            const errorMessage: Message = {
                role: "assistant",
                content: errorMsg,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-goldenrod hover:bg-goldenrod/90 text-dark-brown p-4 rounded-full shadow-lg z-50 transition-transform hover:scale-110"
                    aria-label="Open chatbot"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-cream dark:bg-dark-brown border-2 border-dark-brown/20 dark:border-cream/20 rounded-lg shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="bg-goldenrod text-dark-brown p-4 rounded-t-lg flex justify-between items-center">
                        <h3 className="font-bold text-lg">Book Assistant</h3>
                        <div className="flex items-center space-x-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={resetChat}
                                    className="hover:bg-dark-brown/10 p-2 rounded text-sm font-semibold"
                                    aria-label="New chat"
                                    title="Start new conversation"
                                >
                                    New Chat
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-dark-brown/10 p-1 rounded"
                                aria-label="Close chatbot"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-dark-brown/60 dark:text-cream/60 mt-8">
                                <p className="text-sm">
                                    Ask me anything about the book!
                                </p>
                                <p className="text-xs mt-2">
                                    {selectedText
                                        ? "I'll answer based on your selected text"
                                        : "Select text to ask specific questions"}
                                </p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${message.role === "user"
                                        ? "bg-goldenrod text-dark-brown"
                                        : "bg-warm-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream border border-dark-brown/10 dark:border-cream/10"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    {message.sources && message.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dark-brown/20 dark:border-cream/20">
                                            <p className="text-xs opacity-70">
                                                Sources: {message.sources.join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-warm-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream border border-dark-brown/10 dark:border-cream/10 rounded-lg p-3">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-goldenrod rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-goldenrod rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-goldenrod rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-dark-brown/20 dark:border-cream/20">
                        {selectedText && (
                            <div className="mb-2 p-2 bg-mint/20 border border-mint/30 rounded text-xs text-dark-brown dark:text-cream">
                                <span className="font-semibold">Selected text active</span>
                            </div>
                        )}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question..."
                                className="flex-1 px-3 py-2 border border-dark-brown/30 dark:border-cream/30 rounded-lg bg-white dark:bg-dark-brown/50 text-dark-brown dark:text-cream focus:ring-2 focus:ring-goldenrod outline-none"
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className="bg-goldenrod hover:bg-goldenrod/90 text-dark-brown px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
