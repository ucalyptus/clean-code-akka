# Component Playbook

Use this when deciding which Akka SDK component to create and how to keep it
clean.

## Decision Table

| Need | Prefer | Clean-Code Rule |
| --- | --- | --- |
| Public JSON API | HTTP endpoint | Endpoint translates; domain decides |
| Durable state by id | Key Value Entity | State is immutable and has an explicit empty state |
| Auditable state history | Event Sourced Entity | Events are business facts with stable type names |
| Long-running process | Workflow | Steps are named business transitions |
| Query by attributes | View | Model the read access pattern explicitly |
| External event ingestion | Consumer | Handler is idempotent |
| Scheduled action | Timer | Time is part of the business model |
| LLM-backed reasoning | Agent | Non-determinism is isolated and evaluated |

## HTTP Endpoints

Clean endpoint checklist:

- Route path is named after a resource or business action.
- ACL/auth decision is visible at the class or method boundary.
- Request DTOs are public contracts, not entity state.
- Endpoint calls one application-level operation per route.
- Expected failures are translated into public errors.
- No durable state is stored in endpoint fields.

Bad endpoint names:

```java
@HttpEndpoint("/api")
class ApiEndpoint {}
```

Good endpoint names:

```java
@HttpEndpoint("/carts")
class ShoppingCartEndpoint {}
```

## Entities

Clean entity checklist:

- `@Component(id = "...")` is stable and business-named.
- `emptyState()` exists for key value entities.
- State records are immutable.
- Command names are verbs in the business language.
- Read-only handlers use read-only effects.
- Domain calculations are delegated to domain objects.
- External side effects are deliberate and protected from duplicate execution.

Entity smell:

```java
public Effect<Done> update(UpdateCommand command)
```

Better:

```java
public Effect<Done> reserveInventory(ReserveInventory command)
```

## Event Sourced Entities

Clean event checklist:

- Events are facts that already happened.
- Event names are past tense: `OrderPaid`, `InventoryReserved`.
- Event payloads are minimal but sufficient to rebuild state.
- Type names are stable.
- Command validation happens before events are persisted.
- Event handlers are deterministic and side-effect free.

Bad event:

```java
record UpdateOrder(String field, String value) implements OrderEvent {}
```

Good events:

```java
record ShippingAddressChanged(Address address) implements OrderEvent {}
record OrderPaid(PaymentReference paymentReference) implements OrderEvent {}
```

## Workflows

Use the current typesafe/fluent Workflow API for new code. The older Step API is
deprecated; only reference it when documenting an explicit migration.

Clean workflow checklist:

- Workflow id maps to one business process instance.
- Steps are named after business transitions.
- State records what operators need to understand progress.
- Waiting states are explicit.
- Timeouts and retries are part of the design.
- Compensation is modeled, not hidden in catch blocks.
- Human intervention paths are command handlers with clear guards.
- Notifications, suspend/resume, termination, and timeout behavior are modeled
  where operators or clients need them.

Workflow smell:

```java
private StepEffect step2() { ... }
```

Better:

```java
@StepName("capture-payment")
private StepEffect capturePayment(CapturePayment input) { ... }
```

## Views

Clean view checklist:

- View name describes the query: `orders-by-customer`.
- Query method names describe the access pattern.
- Row model is a projection, not a leaked aggregate unless deliberate.
- The endpoint using the view documents eventual consistency when relevant.
- Incompatible query or table changes are treated as migrations.
- Snapshot or timestamp starts are documented when they are used to avoid full
  event-history replay.

## Consumers

Clean consumer checklist:

- Message source is obvious from the annotation and class name.
- Handler is idempotent.
- Poison-message behavior is explicit.
- External side effects can survive retries.
- Business correlation ids are logged.
- Snapshot, timestamp, or history start behavior is explicit for high-volume
  sources.

## Agents

Use current agent vocabulary in new code: `@AgentRole` for the agent role, and
`@Component(id = "...")` for component identity where a component annotation is
needed.

Clean agent checklist:

- Agent role is narrow.
- Prompt construction is named and tested where possible.
- Tool calls are explicit and bounded.
- Session memory semantics are documented.
- Guardrails, memory filters/interceptors, and model-provider settings are
  explicit where they affect behavior.
- Deterministic business rules stay outside the agent.
- Evaluation cases cover expected model behavior.

Agent smell:

```java
class BusinessRulesAgent extends Agent { ... }
```

Better:

```java
class SupportIntentClassifierAgent extends Agent { ... }
```

## Timers

Clean timer checklist:

- Timer name says why time matters.
- Scheduling command is separate from the action being scheduled.
- Repeated timers are idempotent.
- Cancellation path is explicit.
- Time values are constants or configuration, not magic numbers.
