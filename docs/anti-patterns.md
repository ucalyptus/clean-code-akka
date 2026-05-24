# Akka Clean Code Anti-Patterns

## 1. Endpoint As Transaction Script

Symptom: an HTTP method validates, loads state, calls external systems, updates
multiple components, sends email, and returns success.

Why it hurts: the public request lifecycle becomes the business process. Retries,
timeouts, and partial failure are hard to reason about.

Prefer: a workflow for multi-step durable processes.

## 2. Entity As Junk Drawer

Symptom: one entity owns cart state, payment state, shipment state, customer
profile state, and notification flags.

Why it hurts: every new behavior changes the same component and persisted state.

Prefer: components with clear business ownership.

## 3. View As Source Of Truth

Symptom: commands read from a view and make critical decisions as if the view is
always current.

Why it hurts: views are read models and can lag behind writes.

Prefer: commands that require strong consistency should use the owning entity or
workflow.

## 4. Agent As Business Rule Engine

Symptom: an LLM decides whether money moves, inventory is reserved, or access is
granted.

Why it hurts: deterministic invariants become non-deterministic and difficult to
audit.

Prefer: agents classify, summarize, draft, or recommend; domain policies decide.

## 5. Static Mutable State

Symptom: caches, maps, counters, or session registries stored in static fields.

Why it hurts: Akka services can run with multiple instances; local JVM state is
not durable service state.

Prefer: entities, workflows, external caches with explicit consistency
semantics, or per-request local values.

## 6. Generic Component Names

Symptom: `processor`, `manager`, `handler`, `service`, `data`.

Why it hurts: runtime diagnostics and future migrations depend on names.

Prefer: names that describe business ownership: `shopping-cart`,
`checkout-workflow`, `orders-by-customer`.

## 7. Anemic Domain, Fat Component

Symptom: records contain only fields while entity handlers contain all business
rules.

Why it hurts: business behavior can only be tested through Akka.

Prefer: domain records with named methods and policies.

## 8. Event Names That Describe Storage, Not Business

Symptom: `OrderUpdated`, `FieldChanged`, `StateSaved`.

Why it hurts: event streams stop explaining what happened.

Prefer: `OrderPaid`, `ShippingAddressChanged`, `InventoryReservationRejected`.

## 9. Catch-And-Log Success

Symptom: a handler catches an exception, logs it, and replies success.

Why it hurts: callers, workflows, and operators lose the actual business state.

Prefer: explicit failed state, retry, compensation, or public error response.

## 10. Tests That Only Prove Wiring

Symptom: tests assert that components are non-null or endpoints return any 200.

Why it hurts: confidence is low while test runtime grows.

Prefer: tests that prove one rule, one transition, or one contract.
