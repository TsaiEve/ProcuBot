
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
        try {
            const newChat = createChatSession();
            setChat(newChat);
            setMessages([{
                role: MessageRole.MODEL,
                text: '您好！我是 ProcuBot，已切換至最穩定的連線模式。我可以協助您分析採購策略、審閱報表。目前支援 **PDF** 或 **圖片**。今天有什麼可以協助您的嗎？',
                id: Date.now()
            }]);
        } catch (error: any) {
            console.error("Initialization Error:", error);
            setMessages([{
                role: MessageRole.MODEL,
                text: error.message === "API_KEY_MISSING" 
                    ? "❌ **系統錯誤：找不到 API 金鑰**。請確保環境變數 API_KEY 已正確設定。" 
                    : "❌ **系統初始化失敗**，請重新整理頁面或檢查網路連線。",
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
            console.error("Gemini API Error:", error);
            const errorStr = String(error);
            let errorMessage = "處理請求時發生技術錯誤。";

            if (errorStr.includes("429")) {
                errorMessage = "⚠️ **發送頻率過高**：請稍等幾秒後再試。";
            } else if (errorStr.includes("404")) {
                errorMessage = "⚠️ **模型連線失敗**：當前區域可能不支援此模型，正嘗試重新建立連線。";
            } else if (errorStr.includes("SAFETY")) {
                errorMessage = "🛡️ **內容安全過濾**：您的訊息內容可能包含敏感詞彙，請嘗試以更專業、客觀的採購術語重新描述您的問題。";
            } else if (errorStr.includes("API_KEY")) {
                errorMessage = "❌ **API 金鑰失效**：請檢查您的 API Key 是否有效或專案是否已啟用服務。";
            } else {
                errorMessage = `抱歉，發生了未預期的錯誤 (Error: ${error.message || 'Unknown'})。請點擊上方「重置」按鈕。`;
            }

            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: errorMessage } : msg
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
            <ImagePreviewModal isOpen={isPreviewOpen} imageUrl={previewImage} onClose={() => setIsPreviewOpen(false)} />
        </div>
    );
};

export default App;
