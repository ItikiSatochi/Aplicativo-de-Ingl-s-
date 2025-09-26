export interface ChatMessage {
    id: number | string;
    role: 'user' | 'teacher';
    text: string;
    imageKeyword?: string;
    imageUrl?: string;
    isDemo?: boolean;
}

export type SessionStatus = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';