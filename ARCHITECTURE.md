# OpenSaga Architecture

Welcome to the architectural overview of OpenSaga. This document is designed to help open-source contributors understand the technical foundation of the platform, the state management philosophy, and the provider-agnostic AI layer.

## Feature-Sliced Design (FSD)

OpenSaga relies on a modular, feature-based directory structure to ensure the codebase remains maintainable as the community and the platform grow.

`src/`
- `app/`: Application initialization, global routing configurations, and top-level providers.
- `core/`: Application-wide types, utilities, constants, and theme configurations.
- `components/`: Generic, reusable UI components (Buttons, Cards, Inputs).
- `features/`: The core of the application. Each domain (e.g., `worlds`, `proposals`, `auth`, `ai-assist`) gets its own folder encapsulating its components, hooks, and specific logic.
- `services/`: The API abstraction layer. Currently uses simulated network latency for mock data, preparing for seamless integration with a true backend API.
- `store/`: Global state management via Zustand.

## State Management

We use a dual-layer approach to state:
1. **Server State (React Query):** For fetching, caching, and updating asynchronous data from our `services` layer. This simulates the latency and lifecycle of a real backend, ensuring components handle loading and error states properly.
2. **Client State (Zustand):** For transient, UI-specific state (e.g., active modals, dark mode toggles) and holding Bring-Your-Own-Key (BYOK) AI configuration.

## The Agnostic AI Engine (BYOK)

OpenSaga is committed to remaining provider-agnostic. We **do not** hardcode integrations with specific vendors (like OpenAI or Anthropic). Instead, the `features/ai-assist` module defines a strict `AIEngine` interface. Contributors can build adapters (e.g., `OpenAIAdapter.ts`, `OllamaAdapter.ts`) that conform to this interface. The application relies on a BYOK (Bring Your Own Key) model where users input their preferred API key in a settings modal, which is stored locally and used exclusively in their browser to generate content.
