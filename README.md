# Wakad Kissan

India-focused kirana prototype for phones and laptops. Live storefront: https://wakad-kissan.web.app/.

Shared Firebase catalog, prices, stock, cash-on-delivery orders and order management. Prices are in ₹, phone sign-in uses +91, and the database/backend use Mumbai. Shopkeeper access uses a server-issued custom claim. Free delivery begins at ₹200; below that delivery is ₹25. Current delivery PIN: 411057.

Double-click `Start Demo.cmd` on this PC to open the presentation. Click **Start shopkeeper demo** for a five-step guided walkthrough. Presentation data is browser-local, requires no SMS, and sends no real orders. Free delivery begins at ₹200; below that the fee is ₹25.

## Firebase mode

The registered Firebase project is `wakad-kissan`. Its public web configuration is in `dist/firebase-config.js`. The app opens in live mode; use **Presentation mode** or `?mode=demo` for browser-local sample data. Install the web app using the browser install menu or the Install app button. An internet connection is required for shared data and writes.

The code includes Phone OTP with reCAPTCHA, resend cooldown, error handling and sign-out; realtime Firestore reads; and callable backend functions for price changes, product creation, stock deduction and order management. Firebase rules prohibit direct client writes. Orders use server catalog prices and an atomic stock transaction; a request ID prevents duplicate checkout submissions.

## Develop, test and deploy

Use Node 22. Run `npm ci --prefix functions --ignore-scripts`, `npm run check`, `npm test`, and `npm run audit:dependencies`. Run `npm start` to serve locally at http://localhost:4173/. After checks pass, sign in through the official Firebase CLI and deploy with `npx firebase-tools deploy --project wakad-kissan`.

Catalog edits in Manage shop sync through Firebase without a code release or app-store update. GitHub CI runs checks on pushes; no deployment credential is stored in GitHub. An authorized project administrator assigns the `shopkeeper: true` custom claim using the Admin SDK scripts; customers cannot self-assign it.

Read [operations](docs/OPERATIONS.md), [hosting and cost estimate](docs/HOSTING-AND-COSTS.md), [Play release readiness](docs/PLAY-RELEASE.md), and [audit report](docs/AUDIT-REPORT.md).

Never commit Admin credentials, CLI authorization codes, OTPs, or Android signing keys. The older ChatGPT Sites deployment remains owner-private; Firebase Hosting provides ordinary phone/laptop access. The installable web app is not a Google Play release. Checkout uses cash on delivery; there is no payment gateway.
