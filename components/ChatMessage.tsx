
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Language } from '../types';
import { MessageRole } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessage;
  language: Language;
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

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, language }) => {
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
                {/* Image Attachment */}
                {message.attachment && message.attachment.type === 'image' && (
                    <div className="mb-3">
                        <img 
                            src={message.attachment.url} 
                            alt="User upload" 
                            className="rounded-lg max-h-64 object-cover border border-white/20"
                        />
                    </div>
                )}
                
                {/* Audio Attachment */}
                {message.attachment && message.attachment.type === 'audio' && (
                    <div className="mb-3 flex items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        </svg>
                        <span className="text-sm opacity-90">{language === 'en' ? 'Voice Message' : '語音訊息'}</span>
                    </div>
                )}

                {/* Document Attachment */}
                {message.attachment && message.attachment.type === 'document' && (
                    <div className="mb-3 flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                        <div className="p-2 bg-white/20 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold truncate max-w-[200px]" title={message.attachment.fileName}>
                                {message.attachment.fileName || (language === 'en' ? 'Document' : '文件')}
                            </span>
                            <span className="text-xs opacity-70 uppercase">
                                {message.attachment.mimeType.split('/').pop()?.split('.').pop()}
                            </span>
                        </div>
                    </div>
                )}

                <div className="prose prose-invert prose-sm max-w-none prose-p:text-text-primary prose-headings:text-white prose-strong:text-white prose-a:text-accent hover:prose-a:text-cyan-300 prose-code:text-slate-300 prose-code:bg-surface prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 prose-li:marker:text-text-secondary">
                    {message.text === '' && !message.attachment ? <LoadingSpinner /> : (
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
