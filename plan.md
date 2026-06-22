# Cypress E2E Test Plan — Forail UI (`forail-ui`)

Status: **proposed** · Owner: frontend · Target: post-deploy verification gate

This plan defines an end-to-end (E2E) browser test suite for the Forail UI using
**Cypress**. The suite drives a real browser through the deployed application —
logging in, filling forms, launching jobs and asserting results — to prove the
app works after every deploy. It doubles as a fast **post-deploy smoke test** and
a deeper **regression / acceptance** suite.

---

## 1. Goals & non-goals

**Goals**
- Catch breakage that unit (vitest) and backend (pytest) tests cannot: real
  routing, auth/session, API ↔ UI contract, form validation, rendered data.
- A **< 90 s smoke suite** that runs automatically after each deploy and gates
  promotion (red smoke → roll back / hold).
- A broader **regression suite** covering CRUD for every primary resource and the
  flagship "create everything → launch a job → see it succeed" happy path.
- Stable, low-flake selectors and a fast API-based login so the suite is a
  reliable CI gate, not a source of noise.

**Non-goals**
- Replacing unit tests. E2E is the top of the test pyramid — few, high-value.
- Pixel/visual-diff testing (can be added later via a plugin; out of scope here).
- Exhaustive WebAuthn/passkey hardware flows (covered narrowly; see §6.3).

---

## 2. App facts this plan is built on

| Aspect | Reality in `forail-ui` |
| --- | --- |
| Stack | React 18 + Vite + TypeScript, `react-router-dom` v7, react-hook-form + zod, TanStack Query/Table, Zustand, Tailwind + shadcn-style components. |
| Auth | Django **session cookie + CSRF**. `GET /api/login/` sets `csrftoken`; `POST /api/login/` with `application/x-www-form-urlencoded` body logs in. 401 → client redirects to `/login` (`src/api/client.ts`). |
| MFA | `/auth/mfa` (`MfaChallenge`), WebAuthn passkeys (`/webauthn/authenticate/begin/`), force-password-change (`ForcePasswordChange`). |
| Login form | `#username` (placeholder `admin`), `#password` (`type=password`), `<Button type="submit">`. |
| Forms | Consistent `id=` per field via shadcn `Label htmlFor` + `Input`/`Textarea`/`Select`. e.g. OrganizationForm: `#name`, `#description`, `#max_hosts`. InventoryForm: `#name`, `#organization`, `#kind`. CredentialForm: `#name`, `#credential_type`, `#organization`. Native `<select>` wrappers → `cy.get('#organization').select(...)`. |
| Selectors today | **Only one `data-testid` in the whole codebase.** Selector strategy must be addressed up front (see §5). |
| Routes | Full SPA route table mirrored below (§7). |

---

## 3. Tooling & installation

```bash
# from forail-frontend/
npm i -D cypress @testing-library/cypress cypress-axe \
        @cypress/grep mochawesome mochawesome-merge mochawesome-report-generator
```

Add scripts to `package.json`:

```jsonc
"scripts": {
  "cy:open": "cypress open",
  "cy:run": "cypress run",
  "cy:smoke": "cypress run --env grepTags=@smoke",
  "cy:run:ci": "cypress run --reporter mochawesome --reporter-options reportDir=cypress/reports,overwrite=false,html=false,json=true"
}
```

Pin the Cypress version in `package-lock.json` and cache `~/.cache/Cypress` in CI.

---

## 4. Configuration

`cypress.config.ts`:

```ts
import { defineConfig } from 'cypress'
import registerGrep from '@cypress/grep/src/plugin'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CY_BASE_URL ?? 'https://forail.local',
    defaultCommandTimeout: 8000,     // SPA data fetches
    requestTimeout: 15000,
    retries: { runMode: 2, openMode: 0 },   // tame deploy-time flakiness
    video: true,
    screenshotOnRunFailure: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      registerGrep(config)
      return config
    },
  },
  env: {
    // never hard-code secrets; inject via CI / cypress.env.json (gitignored)
    admin_username: 'admin',
    admin_password: '__set_in_CI__',
    api: '/api',
  },
})
```

