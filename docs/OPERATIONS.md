# Running the shop

## Phone and laptop

The public Firebase Hosting storefront is https://wakad-circle.web.app/. It uses the same Firestore catalog and orders on every device. Each device signs in separately using the registered phone number. Browser sessions remain signed in until sign-out or browser data removal.

On Android Chrome or desktop Chrome/Edge, use **Install app** or the browser's install menu. On iPhone, use Safari → Share → Add to Home Screen. This is an installable web app, not a Play Store release. Keep an internet connection for current stock, checkout and administrative writes. The service worker caches the interface only; orders and phone-auth API responses are not cached.

## Catalog changes

1. Sign in with the approved shopkeeper number.
2. Open **Shopkeeper portal → Inventory & prices**.
3. Change price or stock, then Save. Use Add product for a new pack size/product.
4. Open the storefront on another device to see the shared update.

Catalog edits are database records and require no code release or app-store update. Editing source code requires tests and a deployment. The prototype uses cash on delivery, serves PIN 411057, and offers free delivery from ₹499; below ₹499 delivery is ₹25.

## Deploying changes

Use Node 22, sign in through the official Firebase CLI, and run:

```powershell
npm ci --prefix functions --ignore-scripts
npm run check
npm test
npm run audit:dependencies
npx firebase-tools deploy --project wakad-circle
```

Firestore rules deny direct client writes. Server functions require phone authentication; catalog and order-status writes require a `shopkeeper: true` custom claim. Do not grant this claim to customers. Changing the approved shopkeeper should be performed by a project administrator using the Admin SDK scripts, never by a client-provided flag.

The workflow in `.github/workflows/checks.yml` runs checks on each push. Deployment is manual; no long-lived deployment secret has been added to GitHub. A future automatic release should use workload identity federation, scoped to this Firebase project.

## Hosting boundaries

The older Sites deployment remains owner-private in ChatGPT. Firebase Hosting is the device-friendly public storefront. Its public web API configuration is an identifier, not an administrative credential. Customer address, phone, and order documents require account-scoped access. Never upload Firebase Admin keys, CLI tokens, OTPs, or Android signing keys into the repository.

## Wakad Circle: addresses, pickup and order confirmation

The customer app supports up to 10 saved addresses per signed-in account. Entries sync privately through Firebase; the selected address is remembered per device. Delivery serves PIN 411057 and costs **₹25**, waived at an item subtotal of **₹499**. Store pickup has **no delivery fee and no minimum order**. Customers choose an arrival interval of 15, 30, 45, 60, 90 or 120 minutes. The pickup address is configured in `dist/firebase-config.js`; currently it is the generic Wakad, Pune · 411057, pending the shop's exact address.

Open https://wakad-circle.web.app/shopkeeper.html and sign in with the approved shopkeeper phone. Keep this portal open to receive incoming-order popups; choose **Enable sound** for an audible alert. Closed-app push notifications are not implemented. Check every item, then accept or reject with a reason. Pending orders reserve inventory; rejection restores it once. Accepted orders move to Preparing, then Ready for pickup or Out for delivery, then Completed. Customers follow progress under the account icon → My orders.

Use Inventory & prices in this separate portal to update the catalog. `/shopkeeper.html?mode=demo` uses local sample data only. Live portal access and every administrative write require a server-issued shopkeeper claim, even if someone knows the portal URL.

## Security boundary

Firebase manages HTTPS hosting and cloud infrastructure. The app enforces private address/order reads, verified-phone writes, server-only pricing/stock calculations, valid status transitions, idempotent checkout and five accepted order submissions per account per minute. Callable CORS allows only the three app hosting origins; CORS is a browser constraint, not a substitute for authentication. No file-upload or executable-download feature is present.

A restrictive Content Security Policy blocks inline scripts/event attributes, plugins and framing; only the app and the required Google/Firebase dependencies can load scripts. Style attributes remain allowed for existing dynamic product art. HTTPS/HSTS, nosniff and disabled camera/microphone/location permissions are applied. Dependencies and committed source are scanned before release.

