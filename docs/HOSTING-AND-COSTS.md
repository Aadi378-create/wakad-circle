# Hosting permissions and operating estimate

Prepared 6 November 2026. This is a planning estimate for provider charges, not a fixed-price vendor contract or development-services invoice. Taxes, currency conversion, traffic, location and provider pricing can change.

## Access checked

| Component | Access |
| --- | --- |
| Existing ChatGPT Sites deployment | Owner-private; one owner, no groups or external viewers |
| Firebase Hosting storefront | Public HTTPS website suitable for phone and laptop browsers |
| Product catalog | Public reads; writes through shopkeeper-authorized server functions |
| Orders | Signed-in customer reads their own orders; shopkeeper reads/manages shop orders |
| Cloud Functions | Public invocation transport; verified phone authentication inside every write handler; shopkeeper claim for administrative actions |
| GitHub | Private repository; no public source release requested |

## Published provider prices

| Item | Current published rate |
| --- | --- |
| Firebase Hosting | 10 GB storage and 360 MB/day transfer included; then US$0.026/GB storage and US$0.15/GB transfer |
| Firestore Standard | Included allowances: 1 GiB stored data, 50,000 reads/day and 20,000 writes/day; excess depends on database region |
| Cloud Functions | Up to 2 million invocations/month included, subject to CPU, memory, build, network, and regional charges |
| India Phone Auth SMS | US$0.07 per billable SMS; published Identity Platform pricing includes the first 10 SMS/day at no charge |
| Google Play enrollment | US$25 once, paid to Google; developer verification and release eligibility are separate |

For a small pilot, provisionally budget **US$0–10/month for hosting/database/functions, plus billable SMS**. This is an estimate, not a spending cap. Billing budgets alert rather than automatically stop usage. The project uses scale-to-zero functions with maxInstances=5 and a seven-day container-image cleanup policy.

Example: if 1,000 India OTP messages are spread over 30 days with at least 10 messages on every day, approximately 700 are billable: **700 × US$0.07 = US$49** for SMS. Adding a US$0–10 infrastructure allowance gives approximately **US$49–59/month**, before tax. Resends count as messages. Staying signed in reduces repeated OTP requests. Different daily distribution changes the free allowance.

No custom domain purchase is needed for `wakad-kissan.web.app`; Firebase supplies HTTPS. A branded domain, if later chosen, has a separate registrar price.

Sources:

- https://firebase.google.com/pricing
- https://cloud.google.com/identity-platform/pricing
- https://support.google.com/googleplay/android-developer/answer/6112435

The actual project billing dashboard is the source of truth for invoices. This review did not establish a monthly spend cap or accept additional paid contracts.

## India planning quote

Using **₹95 per US$1 as a rounded budgeting assumption**, not a bank/FX quote:

| Scenario | Planning estimate before tax/conversion fees |
| --- | --- |
| Small pilot infrastructure, excluding SMS | ₹0–950/month |
| Each billable India OTP message | about ₹6.65 |
| 1,000 OTP messages/month spread over 30 days as above, including infrastructure allowance | about ₹4,655–5,605/month |
| Google Play registration | about ₹2,375 once (US$25 converted at the assumption) |

The Google Cloud INR SKU/invoice and actual card conversion determine the final rupee amount. The no-cost Firebase subdomain is sufficient for the prototype. These figures exclude delivery staff, payment gateway fees, registrar purchases, maintenance labor, and future Android build/signing work. A production quote needs expected OTP volume, product count, customer visits and orders per day.
