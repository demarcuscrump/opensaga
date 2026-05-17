# Contributing to OpenSaga

First off, thank you for considering contributing to OpenSaga! It's people like you that make open source such a fantastic community.

## Development Workflow

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** using `npm install`.
3. **Run the local dev server** using `npm run dev`.
4. Ensure your code aligns with the **Feature-Sliced Design** outlined in `ARCHITECTURE.md`.
5. Keep your code modular and use existing UI components from `src/components` whenever possible to maintain a consistent aesthetic.

## Pull Request Process

1. Ensure any new features are accompanied by updates to the relevant `.md` documentation in the `docs/` folder.
2. Verify that your code does not introduce vendor lock-in. For example, if you are adding an AI feature, ensure it routes through the `AIEngine` abstraction layer.
3. Update the `README.md` with details of changes to the interface or new environment variables.
4. Your PR will be reviewed by the maintainers. We focus heavily on code quality, UI vibe (clean, structured, community-driven aesthetic), and architectural consistency.

## UI/UX Guidelines

OpenSaga is a creative platform. We prioritize:
- **Card-based layouts** (for visual discovery).
- **Clear visual hierarchies** and status indicators (for structured entities).
- **Dark mode** first design using our custom Tailwind tokens.
- **Micro-animations** for interactive elements to make the UI feel alive.
