
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { ChatMessage as ChatMessageType, Language, ChatAttachment } from './types';
import { MessageRole } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ImagePreviewModal from './components/ImagePreviewModal';

const App: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<Language>('zh-TW'); 
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const initializeChat = () => {
        const newChat = createChatSession();
        setChat(newChat);
        setMessages([{
            role: MessageRole.MODEL,
            text: '您好！我是 ProcuBot，您的採購專家導師。我可以協助您分析採購策略、審閱報表或提供專業建議。目前支援上傳 **PDF** 或 **圖片** 檔案進行深入分析（若有 Word/Excel/PPT，請轉存為 PDF 後上傳）。今天有什麼可以協助您的嗎？\n\nHello! I am ProcuBot, your procurement mentor. I can help analyze strategies or review reports. I currently support **PDF** and **Image** uploads for analysis.',
            id: Date.now()
        }]);
    };

    useEffect(() => {
        initializeChat();
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
        if (!chat || isLoading) return;
        if (!text.trim() && attachments.length === 0) return;

        const userMessage: ChatMessageType = { 
            role: MessageRole.USER, 
            text: text, 
            id: Date.now(),
            attachments: attachments.length > 0 ? attachments : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const botMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { role: MessageRole.MODEL, text: '', id: botMessageId }]);

        try {
            let messagePayload: any;

            if (attachments.length > 0) {
                const parts: any[] = [];
                if (text.trim()) parts.push({ text: text });
                attachments.forEach(att => {
                    if (att.base64Data) {
                        parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } });
                    }
                });
                messagePayload = parts;
            } else {
                messagePayload = text;
            }

            const stream = await chat.sendMessageStream({ message: messagePayload });
            let streamedText = '';
            
            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text || '';
                streamedText += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: streamedText } : msg
                ));
            }
        } catch (error: any) {
            console.error("Gemini API Error Details:", error);
            
            let userFriendlyError = "";
            const errorStr = String(error);

            if (errorStr.includes("SAFETY") || errorStr.includes("safety")) {
                userFriendlyError = language === 'en'
                    ? "Your message was flagged by safety filters. Please try rephrasing your question to focus more on procurement strategies or formal professional advice."
                    : "您的訊息可能觸發了安全性過濾器。請嘗試調整說法，將重點放在「採購策略」或「專業建議」的諮詢上，我會盡力協助您。";
            } else if (errorStr.includes("MIME type")) {
                userFriendlyError = language === 'en'
                    ? "Unsupported file format. Please convert your documents to PDF or use images (PNG/JPG)."
                    : "檔案格式不支援。請將文件轉存為 PDF 或使用圖片檔案（PNG/JPG）再試一次。";
            } else {
                userFriendlyError = language === 'en'
                    ? "I encountered an error. This might be due to heavy traffic. Please try clicking the 'Reset' button at the top to start a fresh conversation."
                    : "抱歉，API 回應發生錯誤（可能是負載過重）。請點擊上方「重置」按鈕開啟新對話再試一次。";
            }

            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: userFriendlyError } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttachmentClick = (attachment: ChatAttachment) => {
        if (attachment.type === 'image') {
            let src = attachment.url;
            if (!src && attachment.base64Data) {
                src = `data:${attachment.mimeType};base64,${attachment.base64Data}`;
            }
            if (src) {
                setPreviewImage(src);
                setIsPreviewOpen(true);
            }
        } else {
            if (attachment.base64Data) {
                try {
                    const byteCharacters = atob(attachment.base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: attachment.mimeType });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                } catch (e) {
                    console.error("Error opening document:", e);
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background text-text-primary font-sans">
            <Header language={language} setLanguage={setLanguage} onReset={initializeChat} />
            
            <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg) => (
                    <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        language={language} 
                        onAttachmentClick={handleAttachmentClick}
                    />
                ))}
            </main>
            
            <footer className="flex-shrink-0 p-4 bg-background border-t border-border-color">
                <div className="max-w-4xl mx-auto">
                    <ChatInput 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading} 
                        language={language}
                        onAttachmentClick={handleAttachmentClick}
                    />
                </div>
            </footer>

            <ImagePreviewModal 
                isOpen={isPreviewOpen} 
                imageUrl={previewImage} 
                onClose={() => setIsPreviewOpen(false)} 
            />
        </div>
    );
};

export default App;
