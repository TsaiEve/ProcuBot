import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [text]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && !isLoading) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about procurement..."
                className="flex-grow bg-surface border border-model-bubble rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none resize-none overflow-y-auto max-h-40"
                rows={1}
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="bg-accent text-slate-900 rounded-full p-3 hover:bg-cyan-300 disabled:bg-model-bubble disabled:text-text-secondary disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent"
                aria-label="Send message"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </form>
    );
};

export default ChatInput;