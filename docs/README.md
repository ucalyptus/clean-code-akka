# clean-code-akka docs

This directory turns the top-level clean-code guide into practical Akka SDK
engineering guidance.

## Reading Order

1. [Clean Akka Principles](clean-akka-principles.md)
2. [Architecture Boundaries](architecture-boundaries.md)
3. [Component Playbook](component-playbook.md)
4. [Testing Strategy](testing-strategy.md)
5. [Akka Clean Code Anti-Patterns](anti-patterns.md)
6. [Review Checklist](review-checklist.md)
7. [Source Notes](source-notes.md)

## What This Repo Optimizes For

- Akka SDK services whose behavior is understandable from package structure.
- Domain logic that can be tested without a runtime.
- Durable state and event models that are stable enough to operate.
- Review checklists that catch Akka-specific design problems early.
- Examples that show where code belongs, not just what syntax compiles.

## Non-Goals

- Replacing the official Akka documentation.
- Reproducing copyrighted Clean Code, Clean Architecture, Clean Agile, or
  Philosophy of Software Design text.
- Teaching every Akka SDK API.
- Providing a production template for every possible service shape.

Use the official Akka docs for syntax and version-specific API details. Use this
repo for design judgment.
