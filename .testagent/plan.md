# Trial onboarding test plan

1. Add `tests/trial-onboarding.test.mjs` using the repository's source-assertion convention.
2. Map redirect and login requirements to dedicated UI/route tests.
3. Map API protection and pending creation to a dedicated endpoint-contract test.
4. Map pending routing guards to one test covering login action, login page, root page, and portal context.
5. Map admin review support to one test covering the explicit route, navigation, view selection, and mutations.
6. Extract the approval SQL function body and assert its exact insert cardinality plus trial values.
7. Assert database check constraints, lock-based limit function, and both insert triggers.
8. Run the full `npm.cmd test` suite, then re-open the generated test and audit every assertion against this checklist.
