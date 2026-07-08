# Security Audit Report - `hari-2`

Scope: `index.html`, `main.js`, `style.css`, `README.md`

This review focuses on security issues, anomalies, input validation, and unethical design patterns in the current client-side implementation.

## Executive Summary

The application is a browser-only storefront. That makes several choices risky by default: secrets are embedded in client code, pricing logic is trusted from the DOM, and user input is rendered into the page with `innerHTML`. In addition, the UI uses fabricated scarcity and a hidden handling fee, which are not technical bugs but are misleading product patterns.

The highest-risk findings are:

1. DOM-based XSS through note rendering.
2. Hardcoded coupon secret in client code.
3. Price tampering through editable DOM attributes.
4. Weak input validation for quantity values.
5. Misleading urgency and pricing patterns.

## Findings

### 1. DOM XSS in Note Preview

- Location: `main.js:110-116`
- Issue: The note typed by the user is appended with `innerHTML`:

  ```js
  preview.innerHTML = "Catatan: " + note;
  ```

  This treats user input as markup instead of text.
- Impact: An attacker can inject script-bearing HTML into the cart view. Example payload: `<img src=x onerror=alert(1)>`. If this note is later persisted or shared, the impact can extend to stored XSS.
- Root cause: Unsafe HTML rendering of untrusted user input.
- Suggested fix:
  - Replace `innerHTML` with `textContent`.
  - If formatting is needed, sanitize input with a proven HTML sanitizer before rendering.
  - Apply the same rule anywhere user-controlled content is displayed.

### 2. Coupon Secret Exposed in Client Code

- Location: `main.js:31-33`, `main.js:168-181`
- Issue: The coupon value `TEMANFARMER` is hardcoded in browser JavaScript and the discount decision is made entirely on the client.
- Impact: Anyone who opens DevTools or views source can discover the coupon and apply a 90% discount. The discount logic can also be modified locally.
- Root cause: Sensitive business rules and secrets are enforced in the browser.
- Suggested fix:
  - Move coupon validation to a server-side endpoint.
  - Return only the computed discount from the server.
  - Never place shared secrets in frontend code.

### 3. Cart Price Tampering Through DOM Data Attributes

- Location: `main.js:51-63`, `main.js:128-138`, `main.js:253-258`
- Issue: The plus button stores product price in `data-price`, and `addToCart()` trusts that value:

  ```js
  addToCart(target.dataset.id, Number(target.dataset.price));
  ```

  Since DOM attributes are editable, the displayed price can be changed before click.
- Impact: A user can reduce item prices in DevTools and checkout at an arbitrary amount. This is a direct revenue integrity issue.
- Root cause: Price authority is placed in mutable client-side state.
- Suggested fix:
  - Derive the price from an immutable product catalog keyed by product ID.
  - In a real checkout flow, recalculate prices on the server at order creation time.
  - Never trust values that originate from the DOM for billing.

### 4. Quantity Input Validation Is Too Weak

- Location: `main.js:157-166`, `main.js:279-285`
- Issue: Quantity is parsed with `parseInt()` and passed into `updateQuantity()` without checking for `NaN`, decimals, or upper bounds.
- Impact:
  - Clearing the input can produce `NaN` in the cart state.
  - Invalid numbers can produce broken totals or inconsistent cart behavior.
  - Negative and non-integer values are not explicitly rejected by the input layer, even though the UI intends quantity to be a positive whole number.
- Root cause: Validation is incomplete and happens only implicitly through UI constraints.
- Suggested fix:
  - Require `Number.isInteger(quantity)` and `quantity >= 1`.
  - Reject or reset invalid values before updating cart state.
  - Enforce the same rule in any future server-side checkout logic.

### 5. Floating-Point Money Formatting

- Location: `main.js:120-123`, `main.js:223-231`
- Issue: Monetary values are calculated with regular floating-point arithmetic and rendered without fixed precision in some places.
- Impact: Totals can display as `3.0999999999999996` or otherwise look inconsistent after repeated operations. That creates user distrust and can lead to reconciliation errors if the same pattern is extended.
- Root cause: Currency is represented as floating-point values instead of integer minor units.
- Suggested fix:
  - Store money as integer cents.
  - Format display values with a dedicated currency formatter.
  - Keep calculation and presentation separate.

