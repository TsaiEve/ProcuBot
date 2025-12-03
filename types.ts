
export enum MessageRole {
  USER = 'USER',
  MODEL = 'MODEL',
}

export type Language = 'en' | 'zh-TW';

export interface ChatAttachment {
  type: 'image' | 'audio';
  url: string; // Data URL for display/playback
  mimeType: string; // e.g. 'image/jpeg', 'audio/wav'
  base64Data?: string; // Raw base64 for API (optional storage)
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  attachment?: ChatAttachment;
}