- `cypress.env.json` is **gitignored**; CI passes creds via `CYPRESS_admin_password`.
- For the self-signed `forail.local` cert, run CI with `chromeWebSecurity:false` only
  if needed, or trust the dev CA. Prefer trusting the CA.

---

## 5. Selector strategy (decide this first)

The codebase has effectively **no test ids**. Flaky selectors (CSS classes,
nth-child, brittle text) are the #1 cause of E2E rot. Plan:

1. **Introduce a `data-cy` convention.** Add `data-cy="<resource>-<element>"` to
   interactive elements as specs are written — list rows, primary buttons,
   form fields, toasts. Small, incremental PRs alongside each spec.
   - e.g. `data-cy="org-create-btn"`, `data-cy="org-row"`, `data-cy="submit"`.
2. **Interim selectors (until `data-cy` lands):** prefer, in order:
   - existing `id` (`#name`, `#organization`) — already stable on forms,
   - accessible role + name: `cy.findByRole('button', { name: /save/i })`
     (`@testing-library/cypress`),
   - visible text for nav/links: `cy.contains('a', 'Organizations')`.
   - **Avoid** Tailwind class chains and `:nth-child`.
3. Add a custom command `cy.dataCy('org-row')` → `cy.get('[data-cy="org-row"]')`.
4. Toasts use `sonner` → assert on `cy.contains('[data-sonner-toast]', /created/i)`
   (add `data-cy` to the toast wrapper for stability).

> Action item: a one-time pass adding `data-cy` to the shared `Button`, `Input`,
> `Select`, list-row and toast components covers ~80% of selectors cheaply.

---

## 6. Authentication strategy

### 6.1 Fast programmatic login (default for all specs)

Logging in through the UI on every test is slow and flaky. Use an API-based
custom command wrapped in `cy.session` so the session cookie is established once
and cached per user.

`cypress/support/commands.ts`:

```ts
Cypress.Commands.add('login', (
  username = Cypress.env('admin_username'),
  password = Cypress.env('admin_password'),
) => {
  cy.session([username, password], () => {
    const api = Cypress.env('api')
    // 1) prime the csrftoken cookie
    cy.request(`${api}/login/`)
    cy.getCookie('csrftoken').then((c) => {
      // 2) form-encoded POST with the CSRF header, like the UI does
      cy.request({
        method: 'POST',
        url: `${api}/login/`,
        form: true,
        body: { username, password },
        headers: { 'X-CSRFToken': c!.value },
      })
    })
    cy.getCookie('sessionid').should('exist')
  })
})
```

Usage: `beforeEach(() => cy.login())` then `cy.visit('/dashboard')`.

### 6.2 UI login spec (covered explicitly, once)

A dedicated `auth.cy.ts` proves the real login screen works end to end:
- valid creds → lands on `/dashboard`,
- wrong password → inline error, stays on `/login`,
- unauthenticated visit to a deep route (`/organizations`) → redirect to `/login`,
- logout → session cleared, protected route redirects again,
- force-password-change path renders when the backend demands it.

### 6.3 MFA / WebAuthn

- **TOTP/MFA challenge** (`/auth/mfa`): test with a seeded test user whose TOTP
  secret is known to CI; generate the current code with a small Node helper in a
  task, fill the challenge, assert success. Tag `@mfa`, keep out of smoke.
- **WebAuthn passkeys**: use Chrome DevTools Protocol virtual authenticator
  (`Cypress.automation('remote:debugger:protocol', …)` to add a virtual
  authenticator) to exercise register + passwordless login. Single focused spec,
  tag `@webauthn`, optional in CI (Chrome only).

---

## 7. Route & resource coverage map

Primary SPA routes (from `App.tsx`) and the suite that owns each:

