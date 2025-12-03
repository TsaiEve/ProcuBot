
import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { ChatMessage as ChatMessageType, Language } from './types';
import { MessageRole } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeChat = () => {
            const newChat = createChatSession();
            setChat(newChat);
            // Bilingual welcome message
            setMessages([{
                role: MessageRole.MODEL,
                text: 'Hello! I am ProcuBot, your expert procurement tutor. How can I assist you with your procurement challenges today?\n\n您好！我是 ProcuBot，您的專業採購導師。今天有什麼可以協助您的嗎？',
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

    const handleSendMessage = async (text: string, attachment?: { mimeType: string; data: string; type: 'image' | 'audio' }) => {
        if (!chat || isLoading) return;
        if (!text.trim() && !attachment) return;

        // Construct User Message for UI
        const userMessage: ChatMessageType = { 
            role: MessageRole.USER, 
            text: text, 
            id: Date.now(),
            attachment: attachment ? {
                type: attachment.type,
                mimeType: attachment.mimeType,
                url: `data:${attachment.mimeType};base64,${attachment.data}`
            } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const botMessageId = Date.now() + 1;
        // Add a placeholder for the streaming response
        setMessages(prev => [...prev, { role: MessageRole.MODEL, text: '', id: botMessageId }]);

        try {
            // Construct request parts for Gemini
            let messageContent: any = text;
            
            if (attachment) {
                // If attachment exists, we must use an array of parts
                const parts = [];
                if (text) {
                    parts.push({ text: text });
                }
                parts.push({
                    inlineData: {
                        mimeType: attachment.mimeType,
                        data: attachment.data
                    }
                });
                messageContent = parts;
            }

            const stream = await chat.sendMessageStream({ message: messageContent });
            let streamedText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text || '';
                streamedText += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: streamedText } : msg
                ));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = language === 'en' 
                ? 'Sorry, I encountered an error processing your request. Please try again.' 
                : '抱歉，處理您的請求時發生錯誤，請重試。';

            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: errorMessage } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Changed h-screen to h-[100dvh] for mobile browser compatibility
        <div className="flex flex-col h-[100dvh] bg-background text-text-primary font-sans">
            <Header language={language} setLanguage={setLanguage} />
            
            <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} language={language} />
                ))}
            </main>
            
            <footer className="flex-shrink-0 p-4 bg-background border-t border-surface/50">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} language={language} />
                </div>
            </footer>
        </div>
    );
};

export default App;
