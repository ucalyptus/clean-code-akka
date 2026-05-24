# Example: Shopping Cart Clean Boundaries

This example shows where code belongs. It is intentionally partial; use official
Akka SDK samples for complete runnable syntax.

## Domain

```java
package com.example.cart.domain;

import java.util.ArrayList;
import java.util.List;

public record ShoppingCart(List<CartItem> items) {
  public static ShoppingCart empty() {
    return new ShoppingCart(List.of());
  }

  public ShoppingCart add(CartItem item) {
    if (item.quantity() <= 0) {
      throw new InvalidCartItem("Quantity must be positive");
    }

    var updated = new ArrayList<>(items);
    updated.add(item);
    return new ShoppingCart(List.copyOf(updated));
  }

  public boolean isEmpty() {
    return items.isEmpty();
  }
}
```

The domain model has no Akka imports and can be tested directly.

## Application

```java
package com.example.cart.application;

import akka.Done;
import akka.javasdk.annotations.Component;
import akka.javasdk.keyvalueentity.KeyValueEntity;
import com.example.cart.domain.CartItem;
import com.example.cart.domain.ShoppingCart;

@Component(id = "shopping-cart")
public class ShoppingCartEntity extends KeyValueEntity<ShoppingCart> {
  public record AddItem(String productId, String name, int quantity) {}

  @Override
  public ShoppingCart emptyState() {
    return ShoppingCart.empty();
  }

  public Effect<Done> addItem(AddItem command) {
    var item = new CartItem(command.productId(), command.name(), command.quantity());

    return effects()
        .updateState(currentState().add(item))
        .thenReply(Done::done);
  }

  public ReadOnlyEffect<ShoppingCart> getCart() {
    return effects().reply(currentState());
  }
}
```

The entity owns persistence and effects. It delegates the business rule to the
domain model.

## API

```java
package com.example.cart.api;

import akka.Done;
import akka.javasdk.annotations.Acl;
import akka.javasdk.annotations.http.Get;
import akka.javasdk.annotations.http.HttpEndpoint;
import akka.javasdk.annotations.http.Put;
import akka.javasdk.client.ComponentClient;
import com.example.cart.application.ShoppingCartEntity;

@Acl(allow = @Acl.Matcher(principal = Acl.Principal.INTERNET))
@HttpEndpoint("/carts")
public class ShoppingCartEndpoint {
  private final ComponentClient componentClient;

  public ShoppingCartEndpoint(ComponentClient componentClient) {
    this.componentClient = componentClient;
  }

  @Put("/{cartId}/items")
  public Done addItem(String cartId, AddItemRequest request) {
    return componentClient
        .forKeyValueEntity(cartId)
        .method(ShoppingCartEntity::addItem)
        .invoke(request.toCommand());
  }

  @Get("/{cartId}")
  public CartResponse getCart(String cartId) {
    var cart = componentClient
        .forKeyValueEntity(cartId)
        .method(ShoppingCartEntity::getCart)
        .invoke();

    return CartResponse.from(cart);
  }
}
```

The endpoint owns transport shape and delegation, not cart rules.

## Tests To Write

- `ShoppingCartTest`: adding a valid item, rejecting invalid quantity.
- `ShoppingCartEntityTest`: command updates state and read-only query returns it.
- `ShoppingCartEndpointTest`: route accepts request DTO and returns response DTO.

## Review Questions

- Can the cart rules be tested without Akka?
- Is the component id stable and business-named?
- Does the endpoint expose internal state or a public response DTO?
- Is invalid input rejected at the right boundary?
- Would a duplicate `addItem` command be safe for the business case?
