# Running the shop

## Phone and laptop

The public Firebase Hosting storefront is https://wakad-kissan.web.app/. It uses the same Firestore catalog and orders on every device. Each device signs in separately using the registered phone number. Browser sessions remain signed in until sign-out or browser data removal.

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
npx firebase-tools deploy --project wakad-kissan
```

Firestore rules deny direct client writes. Server functions require phone authentication; catalog and order-status writes require a `shopkeeper: true` custom claim. Do not grant this claim to customers. Changing the approved shopkeeper should be performed by a project administrator using the Admin SDK scripts, never by a client-provided flag.

The workflow in `.github/workflows/checks.yml` runs checks on each push. Deployment is manual; no long-lived deployment secret has been added to GitHub. A future automatic release should use workload identity federation, scoped to this Firebase project.

## Hosting boundaries

The older Sites deployment remains owner-private in ChatGPT. Firebase Hosting is the device-friendly public storefront. Its public web API configuration is an identifier, not an administrative credential. Customer address, phone, and order documents require account-scoped access. Never upload Firebase Admin keys, CLI tokens, OTPs, or Android signing keys into the repository.

## Wakad Circle: addresses, pickup and order confirmation

The customer app supports up to 10 saved addresses per signed-in account. Entries sync privately through Firebase; the selected address is remembered per device. Delivery serves PIN 411057 and costs **₹25**, waived at an item subtotal of **₹499**. Store pickup has **no delivery fee and no minimum order**. Customers choose an arrival interval of 15, 30, 45, 60, 90 or 120 minutes. The pickup address is configured in `dist/firebase-config.js`; currently it is the generic Wakad, Pune · 411057, pending the shop's exact address.

Open https://wakad-kissan.web.app/shopkeeper.html and sign in with the approved shopkeeper phone. Keep this portal open to receive incoming-order popups; choose **Enable sound** for an audible alert. Closed-app push notifications are not implemented. Check every item, then accept or reject with a reason. Pending orders reserve inventory; rejection restores it once. Accepted orders move to Preparing, then Ready for pickup or Out for delivery, then Completed. Customers follow progress under the account icon → My orders.

Use Inventory & prices in this separate portal to update the catalog. `/shopkeeper.html?mode=demo` uses local sample data only. Live portal access and every administrative write require a server-issued shopkeeper claim, even if someone knows the portal URL.

## Security boundary

Firebase manages HTTPS hosting and cloud infrastructure. The app enforces private address/order reads, verified-phone writes, server-only pricing/stock calculations, valid status transitions, idempotent checkout and five accepted order submissions per account per minute. Callable CORS allows only the three app hosting origins; CORS is a browser constraint, not a substitute for authentication. No file-upload or executable-download feature is present.

A restrictive Content Security Policy blocks inline scripts/event attributes, plugins and framing; only the app and the required Google/Firebase dependencies can load scripts. Style attributes remain allowed for existing dynamic product art. HTTPS/HSTS, nosniff and disabled camera/microphone/location permissions are applied. Dependencies and committed source are scanned before release.

This is application hardening, not a custom network firewall/WAF or an antivirus guarantee. Firebase App Check enforcement, external WAF/Cloud Armor, project-wide billing alerts and closed-app push alerts are not enabled. App Check should be registered and monitored before enforcement so legitimate installed clients are not locked out. Phone OTP uses Firebase reCAPTCHA and India-only SMS configuration; SMS spending is not hard-capped by the client cooldown. Keep account 2-step verification and dependencies current. Physical-phone acceptance and an independent penetration test remain separate verification work.
