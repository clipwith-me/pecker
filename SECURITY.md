# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Yes |
| Older branches | ❌ No |

We only provide security fixes for the latest version of Pecker.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in Pecker, please report it responsibly by emailing:

**lekankolawolejohn@gmail.com**

Include the following in your report:
- A description of the vulnerability and its potential impact
- Steps to reproduce the issue (proof of concept if possible)
- Any relevant logs, screenshots, or code snippets
- Your name/handle if you would like to be credited in the fix

### What to Expect

- **Acknowledgement** within 48 hours confirming we received your report
- **Status update** within 7 days on whether the vulnerability is confirmed and the planned fix timeline
- **Credit** in the release notes and/or CHANGELOG once the fix is published, if you wish

We aim to release a patch for confirmed critical vulnerabilities within **14 days** of confirmation.

## Scope

The following are **in scope** for security reports:

- Authentication and authorisation bypass
- RBAC escalation (e.g. a RESIDENT accessing ADMIN endpoints)
- SQL injection or database exposure
- Cross-site scripting (XSS) in incident reports, notifications, or admin views
- Cross-site request forgery (CSRF)
- Sensitive data exposure (passwords, session tokens, private user data)
- Server-side request forgery (SSRF)
- Insecure direct object reference (IDOR) — e.g. accessing another user's private incident

The following are **out of scope**:

- Denial-of-service attacks
- Brute-force attacks on the login page
- Vulnerabilities in third-party services (Vercel, Neon, OpenStreetMap, Ko-fi)
- Social engineering of project maintainers
- Physical security

## Disclosure Policy

We follow a **coordinated disclosure** model. Please give us a reasonable amount of time to fix the vulnerability before any public disclosure. We will work with you to agree on a disclosure timeline.

## Thank You

Security researchers who responsibly disclose vulnerabilities help make Pecker safer for everyone. We are grateful for your contribution to the community.
