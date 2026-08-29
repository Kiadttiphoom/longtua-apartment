# Trial onboarding test status

## Validation

- Focused suite: `node --test tests/trial-onboarding.test.mjs` — 7 passed, 0 failed.
- Full suite: `npm.cmd test` — 63 passed, 0 failed.

## Requirement audit

- Marketing redirect: covered by `trialRegistration_legacyRegisterRoute_redirectsToMarketingRegistration`.
- Login support/no signup: covered by `loginUi_hasSupportContactAndDoesNotOfferSignup`.
- Secret-protected pending API: covered by `publicTrialApi_requiresServerSecretAndCreatesPendingRequest`.
- Pending routing: covered by `pendingApplicants_areRedirectedToRegistrationPendingBeforePortalAccess`.
- Admin route/menu/actions: covered by `adminTrialRequests_hasExplicitRouteMenuViewAndReviewActions`.
- Atomic one-org/one-property 30-day approval: covered by `trialApproval_createsExactlyOneOrganizationAndPropertyAndStartsLimitedThirtyDayTrial`.
- Database plan-limit enforcement: covered by `trialDatabase_enforcesOnePropertyAndOneHundredRoomLimits`.

## Gap and assertion review

- The generated suite has no assertion-free or trivial-only tests.
- Assertions cover positive presence, negative absence, exact cardinality, explicit path existence, state values, security grants, and database boundaries.
- High-risk pseudo-mutations are killed statically: removing the API-secret guard, changing pending status, creating an organization before approval, changing the 30-day interval, adding a second organization/property insert, changing limits from 1/100, or removing either enforcement trigger would fail a named assertion.
- Remaining limitation: endpoint and SQL tests follow the repository's static contract-test convention; they do not execute a live Supabase database. This is appropriate for the requested scope but is not evidence of runtime line/branch coverage.
