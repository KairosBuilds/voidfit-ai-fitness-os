import { AiProvider as ProviderId } from '../../store/useAuthStore';

export type ChatMessage = { role: 'user' | 'model'; text: string };

export interface AiProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
  validateKey(key: string): Promise<boolean>;
}

export type AiProviderId = ProviderId;

