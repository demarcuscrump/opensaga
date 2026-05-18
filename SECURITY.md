# Security Policy

OpenSaga is an open-source, production-track alpha. Security reports are welcome and should be handled privately and respectfully.

## Supported Versions

| Version | Supported |
|---|---|
| `main` | Yes |
| `0.1.0-alpha.x` | Yes |
| Older snapshots | No |

## Reporting a Vulnerability

Please do not open a public GitHub issue for vulnerabilities.

Use GitHub private vulnerability reporting if it is enabled on the repository. If private vulnerability reporting is unavailable, contact the repository owner privately using the contact information listed on the owner's GitHub profile.

Include:

- A clear description of the issue
- Steps to reproduce
- Expected and actual behavior
- Affected commit, branch, or version
- Impact assessment, if known
- Screenshots or logs with secrets removed

Do not include real user data, production API keys, Supabase service role keys, OAuth secrets, provider keys, or exploit code that could harm live users.

## Response Expectations

The maintainer will try to:

- Acknowledge the report within 7 days
- Confirm whether the issue is accepted within 14 days
- Share a remediation plan or status update when possible
- Credit the reporter if they want public credit

Timelines may vary while the project is maintained by a small team.

## Security Scope

High-priority areas:

- Supabase Row Level Security bypasses
- Unauthorized proposal canonization or governance state changes
- Auth/session bugs
- Stored or reflected XSS
- BYOK API key exposure beyond expected browser-local storage
- Leaked secrets in repo files, logs, screenshots, or deployment config
- Dependency supply-chain issues

Known alpha risks are documented in `PRODUCTION_READINESS.md`. BYOK keys are stored in browser local storage, which is convenient for alpha use but requires CSP, XSS hardening, and dependency hygiene before production launch.

## Public Disclosure

Please allow the maintainer time to investigate and patch accepted reports before public disclosure. Coordinated disclosure protects early users and contributors while OpenSaga matures.
