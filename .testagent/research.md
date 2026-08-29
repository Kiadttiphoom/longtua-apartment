# Trial onboarding test research

## Target inventory

- `app/register/page.tsx`: legacy in-app registration redirect.
- `components/auth/LoginForm.tsx`: shared login UI.
- `app/api/public/trial-requests/route.ts`: marketing-site trial request endpoint.
- `app/auth/actions.ts`, `app/page.tsx`, `app/login/page.tsx`, `lib/portal/context.ts`: pending-applicant routing guards.
- `app/(admin)/admin/trial-requests/page.tsx`, `components/admin/AdminPlatformShell.tsx`, `components/admin/AdminViewContent.tsx`, `components/admin/views/AdminManagementViews.tsx`, `app/(admin)/admin/actions.ts`: admin review workflow.
- `supabase/migrations/20260829103004_trial_approval_workflow.sql`: pending request storage, atomic approval, 30-day trial, and plan-limit enforcement.

## Existing test conventions

- Node built-in `node:test` with `node:assert/strict`.
- Tests are `.mjs` files under `tests/` and are run by `node --test tests/*.test.mjs`.
- Architecture and database behavior are commonly verified with focused static source and SQL migration assertions.
- Test names use the `area_behavior_expectation` convention.

## Acceptance checklist

- `/register` redirects to the marketing registration URL.
- Login has no signup link and does expose support contact.
- Public trial API requires a server secret and creates a pending request.
- Pending applicants are redirected to `/registration/pending`.
- Admin exposes the trial-request route, menu, view, approve action, and reject action.
- Approval atomically creates exactly one organization and one property, then starts a 30-day trial limited to one property and 100 rooms.
- Database triggers enforce property and room limits.

## Static pairing note

The required tree-sitter pairing analyzer was invoked once but could not run because `tree-sitter-language-pack` is not installed. Existing repository test conventions and targeted source inventory were therefore used as the fallback. Static source pairing is not line or branch coverage.
