# Contributing

`clean-code-akka` is a documentation-first repo. Contributions should improve
Akka SDK design judgment, not just add more examples.

## Contribution Standards

- Use official Akka documentation for API-specific claims.
- Keep examples short and focused on the design principle.
- Do not copy prose from books or proprietary training material.
- Prefer Akka SDK terms: endpoint, entity, workflow, view, consumer, timer,
  agent, `ComponentClient`, effect, state, event, notification.
- Show why code is clean in distributed/runtime terms, not only Java style
  terms.
- Preserve attribution to the original `clean-code-java` project.

## Good Contributions

- A new Akka-specific anti-pattern with a clear better alternative.
- A checklist item that catches a real review failure.
- A small before/after example that clarifies component ownership.
- A testing strategy note grounded in Akka SDK behavior.
- A source update when official Akka docs change.

## Avoid

- Large runnable applications that distract from the guide.
- Framework syntax dumps copied from docs.
- Generic Java advice that does not mention Akka SDK design pressure.
- New dependencies or generated assets.
- Long quotes from books.

## Local Checks

Run:

```bash
node scripts/check-markdown.mjs
node scripts/build-site.mjs
```

The checks validate local README/doc anchor links, verify required files are
present, and build the GitHub Pages documentation site into `dist/`.
