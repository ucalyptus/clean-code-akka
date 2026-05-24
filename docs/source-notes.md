# Source Notes

This repo is original guidance informed by the following sources. It does not
reproduce book text.

## Primary Project Source

- [leonardolemie/clean-code-java](https://github.com/leonardolemie/clean-code-java)
  provided the original guide shape and MIT-licensed starting point.

## Official Akka Sources

- [Akka SDK documentation](https://doc.akka.io/sdk/index.html)
- [Akka release notes](https://doc.akka.io/reference/release-notes.html)
- [Akka architecture and project structure](https://doc.akka.io/concepts/architecture-model.html)
- [Running an Akka service locally](https://doc.akka.io/sdk/running-locally.html)
- [Designing HTTP endpoints](https://doc.akka.io/sdk/http-endpoints.html)
- [Implementing key value entities](https://doc.akka.io/sdk/key-value-entities.html)
- [Implementing workflows](https://doc.akka.io/sdk/workflows.html)
- [Implementing views](https://doc.akka.io/sdk/views.html)
- [Agents](https://doc.akka.io/sdk/agents.html)

## Book Influences

The local references listed by the repository owner were used as conceptual
input:

- Robert C. Martin, *Clean Code* and *The Clean Coder*
- Robert C. Martin, *Clean Architecture*
- Robert C. Martin, *Clean Agile*
- John Ousterhout, *A Philosophy of Software Design*

The adaptation emphasizes:

- Meaningful names, small functions, clean tests, and boundary discipline.
- Dependency direction and use-case-centered architecture.
- Small increments, acceptance tests, refactoring, and simple design.
- Complexity reduction, information hiding, deep modules, and layer-specific
  abstractions.

## Adaptation Policy

- Prefer Akka SDK terminology over generic Java terminology.
- Prefer business examples over framework-only examples.
- Prefer current official Akka docs for API-specific claims.
- Re-check release notes before adding API examples, especially for annotations,
  workflow APIs, agent features, CLI commands, and runtime operations.
- Avoid copying book prose.
- Treat component ids, event names, routes, topics, and persisted state as
  contracts.
