
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Language, ChatAttachment } from '../types';
import { MessageRole } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessage;
  language: Language;
  onAttachmentClick?: (attachment: ChatAttachment) => void;
}

const BotIcon: React.FC = () => (
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-sm">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-indigo-600"
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
    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-indigo-600"
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

const AttachmentCard: React.FC<{ attachment: ChatAttachment, language: Language, onClick?: (att: ChatAttachment) => void }> = ({ attachment, language, onClick }) => {
    
    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick(attachment);
        }
    };

    if (attachment.type === 'image') {
        return (
            <div 
                className="overflow-hidden rounded-lg border border-white/20 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleClick}
            >
                <img 
                    src={attachment.url || (attachment.base64Data ? `data:${attachment.mimeType};base64,${attachment.base64Data}` : '')} 
                    alt="User upload" 
                    className="w-full h-full object-cover max-h-48"
                />
            </div>
        );
    }

    if (attachment.type === 'audio') {
        return (
             <div 
                className="flex items-center gap-2 bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"
                onClick={handleClick}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                </svg>
                <span className="text-sm opacity-90">{language === 'en' ? 'Voice Message' : '語音訊息'}</span>
            </div>
        );
    }

    // Document
    return (
        <div 
            className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer group"
            onClick={handleClick}
        >
            <div className="p-2 bg-white/20 rounded-md group-hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-semibold truncate max-w-[150px]" title={attachment.fileName}>
                    {attachment.fileName || (language === 'en' ? 'Document' : '文件')}
                </span>
                <span className="text-[10px] opacity-80 uppercase tracking-wider">
                    {attachment.mimeType.split('/').pop()?.split('.').pop() || 'FILE'}
                </span>
            </div>
        </div>
    );
};

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, language, onAttachmentClick }) => {
    const isModel = message.role === MessageRole.MODEL;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    
    const messageContainerClasses = isModel
        ? 'flex items-start gap-4 justify-start'
        : 'flex items-start gap-4 justify-end';

    const messageBubbleClasses = isModel
        ? 'bg-model-bubble rounded-2xl rounded-tl-none p-5 max-w-2xl shadow-soft border border-border-color text-text-primary'
        : 'bg-gradient-to-br from-user-bubble-start to-user-bubble-end rounded-2xl rounded-tr-none p-5 max-w-2xl text-white shadow-lg';

    // Tailwind typography classes adaptation for light/dark backgrounds
    const proseClasses = isModel
        ? 'prose prose-slate max-w-none prose-p:text-text-primary prose-headings:text-slate-800 prose-strong:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-code:text-indigo-600 prose-code:bg-slate-100 prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5'
        : 'prose prose-invert prose-sm max-w-none prose-p:text-white/90 prose-headings:text-white prose-strong:text-white prose-a:text-cyan-200 hover:prose-a:text-white prose-code:text-white prose-code:bg-white/20 prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5';

    return (
        <div className={messageContainerClasses}>
            {isModel && <BotIcon />}
            <div className={messageBubbleClasses}>
                
                {/* Attachments Grid */}
                {hasAttachments && (
                    <div className={`grid gap-2 mb-4 ${message.attachments!.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {message.attachments!.map((att, index) => (
                            <AttachmentCard 
                                key={index} 
                                attachment={att} 
                                language={language} 
                                onClick={onAttachmentClick}
                            />
                        ))}
                    </div>
                )}

                <div className={proseClasses}>
                    {message.text === '' && !hasAttachments ? <LoadingSpinner /> : (
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
