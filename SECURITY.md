# Security Policy

## Reporting

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/aneeshk-ds/Weathered/security/advisories/new). Do not include credentials, personal check-ins, exported backups, or precise location data in a public issue.

Use [GitHub Issues](https://github.com/aneeshk-ds/Weathered/issues) only for non-sensitive bugs.

## Repository Rules

- Never commit `.env` files, tokens, credentials, signing keys, service-account files, APKs, or generated native projects.
- Store build credentials in GitHub Actions secrets.
- Client-side Supabase configuration may use only a publishable key; never use a secret or `service_role` key.
- Keep row-level security enabled and scope every synced row to `auth.uid()`.
- Treat exported backups and decision notes as sensitive user data.
- Rotate any credential immediately if it is accidentally exposed, then remove it from the current tree and repository history as appropriate.

`npm run validate` includes checks for common credential formats and prohibited generated or credential files.
