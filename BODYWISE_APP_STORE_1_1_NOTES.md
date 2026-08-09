# Bodywise Remedy 1.1 App Store Notes

Use this file when preparing the next TestFlight/App Store submission. Do not submit 1.1 until the live build has been tested on iPhone.

## Public URLs

- Marketing URL: https://bodywise-snowy.vercel.app
- Privacy Policy URL: https://bodywise-snowy.vercel.app/privacy
- Support URL: https://bodywise-snowy.vercel.app/support
- Terms of Use / EULA URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

If the production domain changes, update these URLs in App Store Connect before submitting.

## Discoverability Metadata

Use this metadata for the next App Store update so Bodywise Remedy can be found by people searching for the category, not only by people who already know the brand.

- App name: Bodywise Remedy Calisthenics
- Subtitle: Bodyweight Strength Coach
- Keywords: bodyweight,home workout,core,knee,strength,mobility,fitness,beginner,exercise,rehab
- Promotional text: Start with a safer daily bodyweight plan, then unlock your personal 4-week strength path.
- Description opening: Bodywise Remedy is a calisthenics and bodyweight training app that builds safer daily workouts around your goal, age, level, and body condition.

## Worldwide Availability Requirement

Bodywise Remedy should be available in every App Store country or region supported by Apple.

Before submitting or releasing a new version, confirm both of these settings in App Store Connect:

1. App availability
   - Go to App Store Connect → Apps → Bodywise Remedy → Pricing and Availability.
   - In App Availability, choose Manage or Set Up Availability.
   - Select All Countries or Regions.
   - Confirm the setting.
   - Keep the option enabled so the app is automatically available in new App Store countries or regions Apple adds in the future.

2. Subscription / In-App Purchase availability
   - Go to App Store Connect → Apps → Bodywise Remedy → Subscriptions.
   - Open the Bodywise Remedy Premium subscription group.
   - Check Bodywise Premium Monthly and Bodywise Premium Yearly.
   - Confirm each subscription is available in all countries or regions where Apple supports the App Store and In-App Purchases.

Apple currently describes App Store availability as 175 countries or regions. The app source code does not contain a country, region, locale, or geo-blocking restriction, so worldwide coverage depends on the App Store Connect availability settings above.

## Review Notes Draft

Bodywise Remedy 1.1 improves the app onboarding, Today dashboard, workout session player, Move Vault, progress tracking, and premium conversion flow.

Users can start without creating an account. The app asks lightweight setup questions such as training target, age range, sex, experience level, mood/body feel, and optional avoid areas so the workout can be adjusted on-device.

In this 1.1 build, workout preferences, session history, feedback, saved routine names, and movement replacement choices are stored locally on the user’s device. Bodywise Remedy does not enable Convex sync or server-side analytics in this version.

The app offers auto-renewable subscriptions through Apple In-App Purchase:

- Bodywise Premium Monthly: $6.99/month with a 7-day free trial
- Bodywise Premium Yearly: $59.99/year with a 7-day free trial

The subscription unlocks the 4-week strength path, weekly progression, broader replace-this-move alternatives, saved progress features, and the full premium coaching path. Apple’s standard EULA is linked in the app metadata.

Bodywise Remedy is a general fitness guidance app. It does not provide medical diagnosis, medical treatment, or emergency care. Users are told to stop if a movement causes sharp pain and to use gentler alternatives where needed.

## Privacy Position for 1.1

Current implementation: local-only.

Do not change App Privacy answers, privacy policy, or `ios/App/App/PrivacyInfo.xcprivacy` for data collection unless optional Convex sync/analytics is intentionally added.

If Convex analytics/sync is added later, complete all of the following before submission:

- Add clear in-app opt-in before sync.
- Update App Privacy answers in App Store Connect.
- Update the privacy policy.
- Update the iOS privacy manifest.
- Update App Review notes with exact data types and purpose.
- Confirm no sensitive health/medical data is collected unless truly necessary and properly disclosed.

## Manual iPhone QA Checklist

- Fresh install shows first-time Bodywise Setup.
- User can skip setup and still use Today.
- User can complete setup and start the first workout.
- Today shows one clear primary start action.
- Body Check opens and affects the workout pace.
- Adjust changes time/energy/quiet mode.
- Session video opens without overlay labels.
- Replace Move shows gentler/similar/stronger alternatives.
- Selecting an available replacement updates the current workout move.
- Locked premium replacements open the premium offer.
- Finish screen records face feedback locally.
- Progress tab updates sessions, feedback, confidence path, streak and next recommendation.
- Move Vault shows the full library and filters by movement family.
- Subscription modal shows $6.99 monthly, $59.99 yearly, 7-day free trial and restore purchase.
- Privacy, Support, Terms links work.