| Area | Routes | Spec |
| --- | --- | --- |
| Auth | `/login`, `/auth/mfa`, `/me/security`, force-password-change | `auth.cy.ts` |
| Dashboard | `/`, `/dashboard` | `dashboard.cy.ts` (smoke) |
| Organizations | `/organizations[/new,/:id,/:id/edit]` | `organizations.cy.ts` |
| Users | `/users[/new,/:id,/:id/edit]` | `users.cy.ts` |
| Teams | `/teams[/new,/:id,/:id/edit]` | `teams.cy.ts` |
| Credentials | `/credentials[/new,/:id,/:id/edit]` | `credentials.cy.ts` |
| Projects | `/projects[/new,/:id,/:id/edit]` | `projects.cy.ts` |
| Inventories | `/inventories[/new,/:id,/:id/edit]`, `/hosts[/:id]` | `inventories.cy.ts` |
| Templates (JT) | `/templates`, `/templates/job_template/new`, `/templates/:type/:id` | `job_templates.cy.ts` |
| Workflow templates | `/templates/workflow_job_template[/new,/:id,/:id/edit]` (xyflow DAG) | `workflow_templates.cy.ts` |
| Notification templates | `/notification_templates[/new,/:id,/:id/edit]` | `notifications.cy.ts` |
| Schedules | `/schedules[/:id]` (+ from a template) | `schedules.cy.ts` |
| Jobs | `/jobs[/:id]` (output, xterm) | `jobs.cy.ts` |
| Execution envs / Instances / Groups | `/execution_environments`, `/instances`, `/instance_groups`, `/topology` | `infrastructure.cy.ts` |
| Settings | `/settings`, `/settings/:slug` | `settings.cy.ts` |
| Service catalog | `/service_catalog`, `/service_portal`, `/service_requests/:id`, `/service_approvals`, `/my_requests` | `service_catalog.cy.ts` |
| Drift | `/drift_alerts`, `/drift_alert_rules`, `/drift_detections` | `drift.cy.ts` |
| Policies / OPA | `/policies`, `/policy_decisions` | `policies.cy.ts` |
| Observability | `/observability`, `/analytics`, `/audit`, `/activity`, `/event_logs`, `/event_rules` | `observability.cy.ts` |
| Tenancy | `/tenants[/new,/:id,/:id/edit]`, `/tenant_quota_events` | `tenancy.cy.ts` |

---

## 8. Test data strategy

- **Unique names per run:** suffix every created object with a run id, e.g.
  `cy-org-${Cypress.env('runId')}` (set `runId` once in `support/e2e.ts` from a
  timestamp passed by CI). Prevents idempotency collisions and cross-run bleed.
- **Seed fast via API, assert via UI.** For specs whose subject is resource *B*
  but which need resource *A* to exist, create *A* with `cy.request` (fast),
  then test *B* through the UI. Only test the create-form path in that resource's
  own spec.
- **Tie-in with `import_from_awx`:** an optional `@migration` spec runs the
  backend importer against a throwaway AWX fixture (or seeded API data), then
  asserts through the UI that the imported Organizations / Inventories / Job
  Templates / Workflows / Notification Templates / Schedules and **RBAC role
  assignments** render correctly. This closes the loop between the importer and
  the UI.
- **Cleanup:** `after()` hook deletes run-scoped objects via API (best-effort).
  Keep tests independent — never depend on another spec's leftovers.

---

## 9. Per-resource scenario template

Each resource spec follows the same shape (example: Organizations). Every "fill"
step lists the concrete fields so the spec is unambiguous.

```
organizations.cy.ts
  before each: cy.login()
  @smoke list loads
    visit /organizations → table renders, has the seeded org, search works
  create (happy path)
    click "Create"/nav to /organizations/new
    #name      ← "cy-org-${runId}"
    #description ← "created by cypress"
    #max_hosts ← "25"
    submit → toast "created", redirected to detail, values shown
  validation
    submit empty form → submit disabled / "Name is required"
    duplicate name → backend 400 surfaced as inline/toast error
  edit
    /organizations/:id/edit → change description → save → detail reflects it
  detail tabs
    detail page renders related tabs (teams, admins) without error
  delete
    delete from row/detail → confirm modal → row gone, toast shown
  rbac (optional, @rbac)
    login as non-admin → create button hidden / 403 path handled
```

