# Wakad Circle diagnostics and fixes

Date: 7 November 2026, India. Reviewed both apps, device controls, sign-in, saved sessions, database rules, stock updates, checkout, order changes, payments, installation and dependencies. This is an application diagnostic review, not a certification of zero vulnerabilities or a PC-wide antivirus scan.

## Bugs fixed

1. **Owner notification control stayed visible after successful enrollment.** It now disappears after the backend accepts enrollment and on reopening when this account has browser permission, a remembered device enrollment and an active push subscription. Denied permission, missing subscriptions, changed accounts and blocked storage leave a safe retry path. Focus changes during enrollment cannot leave the completed button showing.
2. **Sound activation could reject without a handled error.** The control now hides only when AudioContext is running. Unsupported audio, denied playback and startup timeout are handled. If the browser suspends audio, the control returns; falsely remembering sound as active would silently mute incoming alerts. Browsers can require another user gesture after reopening.
3. **Notification enrollment could wait indefinitely.** Permission and provider token requests now time out with a retry message. Late completion or account changes cannot mark the wrong account's control enabled.
4. **UPI checkout accepted amounts that QR generation could not encode.** Server checkout, basket revisions and the frontend payment selector now agree on ₹1–₹1,00,000 for UPI. Sub-rupee pickup baskets remain available for cash. Invalid UPI requests fail before stock changes.
5. **Receipt matching rounded fractional paise.** Manual bank-confirmation input now rejects more than two decimal places rather than silently rounding it.
6. **Syntax checks skipped nested assets.** The checker now traverses application/test directories, including the vendored QR library, while excluding dependency directories. A new asset-reference test verifies shipped HTML references exist.

## Results

- **61 unit/static/session tests passed.** Coverage includes notification enrollment success/failure, account-change and focus races, permission/storage failures, audio suspension/unsupported audio, timeout recovery, UPI limits and receipt precision.
- **16 isolated Firestore integration tests passed.** Actual emulator rules and transactions cover account privacy, denied direct writes, reservation/idempotency, stale prices, concurrent inventory revisions, customer-approved replacements, cancellation, bank/cash verification records, refunds, bulk edits, paused store behavior and sub-rupee payment validation.
- **48 JavaScript files passed syntax checks**, including nested assets.
- Root and backend full npm dependency audits: **zero known vulnerabilities** at review time.
- Gitleaks working source scan: **no unallowlisted secrets**. Git history is scanned again after the release commit. Public Firebase configuration and the public Web Push key are intentional identifiers, not Admin credentials.
- Live security smoke checks verify canonical redirects, app installation assets, hosting headers, public catalog access, denied anonymous private reads and denied unsigned requests to all **18 callable functions**.
- Browser checks exercised customer search, cart calculations and free pickup, plus actual AudioContext activation and disappearance of the sound control. Console error/warning collection in those inspected views was empty. The notification enabled/disabled states and reopening behavior are also covered by isolated tests without forcing permission on a real phone.
- Cloud log review for 7 November returned one historical ERROR: the first notifyNewOrder deployment failed during Eventarc service-agent permission propagation. The subsequent deployment succeeded. No separate execution-time application exception was found in that returned result; this is a bounded log review, not proof that no error has ever occurred.

No real order was placed, accepted, rejected or paid as diagnostic test data. No bank transfer or SMS was used for these tests. Public catalog reads and signed-in read-only checks do not change stock or orders. Local test fixtures were confined to the explicitly isolated emulator project.

## Remaining limits

Push delivery still depends on real-device opt-in, browser/OS support, background restrictions and valid provider tokens. Permission alone is not treated as enrollment. Physical-phone push delivery, prolonged overnight retention, every bank app and external provider availability cannot be proven by unit/browser tests. Audio can require reactivation after suspension or reopening.

Direct UPI QR/intent collection has no bank verification channel. UTRs entered by customers and browser return links cannot prove bank receipt. The existing app deliberately requires merchant bank verification. Fully automatic settlement/reference collection requires an onboarded merchant bank or payment provider with server-verified status; no such paid integration was added.

App Check enrollment/enforcement and paid backup schedules remain off under the owner's low-cost demo preference. Existing authentication, private rules, server validation, rate limits and hosting policies remain active. The ₹100 monthly billing warning is an alert, not a spending cap; SMS and Blaze usage can incur charges.

No practical audit can guarantee absence of all unknown bugs, future advisories, malicious traffic or operating-system issues. The result is that the listed checks passed and the listed defects were fixed, with these limits retained for review.
