# Review Checklist

Use this checklist when reviewing an Akka SDK pull request.

## Architecture

- [ ] Does the package structure reveal the business capability?
- [ ] Do dependencies point inward: `api -> application -> domain`?
- [ ] Can domain logic be tested without Akka?
- [ ] Are framework details isolated to API/application layers?
- [ ] Is there a clear owner for every durable state change?

## Naming

- [ ] Are component ids stable, unique, and business-named?
- [ ] Are event type names stable and business-specific?
- [ ] Do command methods use verbs that say what they do?
- [ ] Are public routes named after resources or business actions?
- [ ] Are constants searchable and domain-specific?

## Endpoints

- [ ] Is ACL/auth behavior visible?
- [ ] Are request and response DTOs public contracts?
- [ ] Does each endpoint delegate to one application operation?
- [ ] Are expected failures translated into useful responses?
- [ ] Is durable state kept out of endpoint fields?

## Entities

- [ ] Is `emptyState()` explicit where needed?
- [ ] Are state objects immutable?
- [ ] Are command handlers small and business-named?
- [ ] Are read-only handlers actually read-only?
- [ ] Are external side effects protected from duplicate execution?

## Event Sourcing

- [ ] Are events past-tense business facts?
- [ ] Is command validation done before persisting events?
- [ ] Are event handlers deterministic?
- [ ] Are event payloads sufficient for replay?
- [ ] Has event/schema compatibility been considered?

## Workflows

- [ ] Does the workflow model a real long-running process?
- [ ] Are step names business-readable?
- [ ] Are timeouts, retries, and waiting states explicit?
- [ ] Is compensation modeled where needed?
- [ ] Can operators inspect progress from state or notifications?

## Views

- [ ] Does the view name describe the query access pattern?
- [ ] Is eventual consistency acceptable to callers?
- [ ] Is the row model a deliberate projection?
- [ ] Are table/query changes compatible or documented as migrations?
- [ ] Are deletes handled intentionally?

## Consumers

- [ ] Is the handler idempotent?
- [ ] Is duplicate detection based on a durable identity?
- [ ] Are poison messages observable?
- [ ] Are external side effects safe under retry?

## Agents

- [ ] Is the agent solving a genuinely non-deterministic problem?
- [ ] Are prompts, tools, and session memory boundaries explicit?
- [ ] Is model output validated before affecting durable state?
- [ ] Are evaluation cases or deterministic boundary tests included?

## Tests

- [ ] Do changed domain rules have unit tests?
- [ ] Do changed components have component tests?
- [ ] Do changed public routes have endpoint tests or manual evidence?
- [ ] Do workflow changes test failure paths?
- [ ] Are tests specific enough to diagnose failures quickly?

## Operations

- [ ] Are important state transitions logged or queryable?
- [ ] Are correlation ids preserved where useful?
- [ ] Are component ids, routes, events, views, and topics treated as contracts?
- [ ] Is local run/test documentation still accurate?
