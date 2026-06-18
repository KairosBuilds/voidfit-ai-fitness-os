# Agent guidance (VoidFit / LevelUp)

Use this document when navigating the codebase or changing AI-related behavior.

## Machine-readable AI map

The canonical route-by-route and export-by-export listing lives in **`docs/ai-surface-map.json`**. Prefer updating that JSON when adding or removing an AI call so agents and tooling stay aligned.

## High-level architecture

- **UI shell:** `App.tsx` mounts `src/app/shell/AppShell.tsx` (global overlays) and `src/app/shell/AppRouter.tsx` (view switching via `useUiStore().view`).
- **AI orchestration:**
  - `services/geminiService.ts` — most Gemini calls plus `getAiChatResponse` / `validateApiKey` routed through providers.
  - `src/services/ai/providerFactory.ts` — `getProvider()` for chat and key validation (Gemini / OpenAI / Anthropic).
  - `src/services/aiReactionService.ts` — `reportEventToAi` writes to Dexie chat history and invokes `analyzeMeal` or `generateSystemReaction` as appropriate.
- **State:** `src/store/useAuthStore.ts` — API keys and `selectedProvider`. Non-chat features predominantly use `apiKey` (legacy Gemini field).

## Conventions for changes

1. **New AI feature:** Add the call site, then extend `docs/ai-surface-map.json` (`routes[].aiConnections`, `geminiServiceExports`, or `reportEventToAi.eventTypes`).
2. **New route in `AppRouter.tsx`:** Add a matching route object in `docs/ai-surface-map.json`; set `"aiConnections": []` if no LLM.
3. **Provider behavior:** Chat-only today is multi-provider; vision/mission/recipe-style helpers are Gemini-direct unless refactored to use providers.

## Files agents often touch

| Area | Primary files |
|------|----------------|
| Chat | `components/Chatbot.tsx`, `services/geminiService.ts`, `src/services/ai/*.ts` |
| Vision meal/form | `components/VisionTracker.tsx`, `services/geminiService.ts`, `src/services/aiReactionService.ts` |
| Coach reactions | `src/services/aiReactionService.ts`, components that call `reportEventToAi` |
| Daily mission | `components/Dashboard.tsx`, `services/geminiService.ts` |
| Keys / provider | `components/SettingsModal.tsx`, `src/store/useAuthStore.ts`, `src/services/ai/providerFactory.ts` |

## Tests

- Provider wiring: `tests/aiAbstraction.test.ts`
