# Wakad Circle prototype audit

Date: 6 November 2026. Scope: authored application source, Git history, production dependency lockfile, Firebase rules/functions, public hosting configuration, mobile browser layout, and deployment/access boundaries. This is an engineering prototype audit, not an independent penetration-test certification or a guarantee that no vulnerability exists.

## Result

No unresolved critical or high findings were identified in the reviewed scope. The dependency scan reports **zero known vulnerabilities** after remediation. Gitleaks reports no secret findings in the authored working tree or the four-commit pre-audit source history. One exact public Firebase web API identifier is documented in the scanner allowlist; Admin keys, CLI tokens, OTPs and signing keys are not part of the source.

## Findings corrected

| Finding | Correction and evidence |
| --- | --- |
| Existing hosting was owner-private and awkward for other devices | Deployed a public HTTPS Firebase Hosting storefront while preserving the older Sites audience. Backend authorization remains enforced separately. |
| Eight moderate dependency findings in the older Firebase Admin dependency graph | Updated to firebase-admin 14.5.0 / firebase-functions 7.4.0. An explicit rimraf 6.1.4 override removes vulnerable transitive glob/minimatch dependencies. Final npm audit: 0 known findings. Lockfile is committed for reproducibility. |
| Earlier interrupted deployment left the price-write service without callable transport permission | Repaired Cloud Run invoker policy. Live anonymous calls now reach Firebase's authentication guard and return UNAUTHENTICATED; they cannot write data. |
| Stale inventory forms could overwrite stock deducted by another order | Product writes now use a transaction and expected revision. Checkout increments the revision; an outdated inventory form is rejected with a refresh message. An automated regression test covers revision conflict handling. |
| Malformed request edge cases could produce internal errors | Added null checks, finite MRP validation, status ID bounds, and negative/fractional quantity rejection. |
| Repeated accepted orders could create unbounded writes per account | Added a server-side per-user five-orders-per-minute limit. Idempotent retries return the existing order before consuming the limit. |
| Client values could not be trusted for checkout pricing | Server derives line prices from Firestore and atomically decrements stock; client-provided prices are ignored. |
| Cross-device or offline UI could imply a successful unsaved operation | Live writes await Firebase. Service worker caches only the interface, excludes cross-origin APIs and all mutation requests, and displays an offline notice. |
| Missing hosting hardening and release checks | Added nosniff, frame denial, referrer and device-permission headers, service-worker no-cache headers, and a CI workflow with pinned action revisions and read-only repository permissions. |
| Local demo server could terminate on a malformed encoded path and served install assets with the wrong MIME type | Added bounded path decoding and explicit MIME types. An HTTP regression test verifies malformed/traversal rejection and successful manifest/icon delivery. The development server stays bound to loopback. |

## Verification

- **13 automated tests passed:** phone-account guards, customer/admin role boundaries, malformed requests, ₹199/₹200/₹201 delivery boundaries, server price calculation, insufficient stock, duplicate lines, invalid quantities, delivery PIN, MRP bounds, order rate-window reset, stale inventory revision rejection, manifest/icon validity, local-server HTTP path handling, API cache exclusion and offline shell fallback.
- JavaScript syntax check passed across app/backend/scripts/tests.
- Live smoke check passed: HTTPS site and install assets return success; security headers are present; shared product catalog is readable; anonymous order reads return 403; all four write callables reject anonymous callers with UNAUTHENTICATED.
- Phone-sized browser check: document width matches the viewport without horizontal document overflow. Live catalog search/cart controls work and a ₹223 basket shows free delivery. Laptop layout was restored and checked.
- The owner confirmed a real phone OTP sign-in earlier in the session.
- The guided presentation flow was walked through, including the sample inbox and a price update/restoration.
- Gitleaks 8.30.1 was downloaded from its official GitHub release and SHA-256 checked against the release checksum file. Working-tree and history scans use redacted output.

## Access reviewed

- Firebase products permit public reads; direct client writes are denied.
- Orders are readable only by their signed-in owner or the approved shopkeeper.
- Every callable write requires a phone-associated authenticated account; administrative operations additionally require a server-issued shopkeeper claim.
- The service transport is publicly invocable by design so the browser SDK can call it. Transport permission does not grant catalog/order write permission.
- The approved shopkeeper account is configured. Its complete phone number is not written into the source or this report.
- GitHub repository is private. Firebase/GitHub provider account settings beyond this app were not broadly changed or scanned.

## Remaining limits and release work

