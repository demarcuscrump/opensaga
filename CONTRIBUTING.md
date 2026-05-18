# Contributing to OpenSaga

First off, thank you for considering contributing to OpenSaga! It's people like you that make open source such a fantastic community.

## Development Workflow

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** using `npm install`.
3. **Run the local dev server** using `npm run dev`.
4. **Run verification** using `npm run check` before opening a PR.
5. Ensure your code aligns with the **Feature-Sliced Design** outlined in `ARCHITECTURE.md`.
6. Keep your code modular and use existing UI components from `src/components` whenever possible to maintain a consistent aesthetic.

## First-Time Contributors

Start with `docs/contributor-roadmap.md`. It lists good first issue areas, contributor-friendly workstreams, and the next public beta milestones.

Good first contributions usually fall into one of these lanes:

- Documentation polish for setup, deployment, and core concepts
- Accessibility improvements for forms, modals, focus states, and mobile navigation
- Playwright tests for user journeys that already exist
- Small UI consistency fixes using existing components
- Supabase/RLS documentation and test-matrix improvements

## Local Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run test` | Run the Vitest suite |
| `npm run build` | Build the production bundle |
| `npm run check` | Run typecheck, tests, and build |
| `npm run test:e2e` | Run Playwright smoke tests |

## Pull Request Process

1. Ensure any new features are accompanied by updates to the relevant `.md` documentation in the `docs/` folder.
2. Verify that your code does not introduce vendor lock-in. For example, if you are adding an AI feature, ensure it routes through the `AIEngine` abstraction layer.
3. Update the `README.md` with details of changes to the interface or new environment variables.
4. Keep Supabase access behind `src/services`, hooks, or `src/lib`; components should not casually own database logic.
5. Your PR will be reviewed by the maintainers. We focus heavily on code quality, UI vibe (clean, structured, community-driven aesthetic), and architectural consistency.

## Security and Safety

Do not open public issues for vulnerabilities, exposed keys, auth bypasses, RLS bypasses, or XSS reports. Follow `SECURITY.md`.

Do not commit `.env`, `.env.local`, production Supabase service role keys, provider API keys, screenshots with secrets, or real user data.

## UI/UX Guidelines

OpenSaga is a creative platform. We prioritize:
- **Card-based layouts** (for visual discovery).
- **Clear visual hierarchies** and status indicators (for structured entities).
- **Dark mode** first design using our custom Tailwind tokens.
- **Micro-animations** for interactive elements to make the UI feel alive.
