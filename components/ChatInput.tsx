
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: { mimeType: string; data: string; type: 'image' | 'audio' }) => void;
  isLoading: boolean;
  language: Language;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, language }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const t = {
        listening: language === 'en' ? "Listening..." : "聆聽中...",
        placeholder: language === 'en' 
            ? "Ask about procurement... (Ctrl + Enter to send)" 
            : "詢問關於採購的問題... (Ctrl + Enter 發送)",
        uploadImage: language === 'en' ? "Upload Image" : "上傳圖片",
        startRecording: language === 'en' ? "Start Recording" : "開始錄音",
        stopRecording: language === 'en' ? "Stop Recording" : "停止錄音",
        audioMessage: language === 'en' ? "Please listen to this audio." : "請聽這段語音。",
        noMic: language === 'en' ? "No microphone found. Please connect a microphone and try again." : "找不到麥克風。請連接麥克風後再試。",
        micDenied: language === 'en' ? "Microphone permission denied. Please allow microphone access in your browser settings." : "麥克風權限被拒絕。請在瀏覽器設定中允許麥克風存取。",
        micError: language === 'en' ? "Could not access microphone. Please ensure permissions are granted." : "無法存取麥克風。請確認權限已開啟。"
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [text]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage({
                    file,
                    preview: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const convertBlobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data url prefix (e.g. "data:image/jpeg;base64,")
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Determine the supported MIME type for the browser
    const getSupportedMimeType = () => {
        const types = [
            'audio/webm', // Chrome, Firefox, Edge
            'audio/mp4',  // Safari
            'audio/ogg',
            'audio/wav'
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ''; // Let browser choose default
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Use the actual mime type of the recorder, or fallback to the one we selected, or default to webm
                const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
                
                const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
                const base64Data = await convertBlobToBase64(audioBlob);
                
                // Automatically send audio message
                onSendMessage(t.audioMessage, {
                    mimeType: actualMimeType,
                    data: base64Data,
                    type: 'audio'
                });
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            // Handle specific error cases
            if (error instanceof DOMException && error.name === 'NotFoundError') {
                alert(t.noMic);
            } else if (error instanceof DOMException && error.name === 'NotAllowedError') {
                alert(t.micDenied);
            } else {
                alert(t.micError);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if ((text.trim() || selectedImage) && !isLoading) {
            let attachment = undefined;
            
            if (selectedImage) {
                const base64Data = await convertBlobToBase64(selectedImage.file);
                attachment = {
                    mimeType: selectedImage.file.type,
                    data: base64Data,
                    type: 'image' as const
                };
            }

            onSendMessage(text, attachment);
            setText('');
            clearImage();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {selectedImage && (
                <div className="relative w-fit ml-3 mb-1">
                    <img 
                        src={selectedImage.preview} 
                        alt="Preview" 
                        className="h-20 w-auto rounded-lg border border-model-bubble object-cover" 
                    />
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            )}
            
            <div className="flex items-end gap-3">
                {/* Image Upload Button */}
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isRecording}
                    className="p-3 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                    title={t.uploadImage}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </button>

                {/* Voice Record Button */}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    className={`p-3 transition-colors rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-text-secondary hover:text-accent'}`}
                    title={isRecording ? t.stopRecording : t.startRecording}
                >
                    {isRecording ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <rect x="6" y="6" width="12" height="12"></rect>
                         </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    )}
                </button>

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? t.listening : t.placeholder}
                    className="flex-grow bg-surface border border-model-bubble rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none resize-none overflow-y-auto max-h-40"
                    rows={1}
                    disabled={isLoading || isRecording}
                />
                
                <button
                    type="submit"
                    disabled={isLoading || (!text.trim() && !selectedImage) || isRecording}
                    className="bg-accent text-slate-900 rounded-full p-3 hover:bg-cyan-300 disabled:bg-model-bubble disabled:text-text-secondary disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent"
                    aria-label="Send message"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