This is application hardening, not a custom network firewall/WAF or an antivirus guarantee. Firebase App Check enforcement, external WAF/Cloud Armor, project-wide billing alerts and closed-app push alerts are not enabled. App Check should be registered and monitored before enforcement so legitimate installed clients are not locked out. Phone OTP uses Firebase reCAPTCHA and India-only SMS configuration; SMS spending is not hard-capped by the client cooldown. Keep account 2-step verification and dependencies current. Physical-phone acceptance and an independent penetration test remain separate verification work.

## Brand and domain migration

Canonical customer URL: https://wakad-circle.web.app/. Shopkeeper URL: https://wakad-circle.web.app/shopkeeper.html. GitHub: https://github.com/Aadi378-create/wakad-circle (private).

Firebase project/web-app display names, installed-app manifest/icons, launcher, package names and Sites display title use Wakad Circle. The new Hosting site shares the existing Firebase data and authenticated roles. Its two Firebase-provided domains are authorized for phone authentication and allowed by callable CORS/CSP.

The former public Hosting site is retained only for permanent path-preserving redirects. The cloud project ID, storage bucket and function endpoint resource names are immutable infrastructure identifiers and remain unchanged. The old Sites private preview URL is also fixed by its provider; its display title/content is Wakad Circle. No duplicate database or new billing project was created.

Install the PWA from the new canonical URL and remove the old home-screen installation/shortcut. Browser login and local basket data are origin-specific, so sign in again on the new domain; saved Firebase addresses and orders remain attached to the same verified phone account. Existing installed apps cannot silently change their web origin. Old published source/history and migration/redirect references naturally contain the earlier resource names.

## Direct UPI and amount-filled QR collection

The owner supplied the recipient VPA, payee name and Axis Bank details. The uploaded QR was decoded locally and its recipient matches the configured VPA. No bank account ownership or merchant onboarding was independently verified. The recipient is deliberately public in the payment UI and `dist/payments-core.js`; no bank password, PIN or secret API credential is stored.

Customer checkout offers cash or UPI. For UPI orders, payment opens from **My orders** after the shop accepts availability. The QR and **Open UPI app** button contain the server-recorded order total including the delivery fee, INR, recipient and an opaque order payment reference. Amounts retain two decimal places. **₹ Collect UPI** in the shopkeeper portal also generates a QR for a manually entered counter-sale amount, from ₹1 to ₹1,00,000. Counter collections are not online order records.

These are amount-prefilled UPI links, not bank-issued cryptographically locked payment requests. Some UPI apps may allow edits or restrict generic web links; test with the shop's actual phone/app before relying on this in-store. Do not use the demo QR for transfers: demo mode intentionally encodes non-payment text and disables the app-launch button. The uploaded static QR had no amount; app-generated QRs add the amount rather than altering that image.

There is no paid gateway integration, gateway subscription or platform transaction surcharge added by the app. Axis/UPI account, merchant/payment-type terms and existing Firebase usage charges remain applicable. No general zero-bank-fee guarantee is made. See Axis Bank's current UPI and merchant acquiring terms.

A customer submits a 12-digit UTR/RRN as a claim; this remains **Verification pending**. The shopkeeper must check the real bank statement, type the amount received, and confirm it matches the full order total. Screenshots, redirect callbacks and a customer reference cannot mark an order paid. Only the shopkeeper callable can record a verified receipt. A bank reference cannot be recorded against two different orders. A customer can submit at most three distinct reference attempts before contacting the store.

If a paid order is rejected, its payment becomes **Refund required**. Refund externally in the bank first, then use **All orders → Record completed refund** with the refund reference and exact amount. This app does not move or refund money automatically. A late payment on an already rejected order can be recorded by the shopkeeper and likewise needs a refund. No cards, automatic settlement confirmation, webhook or gateway refunds are implemented.
