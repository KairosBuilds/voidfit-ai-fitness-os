import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiProvider, ChatMessage } from './types';

const clean = (key: string) => (key || '').replace(/['"\s]/g, '').trim();

export class GeminiProvider implements AiProvider {
  constructor(private readonly apiKey: string) {}

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(clean(this.apiKey));
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));
    const chat = model.startChat({ history });
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last?.text || '');
    return (await result.response).text();
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const genAI = new GoogleGenerativeAI(clean(key));
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] });
      return !!result.response;
    } catch (error: any) {
      const errorMsg = error?.message || '';
      // If we get a 429, the key is VALID, but we hit the quota.
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.warn('[VoidFit AI] Key is valid but quota exceeded. Proceeding in rate-limited mode.');
        return true; 
      }
      console.error('[VoidFit AI] Key validation failed:', errorMsg);
      return false;
    }
  }
}

