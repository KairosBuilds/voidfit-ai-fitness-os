import { useAuthStore } from '../../store/useAuthStore';
import { GeminiProvider } from './geminiProvider';
import { OpenAiProvider } from './openaiProvider';
import { AnthropicProvider } from './anthropicProvider';
import type { AiProvider, AiProviderId } from './types';

class UnsupportedProvider implements AiProvider {
  async chat(): Promise<string> {
    throw new Error('Selected provider is not implemented yet.');
  }
  async validateKey(): Promise<boolean> {
    return false;
  }
}

export function getProvider(provider?: AiProviderId, key?: string): AiProvider {
  const auth = useAuthStore.getState();
  const selected = provider ?? auth.selectedProvider;
  const selectedKey = key ?? auth.apiKeys[selected] ?? auth.apiKey;

  if (selected === 'gemini') {
    return new GeminiProvider(selectedKey || '');
  }

  if (selected === 'openai') {
    return new OpenAiProvider(selectedKey || '');
  }

  if (selected === 'anthropic') {
    return new AnthropicProvider(selectedKey || '');
  }

  return new UnsupportedProvider();
}

