import type { AiProvider, ChatMessage } from './types';

export class OpenAiProvider implements AiProvider {
  constructor(private readonly apiKey: string) {}

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const key = this.apiKey.trim();
    if (!key) {
      throw new Error('OpenAI API key is missing.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text,
          })),
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${text}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI response did not contain message content.');
    }
    return content;
  }

  async validateKey(key: string): Promise<boolean> {
    const candidate = (key || this.apiKey || '').trim();
    if (!candidate) return false;
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${candidate}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

