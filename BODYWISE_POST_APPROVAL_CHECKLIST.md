# Bodywise Remedy Post-Approval Checklist

Use this only after Apple approves Bodywise Remedy 1.0.

## Do immediately after approval

- Confirm 1.0 is approved and available/ready for release. ✅
- Do not change the approved 1.0 metadata unless needed.
- Decide whether to release 1.0 immediately or hold for manual release if Apple permits.
- Create a 1.1 work branch/source checkpoint.
- Keep the approved 1.0 source/build available for rollback.

## 1.1 product work

- Add first-time Bodywise Setup. ✅
- Make Today a command center. ✅
- Keep the home page short and action-led. ✅
- Move movement learning into Vault. ✅
- Remove premature Community from bottom nav. ✅
- Improve Progress around: ✅
  - session count
  - strength identity
  - recent feedback
  - next recommendation
- Make premium appear after first session or meaningful preview. ✅
- Make movement replacement a real coaching action instead of a generic shuffle. ✅
- Expand Move Vault to all moves with movement-family filtering. ✅
- Strengthen Plan and Progress tabs so users understand what to do next and why to return. ✅
- Keep all new 1.1 profile, feedback, session and swap state local-only. ✅
- Preserve the existing App Privacy position until optional Convex sync is intentionally added in a later version. ✅

## Privacy decision before coding data sync

Choose one:

### Option A: local-only 1.1

Recommended first. Currently selected for the local 1.1 upgrade.

- Setup answers stay on device.
- Workout feedback stays on device.
- No Convex analytics yet.
- Lower privacy risk.
- Faster App Store 1.1 submission.

### Option B: optional Convex sync/analytics

Only if we are ready to update compliance.

Required:

- In-app opt-in message.
- App Privacy update.
- Privacy policy update.
- iOS privacy manifest update.
- App Review notes update.
- Data minimization review.

## App Store 1.1 notes draft

Bodywise Remedy 1.1 improves first-time setup, workout guidance, movement learning, and progress flow. Users can still start without creating an account. Workout setup and feedback are used to tailor the on-device workout experience. Bodywise Remedy remains a general fitness guidance app and does not provide medical diagnosis or treatment.

If Convex sync is not enabled, add:

Workout preferences and feedback are stored locally on the user’s device in this version.

If Convex sync is enabled, replace that with a precise disclosure of what is transmitted and why.

## Final validation before 1.1 submission

- Test first open with no saved profile.
- Test returning user with saved profile.
- Test Start Workout.
- Test Body Check.
- Test Personalise.
- Test Adjust.
- Test Vault move modal.
- Test Finish Workout feedback.
- Test premium modal.
- Test Replace Move inside a live session.
- Test locked premium alternative path.
- Test Apple purchase products in TestFlight.
- Confirm app availability is set to All Countries or Regions in App Store Connect.
- Confirm both auto-renewable subscriptions are available in all supported countries or regions.
- Run release audit.
- Run full production build.
- Build iOS in GitHub Actions.
- Upload to TestFlight.
- Test on iPhone.
- Submit with updated notes.
