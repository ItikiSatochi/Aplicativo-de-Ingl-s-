export interface ChatMessage {
    id: number | string;
    role: 'user' | 'teacher';
    text: string;
    imageKeyword?: string;
    imageUrl?: string;
}

export type SessionStatus = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';
