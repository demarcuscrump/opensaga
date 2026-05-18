# Contributor Roadmap

OpenSaga is ready for community involvement as a production-track alpha. This guide helps contributors find useful work without needing private context from the maintainer.

## Project Positioning

Use this framing:

> OpenSaga is an open-source, production-track alpha for community-governed worldbuilding.

Avoid claiming:

> OpenSaga is production ready.

The codebase is real and useful, but public beta still needs deployment, security validation, deeper governance E2E coverage, and accessibility work.

## Good First Issue Areas

These are safe, useful places for new contributors to start:

- Improve docs for setup, Supabase configuration, deployment, and core concepts
- Add Playwright tests for existing flows
- Improve keyboard navigation and focus states
- Add accessible labels to forms, icon buttons, and modals
- Tighten empty states and loading states with existing UI components
- Expand `docs/core-concepts.md` with diagrams or examples
- Add screenshots to README once a public demo is live
- Add bundle-size documentation and an optional analyzer script

## Contributor Workstreams

### Documentation

Best for first-time contributors. Keep docs honest about what is implemented today versus roadmap.

Useful tasks:

- Add Supabase setup screenshots
- Add OAuth callback examples
- Document common local setup problems
- Expand glossary terms: World, Bible, Canon, Proposal, Lorekeeper

### Testing

Highest-impact testing work:

- Create world -> submit proposal -> vote -> canon E2E
- Protected-route redirects with Supabase configured
- Mobile navigation smoke tests
- Creator Studio draft persistence tests
- Accessibility checks for modals and forms

### Accessibility

Focus on:

- Keyboard-only navigation
- Visible focus states
- Dialog labels and escape behavior
- Form labels and error messages
- Color contrast in Noir and Paper themes

### Supabase and Governance

Public beta needs stronger validation here.

Useful tasks:

- RLS test matrix for anonymous, member, author, creator, and non-member roles
- Server-trusted proposal tallying through Edge Functions or RPC
- Tests for double-vote prevention
- Tests for unauthorized proposal status changes
- Deployment notes for scheduled Edge Functions

### Creator Studio

Good medium-sized tasks:

- Relationship Mapper MVP
- Power System Generator MVP
- Species/Race Builder MVP
- Shared Creation DNA vault backed by Supabase/Postgres vector search
- Markdown export for generated characters and lore
- Richer draft gallery

## Public Beta Milestone

OpenSaga should not be called public beta until these are done:

- Hosted Supabase project provisioned
- OAuth providers configured and verified
- App deployed with preview and production environments
- Proposal tally Edge Function deployed and scheduled
- RLS/security review completed
- Full governance-loop E2E coverage added
- Accessibility pass completed across navigation, forms, modals, and mobile
- Deployment docs verified by a fresh clone

## How to Pick an Issue

1. Look for `good first issue`, `docs`, `tests`, `accessibility`, or `help wanted` labels.
2. Comment that you want to work on it.
3. Keep the first PR small.
4. Run `npm run check` before opening the PR.
5. If your change touches user flows, run `npm run test:e2e`.

## Maintainer Notes

When creating issues for the community, include:

- Clear outcome
- Relevant files
- Acceptance criteria
- Commands to run
- Whether the task is beginner-friendly

Example:

```md
## Goal
Add keyboard focus checks to the Creator Studio settings modal.

## Files
- src/features/ai-assist/SettingsModal.tsx
- e2e/studio.spec.ts

## Acceptance Criteria
- Modal can be opened and closed with keyboard flow.
- Focus is visible on actionable controls.
- `npm run check` passes.
- `npm run test:e2e` passes.
```
