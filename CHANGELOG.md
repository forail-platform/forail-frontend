# Changelog

All notable changes to the Forail Frontend will be documented in
this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to SemVer until the first stable release.

## [Unreleased]

### Security
- **Branding favicon URL validation**: the favicon supplied by the
  unauthenticated host-keyed branding response is only applied when it is an
  `http(s)` or same-origin relative URL, blocking `javascript:`/`data:` schemes.

## [2026.06.0] - 2026-06-14

### Changed
- **Renamed `forge` → `forail`** across the entire project (organization `forgeplatform` → `forail-platform`): the React app, image references (`ghcr.io/forail-platform/forail-*`), CLI, and all documentation/URLs. The GitHub organization and repositories were renamed to match.
- Versioning unified across all platform components to CalVer `2026.06.0`.


## [0.1.0] - 2026-04-17

### Added
- React 18 + Vite + Tailwind + shadcn/ui SPA replacement for the
  legacy AWX UI
- Pages: Dashboard, Jobs, Schedules, Activity, Audit Log, Analytics,
  Templates, Inventories, Hosts, Projects, Credentials, Organizations,
  Users, Teams, Instances, Instance Groups, Execution Env, Settings
- Self-service: Service Portal, My Requests, Approvals, Catalog Admin
- Tenancy: Tenants, Quota Events
- Compliance: Drift Detections, Drift Alerts, Alert Rules
- Automation: Event Rules, Event Logs, Outbound Webhooks
- Login flow with username/password, WebAuthn / passkeys ("Sign in
  with security key"), and OIDC
- Forced password change on first admin login (gated by localStorage
  flag `forail_password_changed_<userId>`)
- Floating chat widget (AssistantPanel) wired to the Forail Assistant
  service; context-aware (passes current page to the LLM)
- GettingStartedWizard for org / project / inventory / credential /
  first template setup, including SSH password and private-key fields
- Vitest test suite covering API client, store, and key components

### Changed
- Job detail routing now resolves to the correct unified-job subtype
  endpoint instead of the generic jobs endpoint
- AssistantPanel always shows the floating button and keeps the input
  enabled even when the backend service is unreachable
