
import React, { useState, useRef, useEffect } from 'react';
import { Language, ChatAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, attachments: ChatAttachment[]) => void;
  isLoading: boolean;
  language: Language;
  onAttachmentClick?: (attachment: ChatAttachment) => void;
}

interface SelectedFile {
    file: File;
    preview?: string;
    type: 'image' | 'document';
    id: string; // Unique ID for removal
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, language, onAttachmentClick }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const t = {
        listening: language === 'en' ? "Listening..." : "聆聽中...",
        placeholder: language === 'en' 
            ? "Ask about procurement... (Ctrl + Enter to send)" 
            : "詢問關於採購的問題... (Ctrl + Enter 發送)",
        uploadFile: language === 'en' ? "Upload Files" : "上傳檔案",
        startRecording: language === 'en' ? "Record" : "錄音",
        stopRecording: language === 'en' ? "Stop" : "停止",
        audioMessage: language === 'en' ? "Please listen to this audio." : "請聽這段語音。",
        noMic: language === 'en' ? "No microphone found." : "找不到麥克風。",
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
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: SelectedFile[] = [];
            Array.from(e.target.files).forEach((file: File) => {
                const isImage = file.type.startsWith('image/');
                const id = Math.random().toString(36).substring(7);
                
                if (isImage) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSelectedFiles(prev => [...prev, {
                            file,
                            preview: reader.result as string,
                            type: 'image',
                            id
                        }]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    newFiles.push({
                        file,
                        type: 'document',
                        id
                    });
                }
            });
            // Add non-image files immediately
            if (newFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...newFiles]);
            }
        }
        // Reset input value to allow selecting the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (id: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    const handlePreviewClick = (file: SelectedFile) => {
        if (onAttachmentClick) {
            onAttachmentClick({
                type: file.type === 'image' ? 'image' : 'document',
                mimeType: file.file.type,
                url: file.preview || URL.createObjectURL(file.file), 
                fileName: file.file.name,
                base64Data: '' 
            });
        }
    };

    const convertBlobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const base64Data = await convertBlobToBase64(audioBlob);
                
                onSendMessage(t.audioMessage, [{
                    mimeType: 'audio/webm',
                    base64Data: base64Data,
                    type: 'audio',
                    fileName: 'voice_message.webm'
                }]);
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert(t.noMic);
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
        
        if ((text.trim() || selectedFiles.length > 0) && !isLoading) {
            const attachments: ChatAttachment[] = await Promise.all(selectedFiles.map(async (f) => {
                const base64Data = await convertBlobToBase64(f.file);
                return {
                    mimeType: f.file.type,
                    base64Data: base64Data,
                    type: f.type,
                    fileName: f.file.name,
                    url: f.preview 
                };
            }));

            onSendMessage(text, attachments);
            setText('');
            setSelectedFiles([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-gray-300">
                    {selectedFiles.map((file) => (
                        <div key={file.id} className="relative flex-shrink-0 group animate-fadeIn">
                            <div 
                                onClick={() => handlePreviewClick(file)}
                                className="cursor-pointer"
                            >
                                {file.type === 'image' && file.preview ? (
                                    <img 
                                        src={file.preview} 
                                        alt="Preview" 
                                        className="h-20 w-20 rounded-xl border border-border-color object-cover shadow-sm hover:opacity-80 transition-opacity" 
                                    />
                                ) : (
                                    <div className="h-20 w-20 flex flex-col items-center justify-center p-2 bg-surface border border-border-color rounded-xl shadow-sm text-text-primary hover:bg-gray-50 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        <span className="text-[10px] w-full truncate text-center leading-tight">
                                            {file.file.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-transform hover:scale-110 z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-end gap-3 bg-surface p-2 rounded-2xl border border-border-color shadow-sm focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent transition-all duration-200">
                <input 
                    type="file" 
                    multiple
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isRecording}
                    className="p-3 text-text-secondary hover:text-accent hover:bg-background rounded-xl transition-colors disabled:opacity-50"
                    title={t.uploadFile}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                </button>

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? t.listening : t.placeholder}
                    className="flex-grow bg-transparent border-none p-3 text-text-primary placeholder-text-secondary focus:ring-0 resize-none overflow-y-auto max-h-40"
                    rows={1}
                    disabled={isLoading || isRecording}
                />
                
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    className={`p-3 transition-colors rounded-xl ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'text-text-secondary hover:text-accent hover:bg-background'}`}
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

                <button
                    type="submit"
                    disabled={isLoading || (!text.trim() && selectedFiles.length === 0) || isRecording}
                    className="bg-gradient-to-r from-user-bubble-start to-user-bubble-end text-white rounded-xl p-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all transform hover:scale-105"
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