Apply the same template to **Users** (`#username/#email/#first_name/#last_name`,
password set, system-auditor toggle), **Teams** (`#name/#organization`),
**Credentials** (`#name/#credential_type/#organization` + dynamic inputs incl. a
secret field — assert it is write-only/masked and never echoed back),
**Projects** (`#name/#organization/#scm_type/#scm_url` + sync action),
**Inventories** (`#name/#organization/#kind`; add host + group; verify host count),
**Notification Templates** (`#name/#organization/#notification_type` + type-specific
config; test the "Test" button), **Schedules** (rrule builder via `rrule` lib;
assert next-run preview).

---

## 10. Flagship happy-path E2E (the marquee test)

`happy_path.cy.ts` — one continuous business flow, the strongest single signal
that a deploy is healthy:

1. Login (UI, real screen) → `/dashboard` renders KPIs.
2. Create **Organization** `cy-e2e-${runId}`.
3. Create **Credential** (machine) in that org; confirm the secret field is masked.
4. Create **Project** pointing at a known public demo repo; trigger sync; wait for
   project status → "successful" (poll the detail/status badge).
5. Create **Inventory** + add one **Host**.
6. Create **Job Template** binding the project + inventory + credential + a trivial
   playbook (e.g. `ping`/`debug`).
7. **Launch** the job template → redirected to the **Job detail**; assert the
   xterm output streams and the final status badge becomes **successful**.
8. Create a **Schedule** on the JT; assert it appears with a valid next run.
9. (Optional `@workflow`) Build a 2-node **Workflow** in the xyflow editor wiring
   the JT as a node; save; launch; assert the workflow job graph completes.
10. Cleanup via API.

This single spec exercises auth, routing, every core resource, the live job
runner, websockets/streaming output, and the workflow DAG editor.

---

## 11. Smoke suite (post-deploy gate, `@smoke`, < 90 s)

Minimal, fast, no job execution. Tag these tests `@smoke`:

- App loads, `/login` renders, programmatic login succeeds.
- `/dashboard` renders without console errors (fail on uncaught exceptions).
- Each top-level list route returns 200 and renders its table header:
  `/organizations`, `/inventories`, `/projects`, `/credentials`, `/templates`,
  `/jobs`, `/schedules`, `/notification_templates`, `/settings`.
- `GET /api/v2/ping/` healthy; logged-in `/api/v2/me/` returns the user.
- One trivial create+delete (Organization) to prove writes work end to end.

Run: `npm run cy:smoke`. Wire as the **deploy gate** (see §13).

---

## 12. Cross-cutting suites

- **Negative / validation:** required fields, server-side 400s surfaced to the
  user, 404 route (`/nonexistent` → `NotFound`), 401 redirect, optimistic-update
  rollback on failed mutation.
- **RBAC (`@rbac`):** seed a normal user + an org-admin; assert visibility and
  authorization differences (hidden create buttons, 403 handling). Mirrors the
  importer's role-assignment work.
- **Accessibility (`@a11y`):** `cypress-axe` — `cy.injectAxe()` + `cy.checkA11y()`
  on key pages; start as warnings, ratchet to failures.
- **i18n smoke:** switch language (i18next) and assert a known string changes.
- **Console-error guard:** global `cy.on('uncaught:exception')` and a check that
  no `console.error` fired during smoke (catches React runtime errors).

---

## 13. CI integration (the post-deploy gate)

Pipeline order:

```
deploy (helm upgrade) ─▶ wait-for-rollout ─▶ cy:smoke ──┬─ green ─▶ promote / done
                                                         └─ red ──▶ alert + hold/rollback
nightly ─▶ cy:run (full regression) ─▶ mochawesome report + artifacts
```

- Smoke runs **against the freshly deployed environment** (`CY_BASE_URL` →
  the cluster ingress, e.g. `https://forail.local` or the staging URL).
- Full regression runs nightly and on release branches.
- Always upload **videos + screenshots** on failure as CI artifacts.
- Parallelize the full suite across containers (Cypress `--parallel` with a
  record key, or shard by spec) to keep wall-clock low.
- Use `retries.runMode: 2` to absorb deploy-warmup flakiness without masking real
  failures (a test that needs 3 tries is logged for triage).

---

## 14. Reporting, flake control, conventions

- **Reporter:** mochawesome → merged HTML report per run.
- **Flake policy:** any test that retries to pass is tagged for review; a test
  flaky twice in a week is quarantined (`@flaky`, excluded from the gate) until
  fixed — never deleted silently.
