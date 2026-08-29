# Template execution contract

## Reference

- Source: `C:\Users\kiadt\.codex\skills\artifact-template-system-design\assets\reference.docx`
- SHA-256: `13504F6C221A42C1726460A9E865E563355539FF97D702D6C9B2267B4B261D76`
- Sections: 1
- Page count: unresolved because LibreOffice/soffice is unavailable; the retained `preview.png` was inspected instead.
- Evidence: `template-style-evidence.json`, section audit output, complete paragraph/table inventory, retained preview.

## Page system

- US Letter portrait, 8.5 x 11 inches.
- Margins: left/right/top 0.70 inches; bottom 0.62 inches.
- Different first page enabled. Two header/footer part pairs are preserve-only.
- One section beginning on a new page.

## Typography and components

- Preserve retained Helvetica Neue-led typography, navy/slate hierarchy, title block, metadata band, pale-blue label cells, numbered Heading 1 sections, Heading 3 subsections, tables, figure caption, headers, footers, and page furniture.
- Preserve retained styles and numbering definitions; edit the semantic text slots only.
- Replace the retained architecture figure payload using its existing image relationship and drawing geometry.
- Tables retain their existing grids, fills, borders, cell margins, and repeating visual language.

## Content flow and slot map

1. Cover: system name, proposal title, status, owner, date, authors, reviewers, related docs, scope.
2. Abstract: current duplication, target boundaries, intended result.
3. Goals/non-goals: measurable code-sharing, security, route clarity, excluded redesign/migration work.
4. Background/problem statement: duplicated UI primitives and broad admin queries.
5. Proposed architecture: route groups, server loaders/actions, shared UI, feature composition, Supabase/RLS.
6. Request lifecycle: authentication through rendering/mutation/revalidation.
7. API/data contracts: serializable view models and server action inputs.
8. Consistency/idempotency/replay: organization scoping, mutations, revalidation, audit behavior.
9. Security/privacy: fail-closed authorization, service-role boundary, RLS, logging restrictions.
10. Operational readiness: lint/tests/build, monitoring signals and rollout gates.
11. Alternatives: one shared full page, fully duplicated UIs, dynamic admin section, client fetching.
12. Open questions: pagination/virtualization, feature extraction depth, telemetry ownership, visual regression.
13. Decision/next steps: adopted shared primitives with separate security/data boundaries.

## Package preservation

- Preserve-only: styles, numbering, theme, headers, footers, section properties, drawing geometry, relationships, and all opaque package parts.
- Editable: body text nodes, table cell text, cover metadata text, figure caption, and `word/media/image1.png` payload.
- The retained reference must remain byte-for-byte unchanged.

## Fidelity gates

- Final section geometry must match the reference audit.
- Title/metadata/table/heading visual system must remain source-derived.
- No placeholders in square brackets may remain.
- No clipping, overlapping, broken tables, or unexplained package-part loss.
- Visual render QA is required when LibreOffice becomes available; otherwise perform structural audits and disclose that render QA was unavailable.
