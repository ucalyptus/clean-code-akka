# Architecture Boundaries

Akka SDK projects are easiest to maintain when the code follows dependency
direction:

```text
api -> application -> domain
```

Dependencies point inward. The domain does not depend on Akka, HTTP, JSON, SQL,
brokers, LLM providers, or deployment configuration.

## Layer Responsibilities

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `api` | HTTP/gRPC/MCP routes, request DTOs, response DTOs, auth and ACL boundary, status-code translation | Durable state, business rules, workflow step logic |
| `application` | Akka components, effects, component calls, runtime orchestration, persistence boundaries | HTTP request parsing, raw business calculations that can live in domain |
| `domain` | Records, value objects, policies, invariants, pure transformations | Akka imports, infrastructure clients, framework annotations |
| `resources` | Configuration, descriptors, static assets | Business behavior |
| `test` | Domain tests, component tests, endpoint tests, integration scenarios | Unverified examples or test-only production APIs |

## Boundary Rules

### API Boundary

Endpoints should:

- Accept public request DTOs.
- Validate transport-level requirements.
- Enforce ACL and authentication assumptions.
- Call application components through `ComponentClient`.
- Convert component replies to public response DTOs.
- Translate expected domain/application failures into useful HTTP responses.

Endpoints should not:

- Mutate local maps as service state.
- Execute multi-step business processes directly.
- Return internal entity state unless it is intentionally public.
- Hide access-control decisions in helper methods far from the route.

### Application Boundary

Application components should:

- Own Akka effects.
- Protect state transitions.
- Coordinate workflows and component calls.
- Publish events, notifications, and read-model updates.
- Keep component ids, event names, and table names stable.

Application components should not:

- Duplicate domain rules already expressible in records or policies.
- Use static mutable state for business data.
- Depend on endpoint request DTOs.

### Domain Boundary

Domain code should:

- Use plain Java records/classes.
- Express invariants with names.
- Return new immutable values instead of mutating shared objects.
- Be exhaustively unit-testable without Akka.

Domain code should not:

- Return `Effect`.
- Throw HTTP exceptions.
- Know about serialization tables, routes, brokers, or LLM providers.

## Dependency Smells

- A domain class imports `akka.*`.
- A workflow imports an endpoint request class.
- An endpoint contains more business branching than a domain policy.
- A view table name changes during a cosmetic refactor.
- A test can only verify a simple total calculation by starting Akka.
- A public response exposes an internal event or entity state type.

## Package Shape

Prefer capability-oriented packages:

```text
com.example.commerce.checkout
  api/
  application/
  domain/
```

over framework-oriented packages:

```text
com.example
  endpoints/
  entities/
  workflows/
  views/
```

Framework-oriented packages make every feature sprawl across the tree.
Capability-oriented packages keep change localized.
