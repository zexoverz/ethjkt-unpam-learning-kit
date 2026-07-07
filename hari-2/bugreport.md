# Bug Report - Hari 2 Pasar Pagi

## Finding Number 1: [BUG]

### What the problem is (in your own words):

The quantity input in the basket does not properly validate abnormal values. If the user enters an invalid quantity, the cart can show `NaN` in the item quantity or total. After that happens, the basket can get stuck in a broken state and the normal buttons/controls do not recover the item correctly.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Add Apel Fuji to the basket.
3. In the basket, edit the Apel Fuji quantity input.
4. Enter an abnormal value, for example `-8` or another invalid value.
5. The item quantity/total can become wrong or show `NaN`.
6. Try clicking the plus/minus buttons or editing the input again. The cart is difficult to recover because the cart state already contains a broken value.

### Why this is dangerous or unfair (who is harmed):

Quantity is important data for calculating the order total. If the app accepts invalid quantity values, the buyer can see a wrong total or a broken cart. In a real store, this harms both the buyer and the seller because the order data cannot be trusted.

### How to fix it:

Validate quantity before saving it into the cart. The quantity must be an integer. Invalid values like `NaN` should not be stored.

Implemented fix in `main.js`:

```js
if (!Number.isInteger(quantity)) {
  return;
}
```

## Finding Number 2: [BUG]

### What the problem is (in your own words):

When the user deletes the number inside the quantity input, the input becomes empty for a moment. The old code immediately tried to read that empty input as a number, which caused `NaN`.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Add Apel Fuji to the basket.
3. Click the Apel Fuji quantity input in the basket.
4. Delete the number in the field until it is empty.
5. The total/item value can become `NaN`.

### Why this is dangerous or unfair (who is harmed):

Deleting a number before typing a new number is normal user behavior. The app should not break just because the user clears the input. This harms the buyer because the basket becomes confusing and the total price cannot be trusted.

### How to fix it:

Handle empty quantity input explicitly. In this app, an empty quantity means the item should be removed from the basket.

Implemented fix in `main.js`:

```js
if (target.value === "") {
  deleteItem(target.dataset.id);
  return;
}
```

## Finding Number 3: [BUG]

### What the problem is (in your own words):

The basket icon count can stay incorrect when a quantity is deleted. For example, if Apel Fuji quantity is `2`, then the user clears the quantity input, the basket icon can still show the old count instead of updating.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Add Apel Fuji until the quantity is `2`.
3. Check the basket icon count. It shows `2`.
4. Delete the Apel Fuji quantity from the basket input.
5. The basket icon count does not correctly follow the user action.

### Why this is dangerous or unfair (who is harmed):

The basket icon is the main indicator of how many items the buyer is about to purchase. If it does not match the basket content, the buyer can misunderstand what they are ordering.

### How to fix it:

When the quantity input is emptied, delete the item and re-render the basket. This keeps the cart state, item display, and basket icon count synchronized.

Implemented fix in `main.js`:

```js
if (target.value === "") {
  deleteItem(target.dataset.id);
  return;
}
```

## Finding Number 4: [SECURITY]

### What the problem is (in your own words):

The total price can be manipulated because the cart takes the item price from the HTML button data instead of always using the official product price in the code. That means someone can open DevTools, change the button's `data-price`, add the item to the basket, and the total will be calculated from the changed price.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Open DevTools and inspect a product's plus button.
3. Change the button attribute `data-price` to another value, for example `0.01`.
4. Click the plus button for that product.
5. The basket total uses the changed price instead of the real product price.

### Why this is dangerous or unfair (who is harmed):

This is dangerous because the browser cannot be trusted for important business logic like prices. A buyer could make items cheaper by editing the page before adding them to the basket. The seller is harmed because they could receive orders with fake prices. Honest buyers are also harmed because the store total is not trustworthy.

### How to fix it:

Do not trust prices from the DOM. The cart should use the official product price from the product catalog when adding an item.

Implemented fix in `main.js`:

