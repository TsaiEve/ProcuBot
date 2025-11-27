
export enum MessageRole {
  USER = 'USER',
  MODEL = 'MODEL',
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
}
