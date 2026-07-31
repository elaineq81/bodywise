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
- The current premium modal is a product preview, not a real payment flow.
- Apple may reject apps that feel like thin website wrappers, so before App Store submission Bodywise Remedy should add native-feeling polish such as proper app icon/splash, StoreKit purchase flow, deep links, offline cached fallback, push-reminder opt-in, and/or HealthKit/wearable integration.
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