```js
function addToCart(id) {
  const product = products.find((item) => item.id == id);
  if (!product) return;

  if (!cart[id]) {
    cart[id] = { ...product, count: 0 };
  }

  cart[id].price = product.price;
  cart[id].count++;
  renderCart();
}
```

The total display was also changed to use two decimal places so the price looks like normal money:

```js
totalPriceEl.textContent = total.toFixed(2);
```

## Finding Number 5: [ETHICS]

### What the problem is (in your own words):

The total price includes an extra handling fee, but the basket did not clearly show that fee before checkout. The customer only sees the final total and may not understand why the number is higher than the fruit prices they selected.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Add one or more fruits to the basket.
3. Manually add the fruit prices from the basket.
4. Compare that number with the displayed total.
5. The displayed total is higher because the code adds a handling fee, but the basket did not clearly explain that fee before the customer continues.

### Why this is dangerous or unfair (who is harmed):

This is unfair to the customer because they may think the store is charging only the fruit prices, while an extra fee is silently included. Hidden fees are a dark pattern because they make the real price less clear and can pressure customers into paying more than they expected.

### How to fix it:

Show a clear price breakdown before checkout. The basket should display subtotal, handling fee, discount if any, and final total.

Implemented fix in `index.html`:

```html
<div class="cart-breakdown" id="cart-breakdown"></div>
```

Implemented fix in `main.js`:

```js
cartBreakdownEl.innerHTML = `
  <div class="row"><span>Subtotal barang</span><span>$${totalPrice.toFixed(2)}</span></div>
  <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
  ${diskon ? `<div class="row"><span>Kupon (-10%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
`;
```

## Finding Number 6: [ETHICS]

### What the problem is (in your own words):

The stock number is not accurate. The app shows a random “only a few left” message every time products are rendered, so the number can change after clicking buttons or refreshing even though the real stock did not change.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Look at the stock text under a product.
3. Click plus or minus, or refresh the page.
4. The stock text can change randomly.
5. This proves the stock number is not based on real inventory.

### Why this is dangerous or unfair (who is harmed):

This is unfair to customers because fake low stock can pressure them to buy quickly. It is a dark pattern: the store creates fake urgency instead of showing honest inventory information. The customer is harmed because they make a buying decision based on misleading information.

### How to fix it:

Store the real stock in the product data, display the remaining stock from that data, and prevent users from adding more than the available stock.

Implemented fix in `main.js`:

```js
{ id: 1, name: "Apel Fuji", price: 1.5, stock: 8, ... }
```

```js
const remainingStock = product.stock - quantity;
```

```js
if (cart[id].count >= product.stock) {
  showToast("Stok barang ini sudah habis.");
  return;
}
```

## Finding Number 7: [SECURITY]

### What the problem is (in your own words):

The coupon system is confusing and unsafe. The page shows a coupon input, but the customer does not know where to get a coupon code. At the same time, the real coupon code is hidden inside the JavaScript file. Anyone who opens the source code can find the secret coupon and use it.

### How to prove it (exact steps you took):

1. Open `hari-2/index.html` in the browser.
2. Look at the coupon input. There is no clear information about where to get a coupon.
3. Open `hari-2/main.js` or use View Source / DevTools.
4. Search for the coupon logic.
5. The coupon code is visible in the client-side code, so it is not actually secret.

### Why this is dangerous or unfair (who is harmed):

This harms normal customers because they see a coupon field but do not know how to use it. It also harms the seller because a hidden client-side coupon can be discovered and abused. Important discount logic should not depend on secrets stored in the browser.

### How to fix it:

If the coupon is public, show it clearly in the UI. If the coupon is private, validate it on a server instead of hiding it in frontend JavaScript. For this static learning app, the fix is to make the coupon public and reduce it to a clear 10% promo.

Implemented fix in `index.html`:

```html
<p class="coupon-hint">Kupon publik hari ini: PASARPAGI10</p>
```

Implemented fix in `main.js`:

```js
const PUBLIC_COUPON_CODE = "PASARPAGI10";
const PUBLIC_COUPON_DISCOUNT = 0.1;
```

```js
const code = document.getElementById("coupon").value.trim().toUpperCase();
```
