## Summary

- 

## Akka Boundary Check

- [ ] Domain code remains free of Akka/runtime imports.
- [ ] Endpoint changes are transport-boundary changes, not hidden business logic.
- [ ] Component ids, event type names, view table names, routes, and topics are treated as contracts.
- [ ] Workflow changes make retries, waiting states, and compensation explicit.
- [ ] View changes account for eventual consistency and migration/rebuild impact.

## Tests / Verification

- [ ] Markdown checks pass with `node scripts/check-markdown.mjs`.
- [ ] Examples were checked against current official Akka docs when API-specific.
- [ ] Any intentional verification gap is listed below.

## Notes

- 
