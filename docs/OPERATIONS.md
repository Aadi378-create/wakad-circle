# Running the shop

## Phone and laptop

The public Firebase Hosting storefront is https://wakad-kissan.web.app/. It uses the same Firestore catalog and orders on every device. Each device signs in separately using the registered phone number. Browser sessions remain signed in until sign-out or browser data removal.

On Android Chrome or desktop Chrome/Edge, use **Install app** or the browser's install menu. On iPhone, use Safari → Share → Add to Home Screen. This is an installable web app, not a Play Store release. Keep an internet connection for current stock, checkout and administrative writes. The service worker caches the interface only; orders and phone-auth API responses are not cached.

## Catalog changes

1. Sign in with the approved shopkeeper number.
2. Open **Manage shop → Inventory & prices**.
3. Change price or stock, then Save. Use Add product for a new pack size/product.
4. Open the storefront on another device to see the shared update.

Catalog edits are database records and require no code release or app-store update. Editing source code requires tests and a deployment. The prototype uses cash on delivery, serves PIN 411057, and offers free delivery from ₹200; below ₹200 delivery is ₹25.

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
