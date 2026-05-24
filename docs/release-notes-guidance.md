# Akka Release Notes Guidance

This page keeps the clean-code guidance aligned with the official
[Akka release notes](https://doc.akka.io/reference/release-notes.html). It is a
review aid, not a replacement for the official documentation or migration guide.

Last checked against the release notes current-version block showing:

- Akka SDK 3.5.19
- Akka CLI 3.0.62
- Akka Runtime 1.5.48-1.5.52 in the May 2026 notes

## What Changed Recently

The releases from late 2025 through May 2026 make Akka SDK services more
agentic, more observable, and easier to operate locally. Clean Akka code should
account for these capabilities during design and review.

### Agents Are First-Class Components

Recent Akka SDK releases added and expanded the Agent component, including:

- Session memory and memory interceptors.
- Function tools and component-as-agent-tool integration.
- MCP server and client support.
- Prompt templates.
- Image input, PDF document input, and pluggable image loading.
- Thinking/reasoning support for capable models.
- Guardrails, evaluator agents, token usage tracking, and interaction logging.
- Custom model request headers and additional model providers such as Google
  Vertex AI, Azure OpenAI, MistralAI, Anthropic/Bedrock prompt caching, and GPT-5
  support.

Clean-code implications:

- Keep deterministic business invariants outside the model response.
- Treat prompts, tool schemas, session memory, guardrails, and evaluators as
  reviewable contracts.
- Prefer narrow agent roles with explicit tool boundaries over broad "business
  rules agents".
- Log, trace, and evaluate agent behavior without leaking sensitive data.
- Use `@AgentRole` for the agent role annotation in current code; do not add new
  `@AgentDescriptor` examples.

### Components Use Current Annotation Vocabulary

Current SDK guidance uses `@Component(id = "...")`. Older examples using
`@ComponentId` should be treated as stale unless they are intentionally showing a
migration.

Clean-code implications:

- Component ids remain long-lived contracts even when annotations change.
- New examples should use `@Component` and business-named ids.
- Migration notes should call out persisted state and event compatibility, not
  only mechanical annotation edits.

### Workflows Have A Typesafe Fluent API

Akka SDK 3.5.0 introduced a new typesafe Workflow API and deprecated the
previous Step API. Later releases added workflow notifications, global timeout
configuration, pause timeout configuration, passivation settings, termination,
suspend, and resume.

Clean-code implications:

- Prefer the current fluent Workflow API for new examples.
- Name steps after business transitions, not implementation order.
- Use workflow notifications when operators or clients need progress without
  scraping logs.
- Design timeout, pause, termination, suspend, resume, and compensation behavior
  as part of the workflow model.
- Tests should cover failure paths, timeout behavior, and resume/termination
  semantics for workflows that use them.

### Views And Consumers Got Better Startup And Delivery Tools

Recent releases added snapshot starts for views and consumers, automatic
view-update deduplication for entity/service-to-service eventing sources,
resumable SSE for streaming view-query updates, direct protobuf consumption,
message filtering by origin region, richer view query support, and query commands
in the CLI.

Clean-code implications:

- Document whether a view or consumer starts from history, a snapshot, or a
  timestamp during migration.
- Treat view table/query changes as migrations and state rebuild decisions.
- Keep consumers idempotent even when the runtime provides deduplication for some
  sources; topics and external side effects still need explicit safeguards.
- Use resumable SSE or notifications for streaming read models when that is the
  actual client contract.

### Entities Gained Lifecycle And Eventing Features

Recent notes include automatic expiry/TTL-based deletion for entities, Key Value
Entity notifications, Event Sourced Entity notifications, Key Value Entity
replication, request-region primary selection, and service-to-service eventing
for Key Value Entities.

Clean-code implications:

- Make entity expiry part of the domain lifecycle, not a hidden cleanup detail.
- Use notifications and service-to-service eventing to publish business facts,
  not implementation chatter.
- For multi-region services, review primary-selection behavior and region-origin
  filters alongside consistency requirements.
- Add `ReadOnlyEffect` or equivalent read-only patterns where current Akka docs
  recommend them for replicated entities.

### Runtime And Operations Are More Observable

Recent releases added deep local-console observability, component interaction
inspection, agent interaction logs, OpenTelemetry metrics migration and
performance improvements, custom OpenTelemetry metrics, service instance shutdown
hooks, JWKS/JWT configuration improvements, external secrets, project/service
descriptors, and spec-driven development commands.

Clean-code implications:

- A clean service should be debuggable with the Akka CLI/local console without
  reading every log line.
- Important state changes should be visible through state queries, view queries,
  workflow notifications, traces, metrics, or explicit endpoint contracts.
- Service descriptors and project descriptors are operational contracts; review
  them with the same care as routes and component ids.
- Keep local-development instructions current with `akka local console`,
  `akka local cluster`, `akka code check`, and `akka specify` where relevant.

### Testing Support Improved

Recent releases mention consumer TestKit improvements and mocking of HTTP and
gRPC services in TestKit.

Clean-code implications:

- Prefer targeted component tests over broad end-to-end tests when TestKit can
  isolate the Akka behavior under review.
- Mock HTTP/gRPC dependencies at the boundary when testing workflows, consumers,
  and components that call external services.
- Keep fast domain unit tests as the base of the pyramid; do not move business
  invariants into component tests just because component TestKit improved.

## Release-Aware Review Checklist

Use this quick pass when updating or reviewing Akka SDK code:

- [ ] New examples use `@Component`, not `@ComponentId`.
- [ ] Agent examples use `@AgentRole`, not stale `@AgentDescriptor` patterns.
- [ ] New workflows use the current typesafe/fluent API rather than the
      deprecated Step API.
- [ ] Workflow progress is inspectable through state, notifications, or views.
- [ ] Entity expiry, TTL deletion, notifications, and eventing are explicit
      domain decisions where used.
- [ ] Views and consumers document snapshot/timestamp/history start behavior.
- [ ] Consumers remain idempotent even when runtime deduplication applies to a
      subset of sources.
- [ ] Agent prompts, tools, memory, guardrails, and evaluators are covered by
      tests or evaluation cases.
- [ ] Local run docs reflect current CLI workflows (`akka local console`,
      `akka local cluster`, `akka code check`, `akka specify`).
- [ ] Observability uses current OpenTelemetry/console capabilities without
      exposing secrets or sensitive model context.

## How To Keep This Page Fresh

When Akka publishes new release notes:

1. Check the current-version block at the top of the official release-notes page.
2. Scan the newest monthly section for SDK, CLI, Runtime, and library changes.
3. Update this page only for changes that affect design judgment, review
   criteria, testing strategy, or operational guidance.
4. If an API is renamed or deprecated, update examples across the repository in
   the same change.
