
// Fix: Import React to resolve 'Cannot find namespace React' error when using React.FC
import React, { useState, useEffect, useRef } from 'react';
// Fix: Use named imports for @google/genai and follow type extraction guidelines
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
    const [language, setLanguage] = useState<Language>('en');
    
    // Preview State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeChat = () => {
            const newChat = createChatSession();
            setChat(newChat);
            // Bilingual welcome message
            setMessages([{
                role: MessageRole.MODEL,
                text: 'Hello! I am ProcuBot, your expert procurement tutor. I can analyze multiple documents (PDF, Word, PPT, Excel, Images) simultaneously. How can I assist you today?\n\n您好！我是 ProcuBot，您的專業採購導師。我可以同時分析多份文件（如 PDF, Word, PPT, Excel, 圖片）。今天有什麼可以協助您的嗎？',
                id: Date.now()
            }]);
        };
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

        // Construct User Message for UI
        const userMessage: ChatMessageType = { 
            role: MessageRole.USER, 
            text: text, 
            id: Date.now(),
            attachments: attachments.length > 0 ? attachments : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const botMessageId = Date.now() + 1;
        // Add a placeholder for the streaming response
        setMessages(prev => [...prev, { role: MessageRole.MODEL, text: '', id: botMessageId }]);

        try {
            // Construct request parts for Gemini
            let messagePayload: any = text;
            
            if (attachments.length > 0) {
                // If attachments exist, we must use an object with a parts array
                const parts: any[] = [];
                if (text) {
                    parts.push({ text: text });
                }
                
                // Add all attachments as inlineData parts
                attachments.forEach(att => {
                    if (att.base64Data) {
                        parts.push({
                            inlineData: {
                                mimeType: att.mimeType,
                                data: att.base64Data
                            }
                        });
                    }
                });
                
                messagePayload = { parts };
            }

            const stream = await chat.sendMessageStream({ message: messagePayload });
            let streamedText = '';
            for await (const chunk of stream) {
                // Fix: Follow guidelines by casting chunk to GenerateContentResponse and using .text property
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text || '';
                streamedText += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: streamedText } : msg
                ));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = language === 'en' 
                ? 'Sorry, I encountered an error processing your request. Please ensure the files are not too large and try again.' 
                : '抱歉，處理您的請求時發生錯誤。請確保檔案不會太大並重試。';

            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: errorMessage } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to handle attachment clicks
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
        } else if (attachment.type === 'document' || attachment.type === 'audio') {
            if (attachment.url && !attachment.url.startsWith('data:')) {
                window.open(attachment.url, '_blank');
            } else if (attachment.base64Data) {
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
                    alert("Unable to open file.");
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background text-text-primary font-sans transition-colors duration-300">
            <Header language={language} setLanguage={setLanguage} />
            
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
            
            <footer className="flex-shrink-0 p-4 bg-background border-t border-border-color shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
