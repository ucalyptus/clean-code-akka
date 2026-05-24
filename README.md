# clean-code-akka

Clean Code principles adapted for Akka SDK services.

This repository mirrors the structure and intent of
[leonardolemie/clean-code-java](https://github.com/leonardolemie/clean-code-java),
but the examples and guidance are written for Akka SDK projects: HTTP endpoints,
agents, workflows, entities, views, consumers, timers, and domain models.

## Start Here

This repo has two layers:

- `README.md` is the mirrored Clean Code guide adapted section-by-section for
  Akka SDK.
- `docs/` turns those principles into Akka-specific architecture, testing,
  review, and refactoring guidance.

If you are building or reviewing an Akka SDK service, read these first:

1. [Clean Akka Principles](docs/clean-akka-principles.md)
2. [Architecture Boundaries](docs/architecture-boundaries.md)
3. [Component Playbook](docs/component-playbook.md)
4. [Testing Strategy](docs/testing-strategy.md)
5. [Review Checklist](docs/review-checklist.md)
6. [Akka Clean Code Anti-Patterns](docs/anti-patterns.md)

## Clean Akka Code Constitution

1. Domain rules are plain Java and are testable without Akka.
2. Endpoints translate transport; they do not own business decisions.
3. Entities own durable facts; workflows own durable processes.
4. Views serve query access patterns and tolerate eventual consistency.
5. Consumers are idempotent and explicit about delivery assumptions.
6. Agents are used for non-deterministic reasoning, not deterministic state.
7. Runtime details stay at the edge; business language stays in the center.
8. Every public route, command, event, and view query has a reason to exist.
9. Component ids, event type names, and persisted state shapes are treated as
   long-lived contracts.
10. Tests prove domain rules first, component behavior second, and end-to-end
    wiring only where it buys confidence.

## Table of Contents

1. [Introduction](#introduction)
2. [Variables](#variables)
3. [Functions](#functions)
4. [Objects and Data Structures](#objects-and-data-structures)
5. [Components and Classes](#components-and-classes)
6. [SOLID](#solid)
7. [Testing](#testing)
8. [Concurrency and Distribution](#concurrency-and-distribution)
9. [Error Handling](#error-handling)
10. [Formatting](#formatting)
11. [Comments](#comments)
12. [Akka SDK Project Hygiene](#akka-sdk-project-hygiene)
13. [Translation](#translation)

## Introduction

Software engineering principles from Robert C. Martin's
[*Clean Code*](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882),
adapted for Akka SDK services.

This is not a style guide. It is a guide to producing readable, reusable, and
refactorable Akka SDK code. Akka services add a few pressures that ordinary Java
examples do not show: component boundaries, durable state, event streams,
message delivery, endpoint access rules, and distributed execution. Clean Akka
code makes those boundaries explicit.

Akka's documentation recommends separating external APIs, Akka component logic,
and domain logic into distinct areas, commonly `api`, `application`, and
`domain`. That separation is the backbone of this guide:

```text
src/
  main/
    java/com/example/service/
      api/           # HTTP, gRPC, MCP, and public DTOs
      application/   # Akka components: entities, workflows, agents, views
      domain/        # Pure business rules and immutable models
    resources/
  test/
```

Not every principle here must be followed blindly. These are practical
guidelines. Prefer code that explains the domain, makes runtime behavior obvious,
and keeps business decisions out of infrastructure glue.

Akka SDK references used while adapting this guide:

- [Akka SDK documentation](https://doc.akka.io/sdk/index.html)
- [Akka architecture and project structure](https://doc.akka.io/concepts/architecture-model.html)
- [Running an Akka service locally](https://doc.akka.io/sdk/running-locally.html)
- [Designing HTTP endpoints](https://doc.akka.io/sdk/http-endpoints.html)
- [Implementing key value entities](https://doc.akka.io/sdk/key-value-entities.html)
- [Implementing workflows](https://doc.akka.io/sdk/workflows.html)
- [Implementing views](https://doc.akka.io/sdk/views.html)
- [Agents](https://doc.akka.io/sdk/agents.html)

Book-shaped principles used to deepen the adaptation:

- Clean Code: meaningful names, small functions, clean tests, boundaries,
  error handling, and concurrency discipline.
- Clean Architecture: dependency direction, use-case boundaries, testable
  architecture, components, and stable contracts.
- Clean Agile: small releases, acceptance tests, refactoring, simple design,
  collective ownership, and continuous integration.
- A Philosophy of Software Design: complexity reduction, deep modules,
  information hiding, different layers with different abstractions, and error
  cases designed out where practical.

**[back to top](#table-of-contents)**

## Variables

### Use meaningful and pronounceable names

Akka code often reads like a conversation between endpoint, component, and
domain model. Name values after the business concept, not after their storage or
transport shape.

**Bad:**

```java
String cid = "cart-123";
int q = 2;
```

**Good:**

```java
String cartId = "cart-123";
int quantity = 2;
```

**[back to top](#table-of-contents)**

### Use the same vocabulary for the same concept

Do not call the same thing a user, customer, account holder, and principal
unless those are different domain concepts.

**Bad:**

```java
loadUserProfile(userId);
findCustomerPreferences(customerId);
fetchAccountHolderOrders(accountHolderId);
```

**Good:**

```java
loadCustomerProfile(customerId);
findCustomerPreferences(customerId);
fetchCustomerOrders(customerId);
```

**[back to top](#table-of-contents)**

### Use searchable names

Distributed systems are debugged through code, logs, traces, and events. Names
must be easy to search across all of them.

**Bad:**

```java
private static final int RETRIES = 3;
private static final Duration D = Duration.ofSeconds(30);
```

**Good:**

```java
private static final int PAYMENT_CAPTURE_MAX_ATTEMPTS = 3;
private static final Duration PAYMENT_CAPTURE_RETRY_DELAY = Duration.ofSeconds(30);
```

**[back to top](#table-of-contents)**

### Use explanatory variables

Use local variables to expose intent before calling an Akka component, publishing
an event, or returning an HTTP response.

**Bad:**

```java
return componentClient
    .forKeyValueEntity(orderId)
    .method(OrderEntity::reserve)
    .invoke(new ReserveRequest(request.lines(), request.address()));
```

**Good:**

```java
var shippingAddress = request.address();
var orderLines = request.lines();
var reserveRequest = new ReserveRequest(orderLines, shippingAddress);

return componentClient
    .forKeyValueEntity(orderId)
    .method(OrderEntity::reserve)
    .invoke(reserveRequest);
```

**[back to top](#table-of-contents)**

### Avoid mental mapping

Component handlers are read under pressure when production behavior is wrong.
Avoid compressed names that require translation.

**Bad:**

```java
for (var e : evts) {
  if (e.t().equals("paid")) {
    pub(e);
  }
}
```

**Good:**

```java
for (var orderEvent : orderEvents) {
  if (orderEvent.type().equals("paid")) {
    publish(orderEvent);
  }
}
```

**[back to top](#table-of-contents)**

### Do not add unneeded context

If the type already gives context, do not repeat it in every field.

**Bad:**

```java
public record ShoppingCart(
    String shoppingCartId,
    List<CartItem> shoppingCartItems,
    Money shoppingCartTotal) {}
```

**Good:**

```java
public record ShoppingCart(
    String id,
    List<CartItem> items,
    Money total) {}
```

**[back to top](#table-of-contents)**

## Functions

### Function arguments: two or fewer ideally

Akka command handlers and endpoint methods often receive request bodies. Prefer
a command record over a long parameter list.

**Bad:**

```java
public Effect<Done> addItem(
    String productId,
    String productName,
    int quantity,
    BigDecimal price,
    String currency) {
  // ...
}
```

**Good:**

```java
public record AddItemCommand(
    String productId,
    String productName,
    int quantity,
    Money price) {}

public Effect<Done> addItem(AddItemCommand command) {
  // ...
}
```

**[back to top](#table-of-contents)**

### Functions should do one thing

Endpoint methods should translate transport requests and delegate. Entity
methods should validate and update state. Domain methods should express
business rules.

**Bad:**

```java
@Post("/orders/{orderId}/pay")
public Done pay(String orderId, PaymentRequest request) {
  if (request.cardNumber().isBlank()) {
    throw HttpException.badRequest("Card number is required");
  }

  var payment = paymentGateway.capture(request.cardNumber(), request.amount());

  componentClient
      .forEventSourcedEntity(orderId)
      .method(OrderEntity::markPaid)
      .invoke(new MarkPaid(payment.reference()));

  emailSender.sendReceipt(orderId, request.email());
  return Done.done();
}
```

**Good:**

```java
@Post("/orders/{orderId}/pay")
public Done pay(String orderId, PaymentRequest request) {
  var command = request.toCommand();

  componentClient
      .forWorkflow(orderId)
      .method(PaymentWorkflow::capturePayment)
      .invoke(command);

  return Done.done();
}
```

**[back to top](#table-of-contents)**

### Function names should say what they do

Akka component methods are part of a service contract. Name them after the
business action.

**Bad:**

```java
public Effect<Done> update(UpdateOrder command) {
  // reserves inventory
}
```

**Good:**

```java
public Effect<Done> reserveInventory(ReserveInventory command) {
  // reserves inventory
}
```

**[back to top](#table-of-contents)**

### Functions should only be one level of abstraction

Do not mix HTTP parsing, component calls, domain calculations, and response
formatting in one method.

**Bad:**

```java
@Get("/orders/{orderId}/summary")
public OrderSummaryResponse summary(String orderId) {
  var order = componentClient
      .forKeyValueEntity(orderId)
      .method(OrderEntity::get)
      .invoke();

  var subtotal = order.items().stream()
      .map(item -> item.price().multiply(item.quantity()))
      .reduce(Money.ZERO, Money::add);

  var tax = subtotal.multiply(new BigDecimal("0.13"));
  return new OrderSummaryResponse(orderId, subtotal, tax, subtotal.add(tax));
}
```

**Good:**

```java
@Get("/orders/{orderId}/summary")
public OrderSummaryResponse summary(String orderId) {
  var order = loadOrder(orderId);
  return OrderSummaryResponse.from(OrderSummary.from(order));
}

private Order loadOrder(String orderId) {
  return componentClient
      .forKeyValueEntity(orderId)
      .method(OrderEntity::get)
      .invoke();
}
```

**[back to top](#table-of-contents)**

### Remove duplicate code

Repeated component-client calls, ACL rules, DTO conversion, and validation logic
should be centralized when they represent one stable concept.

**Bad:**

```java
var cart = componentClient
    .forKeyValueEntity(cartId)
    .method(ShoppingCartEntity::getCart)
    .invoke();

var updated = componentClient
    .forKeyValueEntity(cartId)
    .method(ShoppingCartEntity::addItem)
    .invoke(command);
```

**Good:**

```java
private ShoppingCartEntityClient cart(String cartId) {
  return new ShoppingCartEntityClient(componentClient, cartId);
}

var cart = cart(cartId).get();
var updated = cart(cartId).addItem(command);
```

**[back to top](#table-of-contents)**

### Use default objects deliberately

Akka entities should define an explicit empty state. Avoid spreading default
state across command handlers.

**Bad:**

```java
public Effect<Done> addItem(AddItemCommand command) {
  var cart = currentState() == null
      ? new ShoppingCart(List.of())
      : currentState();

  return effects().updateState(cart.add(command)).thenReply(Done::done);
}
```

**Good:**

```java
@Override
public ShoppingCart emptyState() {
  return ShoppingCart.empty();
}

public Effect<Done> addItem(AddItemCommand command) {
  return effects()
      .updateState(currentState().add(command))
      .thenReply(Done::done);
}
```

**[back to top](#table-of-contents)**

### Do not use flags as function parameters

Boolean flags usually mean one handler has multiple reasons to change.

**Bad:**

```java
public Effect<Done> ship(boolean express) {
  if (express) {
    return shipExpress();
  }

  return shipStandard();
}
```

**Good:**

```java
public Effect<Done> shipExpress() {
  return shipWith(ShippingSpeed.EXPRESS);
}

public Effect<Done> shipStandard() {
  return shipWith(ShippingSpeed.STANDARD);
}
```

**[back to top](#table-of-contents)**

### Avoid side effects in domain logic

Domain objects should compute decisions. Akka components should coordinate
runtime effects.

**Bad:**

```java
public record Order(List<OrderLine> lines) {
  public void reserve(InventoryClient inventoryClient) {
    lines.forEach(line -> inventoryClient.reserve(line.productId(), line.quantity()));
  }
}
```

**Good:**

```java
public record Order(List<OrderLine> lines) {
  public List<InventoryReservation> reservations() {
    return lines.stream()
        .map(line -> new InventoryReservation(line.productId(), line.quantity()))
        .toList();
  }
}
```

**[back to top](#table-of-contents)**

### Keep state immutable

Akka persists and replicates state. Immutable records make changes explicit and
serialization predictable.

**Bad:**

```java
public class ShoppingCart {
  public List<CartItem> items = new ArrayList<>();

  public void add(CartItem item) {
    items.add(item);
  }
}
```

**Good:**

```java
public record ShoppingCart(List<CartItem> items) {
  public ShoppingCart add(CartItem item) {
    var updatedItems = new ArrayList<>(items);
    updatedItems.add(item);
    return new ShoppingCart(List.copyOf(updatedItems));
  }
}
```

**[back to top](#table-of-contents)**

### Do not write to global state

An Akka service may have many instances. Static mutable state is local to one JVM
and will not behave like durable service state.

**Bad:**

```java
public final class SessionRegistry {
  private static final Map<String, Session> SESSIONS = new ConcurrentHashMap<>();
}
```

**Good:**

```java
@Component(id = "session")
public class SessionEntity extends KeyValueEntity<Session> {
  @Override
  public Session emptyState() {
    return Session.empty();
  }
}
```

**[back to top](#table-of-contents)**

### Favor declarative transformations over imperative plumbing

Make streams, collections, and state transitions read as a business pipeline.

**Bad:**

```java
List<OrderLine> lines = new ArrayList<>();
for (CartItem item : cart.items()) {
  if (item.quantity() > 0) {
    lines.add(new OrderLine(item.productId(), item.quantity()));
  }
}
```

**Good:**

```java
var lines = cart.items().stream()
    .filter(CartItem::hasQuantity)
    .map(OrderLine::from)
    .toList();
```

**[back to top](#table-of-contents)**

### Encapsulate conditionals

Business predicates should live near the business data.

**Bad:**

```java
if (order.status() == PAID && !order.lines().isEmpty() && order.shippingAddress() != null) {
  ship(order);
}
```

**Good:**

```java
if (order.isReadyToShip()) {
  ship(order);
}
```

**[back to top](#table-of-contents)**

### Avoid negative conditionals

Positive predicates are easier to read in workflow and entity handlers.

**Bad:**

```java
if (!order.isNotReadyToShip()) {
  ship(order);
}
```

**Good:**

```java
if (order.isReadyToShip()) {
  ship(order);
}
```

**[back to top](#table-of-contents)**

### Avoid conditionals when polymorphism or strategy fits

If behavior changes by channel, gateway, tenant, or payment method, push the
variation behind an interface.

**Bad:**

```java
if (paymentMethod.type() == CARD) {
  cardGateway.capture(paymentMethod, amount);
} else if (paymentMethod.type() == BANK_TRANSFER) {
  bankGateway.capture(paymentMethod, amount);
}
```

**Good:**

```java
paymentCaptureGateway
    .forMethod(paymentMethod)
    .capture(paymentMethod, amount);
```

**[back to top](#table-of-contents)**

### Do not over-optimize

Akka SDK code should first be clear about consistency, durability, and ownership.
Measure before optimizing component calls or stream flow.

**Bad:**

```java
// Avoids one object allocation, but hides the domain meaning.
return effects().reply(new Object[] { currentState().id(), currentState().items() });
```

**Good:**

```java
return effects().reply(CartResponse.from(currentState()));
```

**[back to top](#table-of-contents)**

### Remove dead code

Dead endpoints, commands, events, and view queries are dangerous because clients
and operators can assume they are supported.

**Bad:**

```java
// TODO: old checkout path, no longer called
public Effect<Done> checkoutV1() {
  return effects().reply(Done.done());
}
```

**Good:**

```java
public Effect<Done> checkout(CheckoutCommand command) {
  return effects().persist(new CheckoutRequested(command.orderId())).thenReply(Done::done);
}
```

**[back to top](#table-of-contents)**

## Objects and Data Structures

### Use records for immutable domain data

Akka SDK examples use regular Java records for data and events. Records reduce
boilerplate and make serialized state explicit.

**Bad:**

```java
public class Counter {
  private int value;

  public int getValue() {
    return value;
  }

  public void setValue(int value) {
    this.value = value;
  }
}
```

**Good:**

```java
public record Counter(int value) {
  public Counter increment(int delta) {
    return new Counter(value + delta);
  }
}
```

**[back to top](#table-of-contents)**

### Keep internal state private to the component

Expose public DTOs from endpoints and views. Do not bind clients directly to
internal entity state or event shapes.

**Bad:**

```java
@Get("/{cartId}")
public ShoppingCart getCart(String cartId) {
  return componentClient
      .forKeyValueEntity(cartId)
      .method(ShoppingCartEntity::getCart)
      .invoke();
}
```

**Good:**

```java
@Get("/{cartId}")
public CartResponse getCart(String cartId) {
  var cart = componentClient
      .forKeyValueEntity(cartId)
      .method(ShoppingCartEntity::getCart)
      .invoke();

  return CartResponse.from(cart);
}
```

**[back to top](#table-of-contents)**

### Prefer composition over inheritance

Most Akka domain behavior belongs in composed services, policies, and value
objects, not deep class trees.

**Bad:**

```java
class ExpressOrder extends Order {
  @Override
  Money shippingCost() {
    return Money.usd("25.00");
  }
}
```

**Good:**

```java
public record Order(
    List<OrderLine> lines,
    ShippingPolicy shippingPolicy) {

  public Money shippingCost() {
    return shippingPolicy.costFor(lines);
  }
}
```

**[back to top](#table-of-contents)**

## Components and Classes

### Keep components cohesive

An Akka component should own one durable concept: one aggregate, one workflow,
one endpoint surface, one view, one consumer responsibility, or one agent role.

**Bad:**

```java
@Component(id = "commerce")
public class CommerceEntity extends KeyValueEntity<CommerceState> {
  public Effect<Done> addCartItem(AddItem command) { /* ... */ }
  public Effect<Done> capturePayment(CapturePayment command) { /* ... */ }
  public Effect<Done> shipOrder(ShipOrder command) { /* ... */ }
  public Effect<Done> updateCustomerEmail(UpdateEmail command) { /* ... */ }
}
```

**Good:**

```java
@Component(id = "cart")
public class ShoppingCartEntity extends KeyValueEntity<ShoppingCart> {
  public Effect<Done> addItem(AddItem command) { /* ... */ }
}

@Component(id = "checkout")
public class CheckoutWorkflow extends Workflow<CheckoutState> {
  public Effect<Done> startCheckout(StartCheckout command) { /* ... */ }
}
```

**[back to top](#table-of-contents)**

### Keep domain classes free of Akka runtime concerns

Domain objects should not know about `ComponentClient`, `Effect`, endpoint
annotations, or message brokers.

**Bad:**

```java
public record Invoice(String id, Money total) {
  public KeyValueEntity.Effect<Done> markPaid() {
    return effects().reply(Done.done());
  }
}
```

**Good:**

```java
public record Invoice(String id, Money total, InvoiceStatus status) {
  public Invoice markPaid() {
    return new Invoice(id, total, InvoiceStatus.PAID);
  }
}
```

**[back to top](#table-of-contents)**

### Name components by responsibility

The component id appears in runtime state, logs, command routing, and diagnostics.
Choose names that will still be clear in operations.

**Bad:**

```java
@Component(id = "processor")
public class ProcessorEntity extends KeyValueEntity<State> {}
```

**Good:**

```java
@Component(id = "shopping-cart")
public class ShoppingCartEntity extends KeyValueEntity<ShoppingCart> {}
```

**[back to top](#table-of-contents)**

## SOLID

### Single Responsibility Principle

Each endpoint, entity, workflow, view, consumer, and agent should have one reason
to change.

**Bad:**

```java
@HttpEndpoint("/orders")
public class OrderEndpoint {
  public OrderResponse create(CreateOrderRequest request) { /* creates order */ }
  public PaymentResponse capture(CapturePaymentRequest request) { /* captures payment */ }
  public ShipmentResponse ship(ShipOrderRequest request) { /* ships order */ }
  public CustomerResponse updateCustomer(UpdateCustomerRequest request) { /* updates customer */ }
}
```

**Good:**

```java
@HttpEndpoint("/orders")
public class OrderEndpoint {
  public OrderResponse create(CreateOrderRequest request) { /* creates order */ }
}

@HttpEndpoint("/payments")
public class PaymentEndpoint {
  public PaymentResponse capture(CapturePaymentRequest request) { /* captures payment */ }
}
```

**[back to top](#table-of-contents)**

### Open/Closed Principle

Prefer extending behavior through new policies, handlers, or strategies instead
of editing a central conditional every time.

**Bad:**

```java
Money discountFor(Customer customer, Order order) {
  if (customer.segment() == GOLD) return order.total().multiply("0.10");
  if (customer.segment() == SILVER) return order.total().multiply("0.05");
  return Money.ZERO;
}
```

**Good:**

```java
interface DiscountPolicy {
  boolean appliesTo(Customer customer);
  Money discountFor(Order order);
}

Money discountFor(Customer customer, Order order) {
  return discountPolicies.stream()
      .filter(policy -> policy.appliesTo(customer))
      .map(policy -> policy.discountFor(order))
      .reduce(Money.ZERO, Money::add);
}
```

**[back to top](#table-of-contents)**

### Liskov Substitution Principle

If a subtype cannot honor the same contract, do not model it as a subtype. This
matters when endpoint handlers, gateways, or policies are swapped in tests.

**Bad:**

```java
class ReadOnlyPaymentGateway extends PaymentGateway {
  @Override
  PaymentReceipt capture(Payment payment) {
    throw new UnsupportedOperationException("read only");
  }
}
```

**Good:**

```java
interface PaymentReader {
  PaymentStatus status(String paymentId);
}

interface PaymentCapturer {
  PaymentReceipt capture(Payment payment);
}
```

**[back to top](#table-of-contents)**

### Interface Segregation Principle

Do not force components to depend on wide service interfaces when they only need
one operation.

**Bad:**

```java
interface CommerceGateway {
  PaymentReceipt capture(Payment payment);
  Shipment bookShipment(Order order);
  CustomerProfile loadCustomer(String customerId);
  FraudDecision screen(Order order);
}
```

**Good:**

```java
interface PaymentCapturer {
  PaymentReceipt capture(Payment payment);
}

interface FraudScreener {
  FraudDecision screen(Order order);
}
```

**[back to top](#table-of-contents)**

### Dependency Inversion Principle

High-level workflow and domain code should depend on abstractions. Infrastructure
details should be injected into application services or component constructors.

**Bad:**

```java
public class CheckoutWorkflow extends Workflow<CheckoutState> {
  private final StripeClient stripeClient = new StripeClient(System.getenv("STRIPE_KEY"));
}
```

**Good:**

```java
public class CheckoutWorkflow extends Workflow<CheckoutState> {
  private final PaymentCapturer paymentCapturer;

  public CheckoutWorkflow(PaymentCapturer paymentCapturer) {
    this.paymentCapturer = paymentCapturer;
  }
}
```

**[back to top](#table-of-contents)**

## Testing

Testing is more important than shipping. Akka services need both fast unit tests
for domain logic and component-level tests for runtime behavior.

Use unit tests for:

- Pure domain records and policies
- DTO mapping
- Validation
- Error translation

Use Akka SDK test support for:

- Endpoint routes
- Entity command handlers
- Workflow transitions
- View queries
- Consumers and producers
- Agent behavior boundaries

### Single concept per test

**Bad:**

```java
@Test
void checkoutWorks() {
  endpoint.addItem(cartId, addItemRequest);
  endpoint.startCheckout(cartId);
  endpoint.capturePayment(cartId, paymentRequest);
  endpoint.ship(cartId);

  assertThat(endpoint.getOrder(cartId).status()).isEqualTo(SHIPPED);
}
```

**Good:**

```java
@Test
void paidOrderIsReadyToShip() {
  var order = OrderFixture.paidOrder();

  assertThat(order.isReadyToShip()).isTrue();
}

@Test
void checkoutWorkflowStartsPaymentCapture() {
  var result = workflow.startCheckout(new StartCheckout(orderId));

  assertThat(result.nextStep()).isEqualTo("capture-payment");
}
```

**[back to top](#table-of-contents)**

### Test domain rules without the runtime

The fastest tests should not require Akka.

**Bad:**

```java
@Test
void addingCartItemIncrementsQuantity() {
  var cart = componentClient
      .forKeyValueEntity("cart-1")
      .method(ShoppingCartEntity::addItem)
      .invoke(new AddItem("akka-tshirt", 1));

  assertThat(cart.quantityFor("akka-tshirt")).isEqualTo(1);
}
```

**Good:**

```java
@Test
void addingCartItemIncrementsQuantity() {
  var cart = ShoppingCart.empty()
      .add(new CartItem("akka-tshirt", "Akka Tshirt", 1));

  assertThat(cart.quantityFor("akka-tshirt")).isEqualTo(1);
}
```

**[back to top](#table-of-contents)**

### Test component contracts at the boundary

Component tests should prove that Akka effects, state updates, replies, and
endpoint status codes match the public contract.

**Bad:**

```java
@Test
void entityHasMethods() {
  assertThat(new ShoppingCartEntity()).isNotNull();
}
```

**Good:**

```java
@Test
void addItemUpdatesCartState() {
  var cartId = "cart-1";

  testKit
      .getKeyValueEntityTestKit(cartId, ShoppingCartEntity::new)
      .method(ShoppingCartEntity::addItem)
      .invoke(new AddItem("akka-tshirt", "Akka Tshirt", 2));

  var cart = testKit
      .getKeyValueEntityTestKit(cartId, ShoppingCartEntity::new)
      .method(ShoppingCartEntity::getCart)
      .invoke();

  assertThat(cart.items()).hasSize(1);
}
```

**[back to top](#table-of-contents)**

## Concurrency and Distribution

### Let Akka own component concurrency

Stateful Akka components are identified by ID and handled sequentially for that
component instance. Do not add local locks to compensate for unclear ownership.

**Bad:**

```java
private final Object lock = new Object();

public Effect<Done> addItem(AddItem command) {
  synchronized (lock) {
    return effects()
        .updateState(currentState().add(command))
        .thenReply(Done::done);
  }
}
```

**Good:**

```java
public Effect<Done> addItem(AddItem command) {
  return effects()
      .updateState(currentState().add(command))
      .thenReply(Done::done);
}
```

**[back to top](#table-of-contents)**

### Model long-running work as workflows

If a process spans multiple services, retries, delays, or compensating actions,
do not hide it in one endpoint request.

**Bad:**

```java
@Post("/checkout/{cartId}")
public Done checkout(String cartId) {
  reserveInventory(cartId);
  capturePayment(cartId);
  bookShipment(cartId);
  sendReceipt(cartId);
  return Done.done();
}
```

**Good:**

```java
@Post("/checkout/{cartId}")
public Done checkout(String cartId) {
  componentClient
      .forWorkflow(cartId)
      .method(CheckoutWorkflow::start)
      .invoke(new StartCheckout(cartId));

  return Done.done();
}
```

**[back to top](#table-of-contents)**

### Design message consumers to be idempotent

Consumers may receive redeliveries. Handlers should tolerate duplicate messages.

**Bad:**

```java
public Effect<Done> onPaymentCaptured(PaymentCaptured event) {
  emailSender.sendReceipt(event.orderId());
  return effects().reply(Done.done());
}
```

**Good:**

```java
public Effect<Done> onPaymentCaptured(PaymentCaptured event) {
  if (currentState().receiptAlreadySent(event.paymentId())) {
    return effects().reply(Done.done());
  }

  return effects()
      .updateState(currentState().recordReceiptSent(event.paymentId()))
      .thenReply(() -> {
        emailSender.sendReceipt(event.orderId());
        return Done.done();
      });
}
```

**[back to top](#table-of-contents)**

## Error Handling

### Do not ignore failures

If an endpoint, workflow, consumer, or agent call can fail, model the expected
failure and log or return it at the right boundary.

**Bad:**

```java
try {
  paymentCapturer.capture(payment);
} catch (Exception ignored) {
}
```

**Good:**

```java
try {
  paymentCapturer.capture(payment);
} catch (PaymentDeclinedException exception) {
  logger.info("Payment declined for order {}", orderId, exception);
  throw HttpException.badRequest("Payment was declined");
}
```

**[back to top](#table-of-contents)**

### Translate errors at service boundaries

Domain errors should not leak as generic 500 responses.

**Bad:**

```java
@Post("/orders/{orderId}/ship")
public Done ship(String orderId) {
  return componentClient
      .forKeyValueEntity(orderId)
      .method(OrderEntity::ship)
      .invoke();
}
```

**Good:**

```java
@Post("/orders/{orderId}/ship")
public Done ship(String orderId) {
  try {
    return componentClient
        .forKeyValueEntity(orderId)
        .method(OrderEntity::ship)
        .invoke();
  } catch (OrderNotReadyToShip exception) {
    throw HttpException.badRequest(exception.getMessage());
  }
}
```

**[back to top](#table-of-contents)**

### Prefer explicit failed states for durable processes

Workflows should record recoverable business failures instead of disappearing
into logs.

**Bad:**

```java
catch (Exception exception) {
  logger.error("Checkout failed", exception);
  return effects().reply(Done.done());
}
```

**Good:**

```java
catch (PaymentDeclinedException exception) {
  return effects()
      .updateState(currentState().paymentDeclined(exception.reason()))
      .thenReply(Done::done);
}
```

**[back to top](#table-of-contents)**

## Formatting

Formatting is subjective. Use your team's formatter and avoid arguing over
formatting by hand. For Akka SDK projects, formatting should make boundaries and
effect chains obvious.

### Use consistent capitalization

Use Java naming conventions consistently:

- Records and classes: `ShoppingCart`, `CheckoutWorkflow`
- Methods and fields: `addItem`, `componentClient`
- Constants: `PAYMENT_CAPTURE_RETRY_DELAY`
- Component IDs: stable lower-kebab-case strings like `shopping-cart`

**Bad:**

```java
@Component(id = "ShoppingCart")
public class shopping_cart extends KeyValueEntity<shoppingcart> {}
```

**Good:**

```java
@Component(id = "shopping-cart")
public class ShoppingCartEntity extends KeyValueEntity<ShoppingCart> {}
```

**[back to top](#table-of-contents)**

### Keep callers and callees close

Akka classes often contain public handlers plus private mapping and validation
helpers. Keep the private helper near the handler that uses it.

**Bad:**

```java
public Effect<Done> addItem(AddItem command) {
  validate(command);
  return updateCart(command);
}

private Effect<Done> updateCart(AddItem command) { /* ... */ }

// 200 lines later
private void validate(AddItem command) { /* ... */ }
```

**Good:**

```java
public Effect<Done> addItem(AddItem command) {
  validate(command);
  return updateCart(command);
}

private void validate(AddItem command) { /* ... */ }

private Effect<Done> updateCart(AddItem command) { /* ... */ }
```

**[back to top](#table-of-contents)**

### Format effect chains vertically

Effect chains are easier to review when each operation is visible.

**Bad:**

```java
return effects().updateState(currentState().add(command)).thenReply(Done::done);
```

**Good:**

```java
return effects()
    .updateState(currentState().add(command))
    .thenReply(Done::done);
```

**[back to top](#table-of-contents)**

## Comments

### Only comment business complexity

Comments should explain why a business rule exists, not what the Java syntax is
doing.

**Bad:**

```java
// Gets the current state.
var cart = currentState();

// Adds the item to the cart.
var updatedCart = cart.add(command);
```

**Good:**

```java
// Marketplace rules require inventory reservation before payment capture.
var updatedCart = currentState().reserve(command.productId(), command.quantity());
```

**[back to top](#table-of-contents)**

### Do not use a comment when a function or variable can say it

**Bad:**

```java
// Check whether this order can be shipped.
if (order.status() == PAID && order.address() != null && !order.lines().isEmpty()) {
  ship(order);
}
```

**Good:**

```java
if (order.isReadyToShip()) {
  ship(order);
}
```

**[back to top](#table-of-contents)**

### Do not leave commented-out code

Version control keeps history. Commented-out handlers and routes confuse readers
about what the service supports.

**Bad:**

```java
@Post("/checkout/{cartId}")
public Done checkout(String cartId) {
  startCheckout(cartId);
  // capturePayment(cartId);
  // ship(cartId);
  return Done.done();
}
```

**Good:**

```java
@Post("/checkout/{cartId}")
public Done checkout(String cartId) {
  startCheckout(cartId);
  return Done.done();
}
```

**[back to top](#table-of-contents)**

### Do not have journal comments

Use git history and decision records instead.

**Bad:**

```java
/**
 * 2026-01-05: switched from entity to workflow
 * 2025-12-11: added retry
 */
public Effect<Done> start(StartCheckout command) {
  return effects().reply(Done.done());
}
```

**Good:**

```java
public Effect<Done> start(StartCheckout command) {
  return effects().reply(Done.done());
}
```

**[back to top](#table-of-contents)**

### Avoid positional markers

Sections made from separator comments usually add noise. Let packages, classes,
method names, and formatting provide structure.

**Bad:**

```java
///////////////////////////////////////////////////////////////////////////////
// Commands
///////////////////////////////////////////////////////////////////////////////
public Effect<Done> addItem(AddItem command) { /* ... */ }

///////////////////////////////////////////////////////////////////////////////
// Queries
///////////////////////////////////////////////////////////////////////////////
public ReadOnlyEffect<ShoppingCart> getCart() { /* ... */ }
```

**Good:**

```java
public Effect<Done> addItem(AddItem command) { /* ... */ }

public ReadOnlyEffect<ShoppingCart> getCart() { /* ... */ }
```

**[back to top](#table-of-contents)**

## Akka SDK Project Hygiene

### Keep API, application, and domain layers separate

Akka's recommended project structure separates external APIs, Akka components,
and business logic. Follow that unless the project has a deliberate reason not
to.

**Bad:**

```java
package com.example.order.api;

@HttpEndpoint("/orders")
public class OrderEndpoint {
  public record Order(String id, List<OrderLine> lines) {
    Money total() { /* business logic */ }
  }

  @Component(id = "order")
  public static class OrderEntity extends KeyValueEntity<Order> {}
}
```

**Good:**

```java
package com.example.order.api;

@HttpEndpoint("/orders")
public class OrderEndpoint {
  // transport boundary only
}
```

```java
package com.example.order.application;

@Component(id = "order")
public class OrderEntity extends KeyValueEntity<Order> {
  // Akka component boundary
}
```

```java
package com.example.order.domain;

public record Order(String id, List<OrderLine> lines) {
  public Money total() { /* business logic */ }
}
```

**[back to top](#table-of-contents)**

### Use endpoints as boundaries, not business services

HTTP endpoints should validate transport input, call components, and translate
responses.

**Bad:**

```java
@HttpEndpoint("/carts")
public class ShoppingCartEndpoint {
  private final Map<String, ShoppingCart> carts = new ConcurrentHashMap<>();
}
```

**Good:**

```java
@HttpEndpoint("/carts")
public class ShoppingCartEndpoint {
  private final ComponentClient componentClient;

  public ShoppingCartEndpoint(ComponentClient componentClient) {
    this.componentClient = componentClient;
  }
}
```

**[back to top](#table-of-contents)**

### Make access control explicit

Without an ACL annotation, HTTP endpoints are not publicly accessible. Treat ACLs
as part of the service contract.

**Bad:**

```java
@HttpEndpoint("/admin")
public class AdminEndpoint {
  @Post("/rebuild")
  public Done rebuild() { /* ... */ }
}
```

**Good:**

```java
@Acl(allow = @Acl.Matcher(principal = Acl.Principal.INTERNET))
@HttpEndpoint("/public")
public class PublicCatalogEndpoint {
  @Get("/items")
  public List<CatalogItemResponse> items() { /* ... */ }
}
```

**[back to top](#table-of-contents)**

### Keep local run commands boring

Document the standard local workflow in the README so new contributors can run
the service the same way.

```bash
mvn compile exec:java
curl localhost:9000/health
akka local console
```

Akka SDK local development expects Java 21 and Maven 3.9 or later.

**[back to top](#table-of-contents)**

## Translation

Open for translations.

**[back to top](#table-of-contents)**
