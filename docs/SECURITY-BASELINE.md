# Security baseline: the checks every project of ours must pass

Run before every release and when a project is created or changed. Each line says how it is enforced here.
Adapt the mechanism to the stack; never drop the line (say "not applicable" and why).

1. **Secrets** never in code, git history, the published folder or logs. Gate: `tests/secrets.js` (tree, published site, full history; prints type, file, commit, never a value). Keys live in Script/env properties. If one leaks: revoke at the provider first, then replace, then rewrite history only if the repo is public.
2. **Auth**: server-side identity on every request, signed tokens with expiry and revocation (`tokenVer`), device-bound credentials, per-device brute-force budgets, passwords/PINs stored salted and iterated.
3. **Authorisation**: role matrix enforced on the server, row-level scoping (own / team / org), no mass assignment, nobody approves their own change. Gate: `tests/redteam.js` (calls every action as every role with canary data).
4. **Tenant isolation**: one organisation's data never reaches another (separate books, prefixed caches, tokens carry the org). Gate: `tests/tenancy.js`, red team.
5. **Input validation on the server** (type, length, enum, range, format) for every write; the client is convenience only.
6. **Injection**: no string-built queries (Sheets/Apps Script: no SQL; for SQL stacks use parameterised queries only); formula-injection guard on every CSV/Excel export (`csvText`); output escaped with `esc()` in every HTML string; no inline `on*=` handlers.
7. **XSS / headers**: CSP with hashes where the page allows it (platform page), `object-src none`, `base-uri self`, `form-action self`, `upgrade-insecure-requests`, referrer policy, SRI on every third-party file. GitHub Pages cannot set response headers: meta tags only; real headers need a CDN or Node server.
8. **CSRF / cookies**: tokens are sent in the request body, never in cookies, so CSRF does not apply; if a stack uses cookies: `HttpOnly; Secure; SameSite=Lax/Strict`, plus a CSRF token.
9. **CORS**: Apps Script web apps cannot restrict origins (the platform answers every origin; auth is the token). On a Node server: an explicit origin allow-list, no `*` with credentials.
10. **Uploads**: allow-list of types, size cap checked before decoding, real file signature checked (`fileMagicOk_`), no SVG, stored outside the web root.
11. **Rate limiting and abuse**: `rateLimit_` per action, per person and per device; unknown-number scan guard; admin actions limited.
12. **Logging of suspicious activity**: `secEvent_` writes `sec_*` audit lines (forbidden action, rate limit hit, unknown action, bad upload, own-role change); settings and role changes that widen access are audited with before and after. Read through `securityEvents` and `auditList`.
13. **Admin rules locked**: roles granted only by admin, never to oneself, sessions end on change; four-eyes on money (salary, bank account, payroll approval); security settings audited.
14. **Reset / recovery**: no emailed reset links; HR issues a temporary password or activation code that expires (72 h), is single use, stored hashed, forces change at next sign-in.
15. **HTTPS only**: `upgrade-insecure-requests`, GitHub Pages "Enforce HTTPS" on, no http links.
16. **Dependencies**: no unused packages; `npm audit` on every Node part (`native/`, `platform/`); third-party scripts pinned by exact version + SRI.
17. **Debug off in production**: no debug flags, no stack traces or error detail in answers (`detail` only for the platform owner holding the setup key), no `console.log` of secrets.
18. **Exposed files**: published folder holds only the site (no maps, env, keys, backups, backend, tests). Gate: `tests/secrets.js` section 2.
19. **Backups and data location**: owner decision on region (PDPL); Sheets sharing owner-only.
20. **Review**: a full review (red team + this list + a fresh-context reviewer) before each release; findings fixed or recorded with a reason.

Standing gates, all run by tools/deploy.sh: tests/secrets.js (secrets, exposed files, client/server rules), tests/redteam.js (isolation, roles, mass assignment, forged tokens),
tests/secevents.js (suspicious-activity log, locked admin rules), tests/fuzzforms.js (every action x 12 hostile input shapes: no crash, no oversize value stored).
