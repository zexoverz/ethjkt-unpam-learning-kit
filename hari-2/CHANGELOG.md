# Changelog Hari 2

## 2026-07-07

- Hardened the cart so item prices come from the catalog source instead of trusting `data-price` from the DOM.
- Replaced the random stock badge with stable per-product stock values and renamed the UI copy to be descriptive instead of panic-driven.
- Sanitized the note preview by rendering it as text, which removes the XSS sink from the sidebar preview.
- Validated quantity input before applying it, so empty input, letters, and other malformed values no longer turn cart totals into `NaN`.
- Added explicit fee disclosure in the cart sidebar so handling charges are visible before checkout.
- Formatted all money outputs consistently with two decimals for the cart summary and review modal.
- Reframed the coupon as a public demo code instead of a hidden secret, which makes the client-side limitation explicit.
- Enforced per-item stock limits in both the plus-button flow and manual quantity edits, then sanitized the cart again before checkout.
- Kept coupon entry non-blocking: a wrong coupon now only removes the discount and shows a message, instead of stopping checkout.
- Added a findings report in `LAPORAN-TEMUAN.md` to document the issues the brief asks students to identify and verify.

## Notes

- This project is still a frontend-only demo, so any pricing, coupon, and checkout logic that lives in the browser should be treated as illustrative rather than authoritative.
- The fixes focus on removing avoidable bugs, reducing trust in mutable DOM state, and making the interface more transparent.
