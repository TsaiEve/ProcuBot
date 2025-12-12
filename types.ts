
export enum MessageRole {
  USER = 'USER',
  MODEL = 'MODEL',
}

export type Language = 'en' | 'zh-TW';

export interface ChatAttachment {
  type: 'image' | 'audio' | 'document';
  url?: string; // Data URL for display/playback (optional for documents)
  mimeType: string; // e.g. 'application/pdf'
  base64Data?: string; // Raw base64 for API
  fileName?: string; // Name of the file for display
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  attachments?: ChatAttachment[]; // Changed from single attachment to array
}