- **Independence:** every spec self-seeds and self-cleans; no ordering deps.
- **No secrets in repo:** creds via `CYPRESS_*` env only.
- **Naming:** `cypress/e2e/<area>.cy.ts`; tags `@smoke @rbac @mfa @webauthn
  @workflow @migration @a11y @flaky`.

---

## 15. Proposed directory layout

```
forail-frontend/
  cypress.config.ts
  cypress.env.json            # gitignored
  cypress/
    e2e/
      auth.cy.ts
      dashboard.cy.ts
      organizations.cy.ts
      users.cy.ts
      teams.cy.ts
      credentials.cy.ts
      projects.cy.ts
      inventories.cy.ts
      job_templates.cy.ts
      workflow_templates.cy.ts
      notifications.cy.ts
      schedules.cy.ts
      jobs.cy.ts
      settings.cy.ts
      service_catalog.cy.ts
      drift.cy.ts
      policies.cy.ts
      observability.cy.ts
      tenancy.cy.ts
      happy_path.cy.ts
      migration.cy.ts         # @migration — importer ↔ UI
    fixtures/                 # seed payloads, AWX migration fixture
    support/
      e2e.ts                  # global hooks, runId, console-error guard
      commands.ts             # login, dataCy, createOrg(API), etc.
```

---

## 16. Phased rollout (priority order)

1. **Phase 0 — foundation:** install Cypress, `cypress.config.ts`, `cy.login`
   command + `cy.session`, `auth.cy.ts`, and the **smoke suite**. Wire smoke as
   the deploy gate. *This alone delivers the post-deploy verification the team
   asked for.*
2. **Phase 1 — `data-cy` pass** on shared `Button`/`Input`/`Select`/list-row/toast
   components + the flagship **`happy_path.cy.ts`**.
3. **Phase 2 — per-resource CRUD specs** (§9), starting with the importer-aligned
   resources: organizations, inventories, credentials, projects, job templates.
4. **Phase 3 — workflow DAG, notifications, schedules, service catalog, drift,
   policies.**
5. **Phase 4 — cross-cutting:** RBAC, MFA/WebAuthn, a11y, i18n, `migration.cy.ts`.

---

## Appendix A — concrete starter spec

`cypress/e2e/organizations.cy.ts`:

```ts
describe('Organizations', () => {
  const name = `cy-org-${Cypress.env('runId')}`
  beforeEach(() => cy.login())

  it('lists organizations', { tags: '@smoke' }, () => {
    cy.visit('/organizations')
    cy.contains('h1, h2', /organizations/i).should('be.visible')
    cy.get('table').should('exist')
  })

  it('creates an organization through the form', () => {
    cy.visit('/organizations/new')
    cy.get('#name').type(name)
    cy.get('#description').type('created by cypress')
    cy.get('#max_hosts').clear().type('25')
    cy.findByRole('button', { name: /save|create/i }).click()
    cy.contains('[data-sonner-toast]', /created/i).should('be.visible')
    cy.url().should('match', /\/organizations\/\d+/)
    cy.contains(name).should('be.visible')
  })

  it('rejects an empty name', () => {
    cy.visit('/organizations/new')
    cy.findByRole('button', { name: /save|create/i }).should('be.disabled')
  })

  after(() => {
    // best-effort API cleanup
    cy.request({ url: `/api/v2/organizations/?search=${name}`, failOnStatusCode: false })
      .then((r) => {
        const id = r.body?.results?.[0]?.id
        if (id) {
          cy.getCookie('csrftoken').then((c) =>
            cy.request({
              method: 'DELETE',
              url: `/api/v2/organizations/${id}/`,
              headers: { 'X-CSRFToken': c?.value ?? '' },
              failOnStatusCode: false,
            }),
          )
        }
      })
  })
})
```

---

## Open questions for the team

- Which environment is the smoke gate target — the dev k3s cluster (`forail.local`)
  or a dedicated staging URL?
- Is there a deterministic demo playbook/project repo we can rely on for the
  job-launch happy path?
- Do we want the `data-cy` convention adopted as a lint-enforced standard on
  interactive components?
