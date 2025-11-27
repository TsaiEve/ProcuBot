import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { ChatMessage as ChatMessageType } from './types';
import { MessageRole } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeChat = () => {
            const newChat = createChatSession();
            setChat(newChat);
            setMessages([{
                role: MessageRole.MODEL,
                text: 'Hello! I am ProcuBot, your expert procurement tutor. How can I assist you with your procurement challenges today?',
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

    const handleSendMessage = async (text: string) => {
        if (!chat || isLoading || !text.trim()) return;

        const userMessage: ChatMessageType = { role: MessageRole.USER, text, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const botMessageId = Date.now() + 1;
        // Add a placeholder for the streaming response
        setMessages(prev => [...prev, { role: MessageRole.MODEL, text: '', id: botMessageId }]);

        try {
            const stream = await chat.sendMessageStream({ message: text });
            let streamedText = '';
            for await (const chunk of stream) {
                streamedText += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: streamedText } : msg
                ));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background text-text-primary font-sans">
            <Header />
            <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 pb-24">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
            </main>
            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-background/75 backdrop-blur-sm border-t border-surface/50">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
            </footer>
        </div>
    );
};

export default App;