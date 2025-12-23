
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
                className="overflow-hidden rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
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

    // Document
    return (
        <div 
            className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer group"
            onClick={handleClick}
        >
            <div className="p-2 bg-white rounded-md border border-slate-200 group-hover:border-indigo-300 transition-colors text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-semibold truncate text-slate-700" title={attachment.fileName}>
                    {attachment.fileName || (language === 'en' ? 'Document' : '文件')}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                    {attachment.mimeType.split('/').pop()?.split('.').pop() || 'PDF'}
                </span>
            </div>
        </div>
    );
};

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, language, onAttachmentClick }) => {
    const isModel = message.role === MessageRole.MODEL;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    
    const messageContainerClasses = isModel
        ? 'flex items-start gap-3 justify-start'
        : 'flex items-start gap-3 justify-end';

    const messageBubbleClasses = isModel
        ? 'bg-model-bubble rounded-2xl rounded-tl-none p-5 max-w-[85%] md:max-w-2xl shadow-soft border border-border-color'
        : 'bg-gradient-to-br from-user-bubble-start to-user-bubble-end rounded-2xl rounded-tr-none p-5 max-w-[85%] md:max-w-2xl text-white shadow-lg';

    const proseClasses = isModel
        ? 'prose prose-slate max-w-none prose-p:text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-table:border-collapse'
        : 'prose prose-invert prose-sm max-w-none';

    return (
        <div className={messageContainerClasses}>
            {isModel && <BotIcon />}
            <div className={messageBubbleClasses}>
                
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
