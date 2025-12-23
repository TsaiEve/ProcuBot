
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Language, ChatAttachment } from '../types';
import { MessageRole } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface GroundingLink {
  title: string;
  uri: string;
}

interface ChatMessageProps {
  message: ChatMessage;
  language: Language;
  onAttachmentClick?: (attachment: ChatAttachment) => void;
  sources?: GroundingLink[];
}

const BotIcon: React.FC = () => (
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8v4H4v8h16V8h-8z" />
            <rect x="4" y="16" width="16" height="4" rx="2" />
            <path d="M9 12v-2" /><path d="M15 12v-2" />
        </svg>
    </div>
);

const UserIcon: React.FC = () => (
    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    </div>
);

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, language, onAttachmentClick, sources }) => {
    const isModel = message.role === MessageRole.MODEL;
    
    return (
        <div className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
            {isModel && <BotIcon />}
            <div className={`p-5 max-w-[85%] md:max-w-2xl shadow-soft border ${isModel ? 'bg-white rounded-2xl rounded-tl-none border-border-color' : 'bg-gradient-to-br from-user-bubble-start to-user-bubble-end rounded-2xl rounded-tr-none text-white shadow-lg'}`}>
                
                {message.attachments && message.attachments.length > 0 && (
                    <div className="grid gap-2 mb-4">
                        {message.attachments.map((att, i) => (
                            <div key={i} className="cursor-pointer overflow-hidden rounded-lg border" onClick={() => onAttachmentClick?.(att)}>
                                {att.type === 'image' && <img src={att.url || `data:${att.mimeType};base64,${att.base64Data}`} className="max-h-48 w-full object-cover" />}
                                {att.type !== 'image' && <div className="p-3 bg-slate-50 flex items-center gap-2 text-slate-700 text-sm font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>{att.fileName}</div>}
                            </div>
                        ))}
                    </div>
                )}

                <div className={`prose max-w-none ${isModel ? 'prose-slate' : 'prose-invert'}`}>
                    {message.text === '' ? <LoadingSpinner /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>}
                </div>

                {isModel && sources && sources.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Verified Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((source, idx) => (
                                <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1">
                                    {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {!isModel && <UserIcon />}
        </div>
    );
};

export default ChatMessageComponent;
