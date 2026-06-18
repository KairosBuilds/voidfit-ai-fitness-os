import { describe, expect, it } from 'vitest';
import { getProvider } from '../src/services/ai/providerFactory';
import { GeminiProvider } from '../src/services/ai/geminiProvider';
import { OpenAiProvider } from '../src/services/ai/openaiProvider';
import { AnthropicProvider } from '../src/services/ai/anthropicProvider';

describe('AI Provider Factory', () => {
  it('should return Gemini provider by default', () => {
    const provider = getProvider('gemini');
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('should return OpenAI provider when requested', () => {
    const provider = getProvider('openai');
    expect(provider).toBeInstanceOf(OpenAiProvider);
  });

  it('should return Anthropic provider when requested', () => {
    const provider = getProvider('anthropic');
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should return UnsupportedProvider for unknown input (which throws on chat)', async () => {
    const provider = getProvider('unknown' as any);
    await expect(provider.chat([], '')).rejects.toThrow('not implemented');
  });
});
