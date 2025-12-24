
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { ChatMessage as ChatMessageType, Language, ChatAttachment } from './types';
import { MessageRole } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ImagePreviewModal from './components/ImagePreviewModal';

interface GroundingLink {
    title: string;
    uri: string;
}

const App: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<(ChatMessageType & { sources?: GroundingLink[] })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<Language>('zh-TW'); 
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const initializeChat = () => {
        try {
            const newChat = createChatSession();
            setChat(newChat);
            setMessages([{
                role: MessageRole.MODEL,
                text: '您好！我是 ProcuBot 2.0。我現在具備 **Google 搜尋與市場統整能力**。您可以直接要求我提供具體的供應商名單或價格趨勢。\n\n*註：若我回應「額度已滿」，代表 Google 免費 API 限制了每分鐘的搜尋次數，請稍等一分鐘後再試。*',
                id: Date.now()
            }]);
        } catch (error: any) {
            console.error("Initialization Error:", error);
            setMessages([{
                role: MessageRole.MODEL,
                text: "❌ 系統初始化失敗，請檢查環境變數 API_KEY 是否正確。",
                id: Date.now()
            }]);
        }
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

        const userMessage = { 
            role: MessageRole.USER, 
            text: text, 
            id: Date.now(),
            attachments: attachments.length > 0 ? attachments : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const botMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { role: MessageRole.MODEL, text: '', id: botMessageId, sources: [] }]);

        try {
            let messagePayload: any = attachments.length > 0 ? 
                [{ text: text }, ...attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }))] : 
                text;

            const stream = await chat.sendMessageStream({ message: messagePayload });
            let streamedText = '';
            let finalSources: GroundingLink[] = [];
            
            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                streamedText += (c.text || '');
                
                const chunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks) {
                    chunks.forEach((chunk: any) => {
                        if (chunk.web && chunk.web.uri) {
                            if (!finalSources.find(s => s.uri === chunk.web.uri)) {
                                finalSources.push({
                                    title: chunk.web.title || 'Source',
                                    uri: chunk.web.uri
                                });
                            }
                        }
                    });
                }

                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: streamedText, sources: finalSources } : msg
                ));
            }
        } catch (error: any) {
            console.error("Gemini API Error:", error);
            const errorStr = String(error);
            let userFriendlyError = "";

            if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
                userFriendlyError = "⚠️ **API 配額暫時用盡 (429 Error)**\n\n由於 Google 免費版 API 對於「Google 搜尋功能」有較嚴格的次數限制，目前的請求次數已達上限。\n\n**解決辦法：**\n1. 請等待 **60 秒** 後再重新發送訊息。\n2. 嘗試簡化您的問題，或分次詢問。\n3. 如果您有付費帳戶，請確保使用的是正確的 API Key。";
            } else if (errorStr.includes("500")) {
                userFriendlyError = "伺服器忙碌中，請稍後再試。";
            } else {
                userFriendlyError = `抱歉，發生了錯誤：${error.message || '未知錯誤'}`;
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
            const src = attachment.url || `data:${attachment.mimeType};base64,${attachment.base64Data}`;
            setPreviewImage(src);
            setIsPreviewOpen(true);
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
                        sources={msg.sources}
                    />
                ))}
            </main>
            <footer className="flex-shrink-0 p-4 bg-background border-t border-border-color">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} language={language} />
                </div>
            </footer>
            <ImagePreviewModal isOpen={isPreviewOpen} imageUrl={previewImage} onClose={() => setIsPreviewOpen(false)} />
        </div>
    );
};

export default App;
