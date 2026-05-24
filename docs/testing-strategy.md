# Testing Strategy

Clean Akka services use a test pyramid that matches risk.

```text
many     domain unit tests
some     component tests
fewer    endpoint and integration tests
rare     full end-to-end tests
```

## 1. Domain Unit Tests

These are the fastest and most important tests. They prove business rules
without Akka.

Test:

- Value object validation
- State transitions
- Policies
- Money/time calculations
- Idempotency decisions
- Error cases

Example:

```java
@Test
void paidOrderWithAddressAndLinesIsReadyToShip() {
  var order = Orders.paid()
      .withShippingAddress(Addresses.valid())
      .withLines(List.of(OrderLine.of("akka-tshirt", 2)));

  assertThat(order.isReadyToShip()).isTrue();
}
```

## 2. Component Tests

Component tests prove Akka behavior:

- Entity state updates
- Event persistence and replay behavior
- Workflow transitions
- View projection logic
- Consumer idempotency
- Agent boundary logic

Keep these focused. If a component test is hard to write, the component may be
doing too much.

## 3. Endpoint Tests

Endpoint tests prove public contracts:

- Route paths
- Request/response DTO shape
- Status-code translation
- ACL/auth assumptions
- Component-client wiring

Do not retest every domain rule through HTTP. That makes failures slow and
ambiguous.

## 4. Workflow Scenario Tests

Workflows deserve scenario tests because they encode time and coordination.

For each workflow, cover:

- Happy path
- Expected business rejection
- Retryable external failure
- Non-retryable external failure
- Timeout or waiting state
- Duplicate command
- Resume after partial progress

## 5. View Tests

Views should be tested around access patterns:

- Source event/state maps to the correct row.
- Ignored events are actually ignored.
- Query shape returns the intended projection.
- Delete behavior is intentional.

Remember that views are eventually consistent in real operation. Tests should
not teach callers to assume immediate read-after-write unless the system
actually guarantees it at the boundary being tested.

## 6. Consumer Tests

Consumers should prove idempotency.

Minimum cases:

- First delivery produces the intended state/side effect.
- Duplicate delivery is harmless.
- Out-of-order or irrelevant messages are ignored or rejected explicitly.
- Poison-message handling is observable.

## 7. Agent Tests

Agents need two complementary checks:

- Deterministic tests around prompt construction, tool boundaries, DTO mapping,
  and fallback behavior.
- Evaluation cases for model quality, safety, and expected response shape.

Do not hide critical business invariants inside a model response. Validate model
output before it affects durable state.

## Definition Of Done

A change is done when:

- Domain rules changed by the PR have fast unit tests.
- Akka component behavior changed by the PR has component tests.
- Public routes changed by the PR have endpoint tests or explicit manual curl
  evidence.
- Workflow changes include at least one failure-path test.
- View changes document any migration or rebuild implications.
- `mvn test` or the project-specific equivalent passes.
