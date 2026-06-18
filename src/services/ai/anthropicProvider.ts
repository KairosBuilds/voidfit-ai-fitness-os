import type { AiProvider, ChatMessage } from './types';

export class AnthropicProvider implements AiProvider {
  constructor(private readonly apiKey: string) {}

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const key = this.apiKey.trim();
    if (!key) {
      throw new Error('Anthropic API key is missing.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 800,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text,
        })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic request failed: ${response.status} ${text}`);
    }

    const data = await response.json() as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const content = data.content?.find(part => part.type === 'text')?.text?.trim();
    if (!content) {
      throw new Error('Anthropic response did not contain text content.');
    }
    return content;
  }

  async validateKey(key: string): Promise<boolean> {
    const candidate = (key || this.apiKey || '').trim();
    if (!candidate) return false;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': candidate,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

