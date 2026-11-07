# Operating Wakad Circle

## The two apps

Customers use https://wakad-circle.web.app/. Owners use https://wakad-circle.web.app/shopkeeper/. Each has a separate installable identity and scoped service worker. Both share one Firebase project and browser authentication session. There is no portal entry in the customer interface. Knowing the owner URL grants no privileges: the server requires verified phone authentication and a shopkeeper custom claim.

Install using Chrome/Edge's install menu or Safari → Share → Add to Home Screen. Old-domain installations must be reinstalled from the new origin. Open/reload installed apps to receive interface updates. Catalog updates sync without a code release.

No presentation modes, sample orders or simulated payment paths remain. Old mode query parameters are discarded. Local preview also uses real Firebase data.

## Sign-in and connectivity

Firebase uses durable IndexedDB persistence with local-storage fallback and automatic token refresh. There is no inactivity logout. Clearing browser storage, private browsing, sign-out or server revocation can require another OTP. Devices/browser profiles maintain separate sessions.

Only the owner app subscribes to the whole-shop inbox. Customer queries remain UID-scoped even for owner accounts. Account changes clear private views and discard stale callbacks.

Firestore listeners deliver order changes. Cached data is labelled reconnecting. Resume/reconnect requests a deduplicated server refresh, with a bounded initial server check and manual Refresh orders control. All orders is the default filter. Keep the owner app open and connected for popups; enable sound with a user gesture. Mobile operating systems can suspend background apps. Closed-app push is not implemented.

Service workers cache the interface, not order/address/auth API responses. Current stock, ordering and writes require internet access.

## Catalog and orders

Use Inventory & prices in the owner app. Product revision checks reject stale edits. Prices must be at least ₹0.01 with two decimal places.

Delivery to PIN 411057 costs ₹25, waived at ₹499 item subtotal. Pickup is free with no minimum. Arrival choices are 15, 30, 45, 60, 90 or 120 minutes. The configured pickup address is Wakad, Pune · 411057; add the exact address before advertising directions.

Addresses are private per account, up to ten. Saves and deletes share a twenty-per-minute server limit. Orders use server prices and atomic stock reservations. Request IDs prevent duplicate checkout. A changed total requires customer review. Saved orders retain their agreed price after catalog edits.

Check availability before accepting Pending confirmation orders. Accepted → Preparing → Ready for pickup / Out for delivery → Completed. Rejecting releases reserved stock once. Customers track status under My orders. Five successful order submissions per account per minute are allowed.

## Real UPI payments

The configured public recipient is the owner-supplied Axis Bank VPA with payee name Aadi Jain. Ownership and merchant onboarding have not been independently verified. No bank PIN/password or secret payment credential is stored.

Accepted UPI orders offer a QR and app link containing the server-recorded amount, recipient, INR and opaque payment reference. Collect UPI in the owner app creates real counter requests for ₹1–₹1,00,000 without creating online orders. Some UPI apps permit amount edits or restrict generic web intents; validate using the actual phones.

Customer twelve-digit reference submissions remain Verification pending. Check the bank statement and exact received amount before marking Paid. Customer callbacks/screenshots cannot mark an order paid. A bank reference cannot be applied to two different orders. Three distinct customer reference attempts are permitted.

Paid rejected orders become Refund required. Refund externally through the bank first, then record the completed refund reference and exact amount. This app does not move/refund money, automatically verify settlement, or process cards. No app gateway surcharge is added; bank terms and Firebase usage charges apply.

## Release and security

Run all README checks. Integration tests use an isolated emulator and no production transactions. Deploy functions, rules and Hosting together when the checkout contract changes.

Firestore rules deny all client writes. Callables enforce phone authentication, roles, validation, server pricing, inventory transactions, status transitions and rate limits. Public catalog prices/stock are intentionally readable. Only project administrators can assign owner claims using scripts/set-shopkeeper.cjs.

Hosting uses CSP, HTTPS/HSTS, nosniff, anti-framing and restricted browser permissions. CORS is supplementary to authentication. No file-upload/executable feature exists. Never publish Admin keys, CLI tokens, OTPs or signing keys.

App Check enforcement, an external WAF/Cloud Armor, project-wide spending alerts and background push are not configured. Client OTP cooldown is not a hard SMS spending cap. Keep account 2SV, dependency checks and monitoring active. Physical-phone acceptance and independent penetration testing remain separate rollout work.

The Firebase storefront is public; account data stays protected by rules. The Sites mirror is owner-private. Immutable old cloud identifiers preserve existing accounts/data without duplicating the billing project.
