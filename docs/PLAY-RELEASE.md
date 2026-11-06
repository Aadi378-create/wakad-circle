# Google Play release readiness

Status: not published. The owner confirmed that no Play developer account exists yet. The installable web app is available without Play enrollment.

The most direct Android route is a Trusted Web Activity wrapper around the HTTPS Firebase-hosted PWA. Google documents Bubblewrap for this purpose. Most catalog and website changes can then be published to Hosting without an Android release. Android manifest, wrapper permissions, package identity, and native-code changes require a new app bundle.

Before generating and submitting a signed production bundle:

- The owner must create and verify a Play Console developer account and pay Google's US$25 one-time registration fee. Account registration, identity/payment verification, and developer agreements require owner participation.
- Supply the legal business/developer name, support email, customer privacy contact, and distribution details.
- Finalize and publish a privacy policy, retention policy, and in-app/web account-deletion request flow. Complete Google's Data safety declaration for phone numbers, names, addresses, orders, and Firebase authentication processing.
- Choose the Android application ID and create/secure the upload signing key. Keep signing passwords and private keystores outside GitHub. Do not fabricate a Digital Asset Links signing fingerprint.
- Generate the wrapper and Android App Bundle using the current supported Android SDK and target API requirements. This PC currently has Java 8 and no detected Android SDK; a current compatible JDK/Android toolchain is needed for a production build.
- Host `/.well-known/assetlinks.json` using the actual Play App Signing SHA-256 certificate fingerprint so domain verification succeeds.
- Prepare store icons, screenshots, a description, content rating, delivery/support terms, and release testing.
- New personal developer accounts require at least 12 testers opted in continuously for at least 14 days before applying for production access. Approval remains Google's decision.

Sources checked for this prototype:

- https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465

No production signing key, fake store listing, or placeholder asset-link certificate has been published.