### 6. Fabricated Scarcity / False Urgency

- Location: `main.js:45-58`, `style.css:310-318`
- Issue: Stock is randomly generated on every render:

  ```js
  const sisa = Math.floor(Math.random() * 5) + 1;
  ```

  This makes the “tinggal X lagi hari ini!” message unstable and not representative of real inventory.
- Impact: Users are nudged into faster purchases based on invented scarcity. This is a dark pattern, not a technical bug.
- Root cause: Urgency messaging is decoupled from inventory truth.
- Suggested fix:
  - Remove the scarcity claim unless it is backed by real stock data.
  - If inventory exists, fetch it from a trusted source and cache it consistently.
  - Avoid urgency claims unless they are accurate and auditable.

### 7. Hidden Handling Fee in the Checkout Flow

- Location: `main.js:28-33`, `main.js:119-123`, `main.js:223-231`, `index.html:56-63`
- Issue: A handling fee is applied in the total calculation, but the main cart total only surfaces the final number without clearly framing the fee as a separate line item at the first point of decision.
- Impact: Users may believe the displayed total is the simple sum of products, then discover an extra fee late in the flow. This is a pricing transparency problem and a dark pattern.
- Root cause: Fee disclosure is delayed and not emphasized consistently.
- Suggested fix:
  - Show subtotal, fee, discount, and final total at the same level of prominence.
  - Label optional vs mandatory charges clearly.
  - Keep the cart summary and review modal consistent.

### 8. External Dependency Risk Without Integrity Controls

- Location: `index.html:7-8`, `style.css:1`
- Issue: The page loads Font Awesome and Google Fonts from third-party CDNs without subresource integrity or a content security policy.
- Impact: If a CDN is compromised or blocked, the app can break or inherit malicious content. This is not the most severe issue here, but it is a supply-chain exposure.
- Root cause: Third-party assets are loaded directly from the network with no integrity pinning.
- Suggested fix:
  - Self-host critical assets where possible.
  - Add SRI to static external scripts/styles that support it.
  - Add a CSP to reduce the impact of injected markup and third-party compromise.

### 9. Encoding / Content Anomaly

- Location: `main.js:2`, `main.js:60`, `README.md` and other text files
- Issue: Several text strings display mojibake such as `â€”` and `âˆ’`, which indicates an encoding mismatch somewhere in the toolchain or file history.
- Impact: This is not a direct security flaw, but it is a quality anomaly and can hide the real text content from reviewers or users.
- Root cause: Charset mismatch during file creation or display.
- Suggested fix:
  - Normalize files to UTF-8.
  - Verify the editor, terminal, and build pipeline all use the same encoding.

## Input Validation Review

The current app validates almost nothing beyond superficial HTML attributes. The following inputs need stronger validation:

- Quantity: must be an integer `>= 1`.
- Coupon code: should be normalized, length-limited, and validated server-side.
- Note field: must be treated as plain text and length-limited.
- Any future price, shipping, or discount input: should not be accepted from the browser as truth.

Recommended validation principles:

1. Validate on the server, not only in the browser.
2. Reject invalid values early and explicitly.
3. Keep numeric money values as integer minor units.
4. Render untrusted text with text APIs, not HTML APIs.

## Risk Ranking

Critical:

- DOM XSS in note preview.
- Coupon secret exposed in client.
- DOM-driven price tampering.

High:

- Weak quantity validation.
- Floating-point money display.

Medium:

- Fake scarcity.
- Hidden handling fee disclosure.
- Third-party asset exposure without integrity controls.

Low:

- Encoding anomalies.

## Root-Cause Summary

The main design issue is trust placement. The browser is being treated as a trusted authority for things that affect money, safety, and user choice. That is the root cause behind most of the findings:

- Trusting `innerHTML` for user input creates XSS.
- Trusting client code for secrets creates coupon leakage.
- Trusting DOM attributes for pricing enables tampering.
- Trusting the UI for validation creates invalid states.
- Trusting arbitrary scarcity messaging creates manipulation.

The correct long-term fix is to move business-critical decisions to a trusted backend and reduce the frontend to a presentation layer with strict validation and safe rendering.