1. **Physical phone/laptop synchronization is not yet owner-tested.** The owner chose to test later. Browser-responsive checks and Firebase shared reads passed, but this is not a claim of testing every Android/iOS device.
2. **Real authenticated checkout and order-status updates were not fully exercised as an end-to-end purchase on a physical phone.** Authorization and pricing tests passed; complete a controlled acceptance order before operating the shop.
3. **Google Play release is blocked by prerequisites:** no developer account exists, no production Android signing/bundle has been generated, and store privacy/Data safety/account-deletion/verification/testing work remains. See PLAY-RELEASE.md.
4. **Billing is usage based.** Phone Auth still needs Firebase's quota/fraud controls. reCAPTCHA and client resend cooldown do not constitute a hard SMS spending cap. App Check enforcement and budget alerts are recommended before broad promotion; they were not silently added to the account.
5. **Prototype scope:** cash on delivery, one shop, one delivery PIN, no payment gateway, returns/refunds, tax invoice generation, delivery dispatch integration, or customer account-deletion workflow. Finalize business/privacy/retention details before a production/store release.
6. **Catalog scaling:** the current prototype subscribes to the catalog collection. Introduce pagination/search indexing and bounded order queries before a large multi-thousand-product or high-volume rollout.
7. The local PC has Node 24 while the deployed backend/CI target Node 22. Automated source tests ran locally; cloud deployment provides the Node 22 execution environment. A physical-device acceptance pass and broader concurrency/load test remain separate work.

Evidence files are available locally under `outputs/`; this report is committed with the reviewed source. No system-wide PC security audit or inspection of unrelated personal files was performed.

## Update audit — Wakad Circle (6 November 2026)

This section supersedes the original ₹200 shipping policy above. Current delivery is ₹25 below ₹499 and free at ₹499; pickup is always free with no minimum. The separate shopkeeper portal, private multi-address book and pickup ETA flow were reviewed.

- 22 automated tests cover the original security boundaries plus delivery boundaries, pickup validation and server pricing, private address ownership, address count limit, order state transitions, stock restoration exactly once, and idempotent pickup checkout. The browser policy regression test checks strict script restrictions and absence of inline event handlers.
- Browser demo verification: save Home and Work; choose Home; ₹223 basket has ₹25 delivery; switch to free pickup, choose 45 minutes, submit; separate portal receives a popup; accept, prepare and mark ready; customer view updates across tabs. A phone-width portal layout was inspected. These are browser/demo checks, not a real phone purchase.
- Live smoke: shared catalog works, anonymous reads of orders and addresses return 403, all six callable endpoints reject anonymous requests. Server-side function tests use transaction mocks and do not replace a real authenticated acceptance order.
- Added CSP allowing only required origins, blocking inline scripts/event handlers and embedding; removed inline click attributes and escaped product emoji rendering. Added HSTS and explicit callable-origin allowlist. Firebase manages hosting infrastructure; no separate WAF/Cloud Armor or PC antivirus was installed.
- Dependency audit reports zero known production dependency vulnerabilities. Secret scanner results are recorded locally in `outputs/`. This is not a guarantee against future vulnerabilities or a whole-PC malware audit.
- Remaining: exact pickup street address, physical-device acceptance, real authenticated address/checkout/status pass, App Check registration/metrics/enforcement rollout, budget alerts and independent penetration testing. New-order alerts require the portal to remain open; optional sound requires a user click. No Play Store registration is planned.

## Brand migration verification

Canonical Hosting site and repository renamed to Wakad Circle. The existing cloud data project was retained; only mutable display names, hosting origin, auth domain, permitted origins, package names, docs and service-worker branding changed. The old public origin redirects to the new origin, including the shopkeeper path. Auth domains were added without changing the approved shopkeeper claim or existing data rules. Phone sign-in on the new domain requires user acceptance testing; no OTP or customer data was manufactured to claim this test. Reinstalling the PWA from the new origin is required for a clean installed-app migration.

## Direct UPI audit update

29 automated tests passed, adding exact-amount INR URI construction, invalid amount/reference rejection, unverified customer claims, cross-account order protection, receipt reference reuse prevention, exact bank amount confirmation, idempotent receipt recording, and late-payment/refund state checks. Existing phone/admin guards cover both new callables. Private payment receipt records use the default-deny Firestore rules.

The customer's uploaded QR was decoded locally and matched the provided VPA. A newly generated ₹249.50 QR was independently decoded with OpenCV and exactly matched the constructed UPI URI. Browser demo checks covered checkout → store acceptance → payment reference submission → pending bank check → merchant confirmation → customer paid label, and custom amount entry. Demo payment links are disabled; no real transfer was made or asserted. Real phone UPI-app handling, beneficiary display name and Axis merchant-account terms require owner acceptance testing.

The amount is pre-filled, not cryptographically locked by a bank. Full order amount verification is required server-side when recording receipt. Refund records require an external refund first; no automated money movement occurs. The local QR generator is vendored from the pinned npm package, with integrity and MIT notice in THIRD-PARTY.md; it sends no QR payload to a third-party QR service. Production dependency audit reports zero known vulnerabilities. Secret scan results are under outputs/. This does not make the app an independently certified payment gateway.
