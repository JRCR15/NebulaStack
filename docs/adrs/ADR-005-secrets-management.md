# ADR-005: Secrets never in git

## Status

Accepted

## Context

Prompt MD sketch hardcoded DB passwords.

## Decision

- Local: `deploy/compose/.env` (gitignored) from `.env.example`
- Terraform: sensitive variables via `TF_VAR_*` or AWS SSM/Secrets Manager data sources
- Prefer RDS `manage_master_user_password` when applicable
- Commit only `*.tfvars.example`

## Consequences

Slightly more setup steps; safe for classroom repositories.
