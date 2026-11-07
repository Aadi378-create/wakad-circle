# Wakad Circle application audit

Date: 7 November 2026 (India). Scope: customer and shopkeeper PWAs, shared authentication, Firestore rules, callable backend, payments, install/update caching, dependencies, repository and release configuration. This supersedes earlier audit notes in Git history. It is a code/security review with automated and browser verification, not an independent penetration-test certification or a scan of the entire PC.

## Result and fixes

No known failing checks or unresolved high/critical dependency findings remain in the application dependencies checked. That result cannot guarantee absence of every bug, malware or future vulnerability.

| Finding | Change and verification |
| --- | --- |
| Customer interface still exposed owner/presentation tools | Removed the embedded owner interface, footer portal link, tours, local sample catalog/orders and simulated payment branches. Customer bundle does not load owner scripts. A recursive release check rejects presentation-mode code in shipped assets. |
| An owner-signed-in customer app requested the whole-shop inbox | Subscription privilege now depends on app role as well as server claim. Customer app always queries its UID. A mocked SDK test verifies both role cases. Rules continue to restrict non-owner queries. |
| Stale address callbacks and open private dialogs could outlive an account change | Listener generations/UID guards reject old callbacks; account changes close private dialogs and clear order/address state. Session tests exercise account-switch and sign-out races. |
| Local cart values could contain malformed quantities/markup | Normalize numeric product IDs and integer quantities, reject other shapes and clamp to current stock. No local sample orders/products are loaded. Regression tests cover hostile keys and invalid values. |
| Changed prices could silently increase the checkout total | Customer submits the displayed total; the server recalculates in a transaction and rejects mismatches before stock writes. Catalog changes refresh open checkout for review. Emulator test confirms stale-price rejection leaves stock unchanged. |
| Sub-paise prices could round down to free | Server requires positive prices from ₹0.01 and exact paise precision; regression test covers fractional-paise input. |
| Address writes lacked a server throttle | Save and delete share twenty changes per UID per minute, enforced atomically. Emulator verifies combined limit, account isolation and no deletion after exhaustion. Existing ten-address limit remains. |
| An inventory form could adopt a newer revision while retaining older input values | Save now uses the product revision captured when the form rendered. A browser-code regression test verifies snapshot changes cannot refresh that revision, and an emulator test checks server rejection preserves stock. |
| Old catalog-seeding endpoint and bootstrap utility were unnecessary | Removed the exported callable and obsolete bootstrap/launcher files. Product maintenance now uses authenticated owner actions only. |
| Test SDK dependency introduced known development advisories | Pin the compatible patched @grpc/grpc-js version through a lockfile override. Both full dependency audits report zero known vulnerabilities. |

## Verification performed

- 42 unit, static, backend-handler and session tests passed.
- 8 isolated Firestore integration tests passed, using a dummy emulator-only project with no production credentials/data. These exercise actual rules, server transactions and customer listeners: unauthorized reads/writes, UID-scoped queries, verified owner access, private addresses/receipts, inventory reservations, idempotency, catalog edits, order acceptance/rejection, payment claims, bank-confirmation records and refunds.
- Syntax checks passed for 32 JavaScript files.
- Root and backend npm audits: zero known vulnerabilities at audit time, including development dependencies.
- Gitleaks working tree and Git history scans: no unallowlisted secrets detected. Firebase public browser API configuration is deliberately allowlisted; it grants no Admin privileges.
- Browser checks: live public catalog loads in the cleaned customer interface; cart shows ₹25 delivery and free pickup; separate owner app presents its authenticated gate without sample controls. Console checks found no application errors in those views.
- Deployment smoke checks cover both PWA assets, security headers, canonical redirects, public catalog availability, denied anonymous private reads and denied anonymous writes to all seven callables.

No production order, stock record, payment status or bank transfer was changed as test data. Integration bank references and customer identities exist only in the disposable local emulator. Physical-phone purchase/UPI authorization and overnight session retention are not claimed as tested.

## Security controls reviewed

Firestore denies all direct client writes. Phone-authenticated callables enforce server-issued owner claims, request validation, server prices, transactionally reserved stock, optimistic inventory revisions, order idempotency, rate limits and valid status/payment transitions. Customer references remain unverified claims; only bank-checked owner actions can record payment. Unique private bank-reference records prevent reuse against another order. Refund actions record an externally completed refund and do not move money.

Hosting applies HTTPS/HSTS, CSP without inline/eval scripts, anti-framing, nosniff, referrer restrictions and disabled camera/microphone/location permissions. Dynamic product styles require inline style permission. CORS restricts browser origins but is not authorization. Service workers cache interface resources only; account APIs and mutations are excluded. The two PWAs have distinct installation identities/scopes and share one backend. Durable Firebase persistence and bounded reconnect/server refresh handling are retained.

The canonical Firebase site is public. The Sites mirror remains owner-private. Immutable cloud resource IDs retaining the old name do not expose an alternate database or grant access. Public catalog and merchant VPA are intentional public information.

## Remaining rollout work and limits

- App Check is not enforced; no external WAF/Cloud Armor or automated abuse-monitoring response was configured. Firebase infrastructure protection is not a custom firewall. Client OTP cooldown is not a hard SMS spend cap. Configure budget alerts, monitoring and App Check enrollment before broader traffic; monitor legitimate clients before enforcing it.
- Real UPI QR/intent requests prefill amounts, but some bank apps can allow edits or restrict generic intents. Merchant onboarding, beneficiary ownership and actual bank receipt must be checked by the owner. Automatic settlement verification, card payments and automatic refunds are not implemented.
- Mobile browsers can suspend background PWAs. Incoming-order alerts require an open connected owner app; closed-app push is not implemented.
- Browser storage clearing, private browsing and server revocation can end sessions. No inactivity logout is imposed by this app; indefinite retention cannot be guaranteed by application code.
- The pickup address remains the owner-approved generic Wakad, Pune · 411057. Add the exact street/shop address before directing customers there.
- No Google Play release is planned. Device installation is through browser PWA installation. Test on the owner's actual phone and laptop before a wider launch.
- Dependency audits detect published advisories, and secret scans are pattern-based. Neither proves absence of unknown flaws. Maintain updates, least-privilege project access, account 2SV, backups and independent security review.

## Reproducing the audit

Run the commands in README with Node 22 and Java 21. Integration suites require FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 and refuse other targets. On this Windows machine, Java 21 was used with a process-only unavailable Unix-socket directory setting so the emulator used TCP; no host security control was disabled. GitHub CI runs the same isolated suite on Linux. Deployment credentials remain outside the repository.
