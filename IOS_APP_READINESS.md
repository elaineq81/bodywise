# Bodywise Remedy iOS / Xcode preparation

Bodywise Remedy is now configured for a Capacitor iOS wrapper.

## Current iOS approach

The current Bodywise Remedy app is a deployed web app with server-backed routing, so the iOS shell is configured to open the production Bodywise Remedy URL inside Capacitor's native iOS WebView:

https://bodywise-snowy.vercel.app

This is the fastest path to an Xcode-ready iPhone build while preserving the app that is already live.

## Commands

After cloning on a Mac with Xcode installed:

1. Install dependencies:

   npm install --legacy-peer-deps

2. Generate or refresh the iOS project:

   npm run ios:add
   npm run ios:sync

3. Open in Xcode:

   npm run ios:open

   On newer Capacitor projects, this opens the generated Xcode project at ios/App/App.xcodeproj.

4. In Xcode:

   - Select the App target.
   - Set your Apple Developer Team under Signing & Capabilities.
   - Confirm the bundle identifier: com.elaineq.bodywise
   - App icon, launch splash, and a starter privacy manifest are already included. Still confirm App Store privacy answers and StoreKit products before public submission.
   - Archive with Product > Archive, then upload through App Store Connect/TestFlight.

## App Store readiness notes

- Premium digital access inside the iOS app must use Apple In-App Purchase / StoreKit.
- The premium modal now calls Apple StoreKit through `capacitor-plugin-cdv-purchase` for the monthly and yearly subscription IDs. Checkout/restore only becomes active inside the installed iPhone/TestFlight app after the App Store Connect products and trial offers are approved for testing.
- Apple may reject apps that feel like thin website wrappers, so keep strengthening native-feeling polish such as app icon/splash clarity, StoreKit purchase flow, offline cached fallback, push-reminder opt-in, and/or HealthKit/wearable integration.
- The workout experience already has app-like value: guided sessions, timer, movement vault, local progress, body check, feedback, and real-person movement clips.

## Longer-term best version

For the most professional App Store version, convert the core workout experience into a fully packaged Capacitor bundle or React Native/Swift app, while keeping Convex for cloud sync and StoreKit for subscriptions.

## Cloud build option

If you do not have a Mac, use the GitHub Actions workflow in `.github/workflows/ios-cloud-build.yml`.

The first run can build an unsigned iOS Simulator app on GitHub's macOS runner. TestFlight upload is prepared, but it requires Apple signing and App Store Connect API secrets in GitHub.

## Privacy manifest

A starter `ios/App/App/PrivacyInfo.xcprivacy` is included and wired into the Xcode app target. It currently declares no tracking and no collected data. Update it before submission if Bodywise Remedy starts collecting account, health, analytics, advertising, or tracking data.


## Apple In-App Purchase product IDs

Create one auto-renewable subscription group in App Store Connect named `Bodywise Remedy Premium`, then create these products exactly:

- `bodywise_remedy_premium_monthly` — 1 month — USD 6.99 — 7-day free trial introductory offer
- `bodywise_remedy_premium_yearly` — 1 year — USD 59.99 — 7-day free trial introductory offer

The app uses `capacitor-plugin-cdv-purchase` with Apple StoreKit 2. Purchases and restore actions only work inside the installed iPhone/TestFlight app after these matching App Store Connect products are created and available for testing.
## Release readiness pass — July 31, 2026

The current source includes a release audit command:

```bash
npm run audit:release
```

The audit checks subscription IDs, 7-day trial copy, local retention/event tracking hooks, legal/support pages, removed customer-facing video build labels, approved movement media markers, Move Vault visual coverage, referenced local media assets, iPhone screenshot dimensions, and medical-safety wording.

Latest verified local checks:

- `npm run audit:release` — pass
- `npm run build` — pass
- `npm test` — pass
- `npx cap sync ios` — pass
- GitHub Actions manual TestFlight upload run `30619351183` — success

### Point 1–7 readiness map

1. Subscription readiness: StoreKit product IDs are wired in the app. Apple-side product approval, 7-day introductory offers, and Paid Apps Agreement/bank processing still need to be valid in App Store Connect before users can actually pay.
2. App Store assets: the iPhone 6.5 screenshot pack exists in `app-store-assets/ios-6.5/` and has been verified at 1242 × 2688.
3. Movement/video QA: the audit verifies 49 move definitions, 51 Move Vault entries, and 61 local media asset references.
4. Accounts/sync: the current app keeps progress, feedback, and lightweight events locally. Full login/cloud sync should be a later Convex/Auth release once the first paid version is accepted.
5. Analytics: lightweight local event hooks now record onboarding, goal selection, workout start/completion, feedback, paywall views, and purchase/restore attempts.
6. Review-risk control: public policy pages and app footer clearly say Bodywise Remedy is general fitness guidance, not medical care.
7. First-run conversion path: the app keeps free instant value first, uses a quick body check, then presents premium after value is felt.
