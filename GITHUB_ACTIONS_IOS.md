# Bodywise iOS cloud build with GitHub Actions

Bodywise can now be built on GitHub's macOS runner without owning a Mac.

The workflow is here:

`.github/workflows/ios-cloud-build.yml`

## What works immediately

Every push to `main`, pull request, or manual run will:

1. Start a GitHub-hosted macOS runner with Apple's current Xcode generation.
2. Install Bodywise dependencies.
3. Build the web app.
4. Sync the Capacitor iOS project.
5. Build an unsigned iOS Simulator app.

This proves the Xcode project compiles in Apple's macOS environment.

## What requires Apple secrets

Uploading to TestFlight requires Apple signing and App Store Connect API values.

Add these in GitHub:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Required secrets:

- `APPLE_TEAM_ID`
- `APPSTORE_KEY_ID`
- `APPSTORE_ISSUER_ID`
- `APPSTORE_PRIVATE_KEY`

Use the Bundle ID already configured for Bodywise:

`com.elaineq.bodywise`


## Manual signing fallback for TestFlight

If automatic signing fails in GitHub Actions, add these extra repository secrets once:

- `IOS_DISTRIBUTION_CERTIFICATE_BASE64` — Base64 text of the Apple Distribution `.p12` certificate.
- `IOS_CERTIFICATE_PASSWORD` — the password used when exporting the `.p12` certificate.
- `IOS_PROVISION_PROFILE_BASE64` — Base64 text of the App Store Connect `.mobileprovision` profile for `com.elaineq.bodywise`.

This is the most stable no-Mac setup: GitHub imports the certificate/profile into the temporary macOS runner, signs Bodywise, exports the IPA, then uploads it to App Store Connect/TestFlight.
## How to run the first cloud build

1. Open GitHub.
2. Go to `elaineq81/bodywise`.
3. Open the `Actions` tab.
4. Select `Bodywise iOS cloud build`.
5. Click `Run workflow`.
6. Leave `Upload to TestFlight` off for the first run.
7. Confirm the simulator build passes.

## How to upload to TestFlight later

Only after the Apple secrets are added:

1. Go to the same workflow.
2. Click `Run workflow`.
3. Turn on `Upload to TestFlight`.
4. Start the workflow.
5. Wait for Apple to process the uploaded build in App Store Connect.

The first processed build can then appear under:

`App Store Connect` → `Bodywise` → `TestFlight`

## Important limitations

- GitHub can provide the macOS machine, but Apple still controls signing.
- The Apple Developer app on iPhone cannot upload the build by itself.
- If Apple's automatic signing does not create the distribution profile from the API key, the next fallback is manual signing with a certificate and provisioning profile stored as GitHub secrets.
- The current Bodywise iOS shell opens the live Bodywise web app. Before paid App Store launch, add StoreKit/In-App Purchase for premium access.
