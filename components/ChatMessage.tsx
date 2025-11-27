import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { MessageRole } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessage;
}

const BotIcon: React.FC = () => (
    <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0 border border-model-bubble">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 8V4H8v4H4v8h16V8h-8z" />
            <rect x="4" y="16" width="16" height="4" rx="2" />
            <path d="M9 12v-2" />
            <path d="M15 12v-2" />
        </svg>
    </div>
);

const UserIcon: React.FC = () => (
    <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0 border border-model-bubble">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    </div>
);

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
    const isModel = message.role === MessageRole.MODEL;
    
    const messageContainerClasses = isModel
        ? 'flex items-start gap-3 justify-start'
        : 'flex items-start gap-3 justify-end';

    const messageBubbleClasses = isModel
        ? 'bg-model-bubble rounded-2xl rounded-tl-none p-4 max-w-2xl shadow-lg'
        : 'bg-gradient-to-br from-user-bubble-start to-user-bubble-end rounded-2xl rounded-tr-none p-4 max-w-2xl text-white shadow-lg';

    return (
        <div className={messageContainerClasses}>
            {isModel && <BotIcon />}
            <div className={messageBubbleClasses}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-text-primary prose-headings:text-white prose-strong:text-white prose-a:text-accent hover:prose-a:text-cyan-300 prose-code:text-slate-300 prose-code:bg-surface prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 prose-li:marker:text-text-secondary">
                    {message.text === '' ? <LoadingSpinner /> : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
            {!isModel && <UserIcon />}
        </div>
    );
};

export default ChatMessageComponent;