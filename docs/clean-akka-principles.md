# Clean Akka Principles

Clean Akka code minimizes two forms of complexity:

- Local complexity: code that is hard to read, test, or change.
- Runtime complexity: behavior that is hard to reason about once the service is
  distributed, durable, replicated, or event-driven.

The best Akka SDK code keeps those two pressures visible.

## 1. Make The Architecture Say What The Service Does

Package by business capability first, then by Akka role inside that capability.

```text
com.example.checkout
  api/
  application/
  domain/
```

Avoid a repository where the only visible architecture is `entities/`,
`workflows/`, `views/`, and `endpoints/`. Those are framework categories, not
business capabilities.

## 2. Keep The Domain Independent

Domain code should not import Akka SDK types. It should not know about
`ComponentClient`, `Effect`, annotations, brokers, HTTP status codes, or agent
sessions.

Good domain code answers business questions:

```java
order.isReadyToShip()
cart.add(item)
invoice.markPaid(paymentReference)
```

Application code connects those decisions to Akka effects:

```java
return effects()
    .updateState(currentState().markPaid(command.paymentReference()))
    .thenReply(Done::done);
```

## 3. Design Components Around Ownership

Before creating a component, answer:

- What durable fact or process does this component own?
- What is its stable component id?
- What state does it persist?
- What commands can change that state?
- What events or notifications does it expose?
- What should never be exposed outside the component?

If ownership is unclear, the component will become a dumping ground.

## 4. Use Entities For Facts, Workflows For Processes

Use an entity when the main problem is protecting and evolving state for one
business identity.

Use a workflow when the main problem is durable coordination across time,
steps, retries, external systems, or human decisions.

Do not hide long-running business processes inside endpoints or entity command
handlers.

## 5. Treat Views As Read Models

Views are query models, not the source of truth. They exist to serve access
patterns and may lag behind writes.

Clean view design:

- Names the access pattern: `customers-by-email`, `orders-by-status`.
- Uses stable table and component names.
- Projects only what readers need.
- Documents whether the caller can tolerate eventual consistency.

## 6. Make Consumers Idempotent

Consumers should assume redelivery. A clean consumer can answer:

- What message identity makes duplicate detection possible?
- What state records that a message was handled?
- What happens if the external side effect succeeds but the handler is retried?
- What alerts or compensating paths exist for poison messages?

## 7. Use Agents Only Where Non-Determinism Belongs

Agents are excellent when a service needs language understanding, generation,
tool selection, or multi-turn model context. They are the wrong abstraction for
deterministic business state.

Use:

- Entity: account balance, cart state, customer profile.
- Workflow: checkout, refund, onboarding, approval.
- Agent: classify support intent, summarize evidence, produce draft content.

## 8. Make Contracts Stable And Explicit

Akka services accumulate contracts:

- HTTP routes
- Component ids
- Event type names
- Workflow step names
- View table names
- Public DTOs
- Topic names
- Agent session semantics

Treat changes to these as migrations, not refactors.

## 9. Prefer Deep Modules

A good component hides runtime complexity behind a narrow business interface.
The caller should not know whether the implementation uses an event sourced
entity, key value entity, workflow, view, timer, or downstream service unless
that distinction is part of the public contract.

Shallow modules are common smells:

```java
public Done addItemAndUpdateCartViewAndMaybeStartCheckout(...)
```

Deep modules are easier to use:

```java
cart(cartId).addItem(command)
checkout(orderId).start(command)
```

## 10. Keep The Service Operable

Clean code includes runtime evidence. Important state changes should be visible
through logs, views, notifications, console inspection, or explicit query APIs.

Do not make operators infer the current state of a workflow from scattered logs.
