# Wakad Circle

Two connected installable apps for Wakad, Pune:

- Customer shop: https://wakad-circle.web.app/
- Shopkeeper app: https://wakad-circle.web.app/shopkeeper/

Both use the same live Firebase catalog, inventory and orders in Mumbai. The customer app has no owner portal, sample catalog or simulated payment controls. The shopkeeper app requires verified phone authentication and a server-issued role. Install each using Chrome/Edge's install menu or Safari's Add to Home Screen.

Delivery costs ₹25 and is free from a ₹499 item subtotal. Pickup is free with no minimum; customers select an arrival interval. Up to ten private addresses sync per account. Store acceptance and order progress update through Firestore listeners. Keep the owner app open for incoming alerts; closed-app push is not implemented.

Cash and real amount-prefilled UPI links/QRs are supported. Receipt confirmation and refunds require a bank check by the shopkeeper. The app cannot transfer, refund or automatically verify money. No payment gateway surcharge is added; bank and Firebase terms still apply.

## Development and verification

Use Node 22 and Java 21:

~~~powershell
npm ci --ignore-scripts
npm ci --prefix functions --ignore-scripts
npm run check
npm test
npm run audit:all
npx --yes firebase-tools@15.35.0 emulators:exec --only firestore --project demo-wakad-circle-audit --config firebase.audit.json "npm run test:integration"
~~~

The CLI's demo- prefix identifies an isolated emulator-only project, not an application mode. Integration tests refuse to run outside the configured emulator. npm start serves the live-data frontend at loopback port 4173. Production callables reject unlisted local origins.

After checks, an authorized administrator deploys using npx --yes firebase-tools@15.35.0 deploy --project wakad-circle. GitHub checks run on pushes; no deployment credential is stored in GitHub.

The immutable cloud project ID remains wakad-kissan to preserve existing accounts/data. Public branding and the canonical host use Wakad Circle. The old host redirects; the older Sites mirror stays owner-private.

Read [operations](docs/OPERATIONS.md), [hosting costs](docs/HOSTING-AND-COSTS.md) and the [audit report](docs/AUDIT-REPORT.md). Never commit Admin keys, CLI tokens, OTPs or signing credentials.
