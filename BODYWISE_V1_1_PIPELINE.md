# Bodywise Remedy 1.1 Post-Approval Pipeline

Status: in progress after Apple approved Bodywise Remedy 1.0.

Important guardrail: keep these changes local until we deliberately create a 1.1 TestFlight/App Store build. Version 1.1 remains local-only for user workout/profile/session state unless we intentionally add opt-in Convex sync and update App Privacy, privacy policy, iOS privacy manifest, and App Review notes.

## Objective

Turn Bodywise Remedy from a visually rich workout page into a guided personal-coach loop:

1. Tell Bodywise how your body feels.
2. Bodywise chooses a suitable calisthenics session.
3. User completes the workout with exact movement previews.
4. User gives simple post-workout feedback.
5. Bodywise adapts the next plan and makes progress visible.
6. Premium unlocks the structured 4-week path.

## Reference patterns from leading fitness apps

- Freeletics: short onboarding, training journey, coach adapts from feedback.
- Fitbod: plan settings, workout duration, recovery status, exercise variation, exclude/replace logic.
- Nike Training Club: strong visual workout library, programs for many levels, bodyweight options, achievement tracking.
- Caliber: clear start/log workout flow, flexible plans, progress tracking.

Bodywise should borrow the structure, not copy the products. Our angle is: body-aware calisthenics guidance with exact movement previews and safer alternatives.

## 1. First-Time Bodywise Setup

Trigger only when no local Bodywise profile exists.

Keep it short and friendly:

### Step 1: Main target

Options:

- Full body
- Enhanced core
- Knee strength
- Upper body
- Lower body
- Arm strength
- Mobility & Recovery
- No-jump Conditioning
- Balance & Posture
- Skill Prep
- Beginner Basics

### Step 2: Body context

Ask:

- Age range
- Sex
- Experience level

Keep this optional-feeling. No account required.

### Step 3: Today body check

Ask with face/tap controls:

- Mood
- Body feel
- Avoid today: None, Knees, Back, Wrists, Shoulders

### Step 4: Plan ready

Show:

- Strength path identity
- Today’s focus
- Duration
- Number of moves
- Pace
- First 3–4 moves
- Start first workout button
- Save and view dashboard button

## 2. Today Dashboard

Today should not be a landing page. It should be a command center.

Default visible structure:

1. Top summary: “Your plan is ready.”
2. Primary card: Today’s Plan
3. Command center:
   - Start workout
   - Body check
   - Adjust
   - Personalise
4. Today’s Focus card
5. First Move Preview card
6. Clear Movement Previews carousel
7. Premium conversion card, lower on page

Remove or demote from default view:

- Long “why it feels personal” sections
- Movement standard proof cards
- Routine Studio Lite
- Repeated stats/proof panels
- Any “tap area” instructional labels

Professional visual rule:

- Filled dark/lime button = main action
- Warm card with arrow = secondary action
- Muted flat card = information only
- Chevron/arrow means it opens or moves somewhere
- No arrow means the card is not interactive

## 3. Bottom Navigation

Final recommended tabs:

- Today: train now
- Plan: weekly/4-week structure
- Vault: learn exact movements
- Progress: habit, feedback, confidence path

Avoid showing Community until there is a real community product. A premature Community tab makes the app feel unfinished.

## 4. Move Vault

Purpose: keep movement learning out of Today.

Each move should open:

- Exact real-person movement preview
- Setup
- How to do it
- Coach notes
- Why it matters
- Progressions/regressions
- Train related moves button

Rule: never reuse a mismatched video for convenience.

## 5. Post-Workout Retention Loop

After a session:

Ask: “How did that feel?”

Options:

- Loved it
- Good
- Too easy
- Too hard
- Pain

Then show:

- Session completed
- Strength identity progress
- Next-session adaptation
- Premium 4-week path offer

Example premium moment:

“You completed your first Bodywise session. Want Bodywise to build your next 4 weeks?”

## 6. Version 1.1 Privacy and Compliance Requirements

Before shipping 1.1, confirm whether data remains local-only or syncs to Convex.

If data remains local-only:

- Keep App Privacy aligned with no collected server-side data.
- Privacy policy should clearly say data is stored on device unless user opts into sync.
- iOS privacy manifest remains minimal.

If optional Convex sync/analytics is added:

- Update App Privacy answers.
- Update privacy policy.
- Update `ios/App/App/PrivacyInfo.xcprivacy`.
- Add App Review notes explaining exactly what is collected and why.
- Add clear opt-in/consent message before any sync.
- Avoid collecting unnecessary personal or health-sensitive data.

Recommended 1.1 approach:

- Start with local-only first-time setup and feedback.
- Add a clear “Sync my progress” optional upgrade later if needed.
- Use Apple App Analytics first for early business metrics.

## 7. Revenue and Retention Logic

Free:

- First-time setup
- Daily starter workout
- Basic body check
- Limited move vault
- Basic progress identity

Premium:

- Full 4-week progression path
- Weekly difficulty adjustments
- Full movement vault
- Replace-this-move alternatives
- Saved routine history
- Goal-specific blocks
- Recovery/mobility routines

Pricing remains:

- Monthly: $6.99
- Yearly: $59.99
- 7-day free trial with payment details upfront
- No lifetime plan

## 8. Implementation Sequence After 1.0 Approval

1. Confirm Apple approval status.
2. Create version 1.1 working branch.
3. Add the new onboarding/data-flow code only after 1.0 approval is confirmed.
4. Implement first-time setup flow.
5. Refactor Today into command-center dashboard.
6. Replace Community tab with Vault tab.
7. Tighten Progress tab around habit loop and strength identity.
8. Keep data local-only unless we intentionally choose Convex sync.
9. Update App Privacy/privacy files if any data collection changes.
10. Run release audit and full production build.
11. Build iOS through GitHub Actions.
12. Upload to TestFlight.
13. Test on iPhone.
14. Submit 1.1 with clear App Review notes.

## 8A. Queued Code Task: Onboarding/Data Flow

Apple approval for 1.0 is complete. Local 1.1 implementation has started.

Once 1.0 is approved, add:

- `setupOpen` and `setupStep` state for first-time onboarding. ✅
- First-open detection when no `bodywise-profile` exists. ✅
- Four-step Bodywise Setup modal: ✅
  1. Main training target.
  2. Age range, sex, and experience.
  3. Mood, body feel, and areas to avoid.
  4. “Your plan is ready” summary.
- `completeSetup(startNow)` handler that saves the profile locally and optionally starts the first workout. ✅
- Clear local-only wording unless Convex sync is deliberately enabled. ✅
- No server transmission unless the privacy/App Store updates are completed first. ✅

## 8B. Local 1.1 Work Completed So Far

- First-time Bodywise Setup starts automatically for new users.
- Setup captures main goal, age range, sex, level, mood, body feel, and avoid areas without requiring an account.
- Setup can immediately start the first workout or save and return to the dashboard.
- Post-workout face feedback is saved locally and adjusts the next recommendation.
- Progress now shows sessions, estimated load, training time, feedback, next recommendation, and strength identity milestones.
- The dormant Community tab has been removed from the primary navigation in favor of Vault.
- Convex status probing has been removed from the app shell so the current 1.1 code does not introduce hidden server-side analytics.
- Customer-facing media badges such as real/loop/source labels have been hidden for a cleaner, more professional video presentation.
- Today has been redesigned as a compact app dashboard instead of a long landing page.
- The workout session now has clearer progress dots, next-move preview, save routine action, stronger form checks, and real movement replacement options.
- Replace-this-move now behaves like a coaching feature: available exact-movement alternatives can be selected, premium/future alternatives are clearly gated, and mismatched lookalike demos are not used.
- Move Vault now exposes the full movement library with family filters instead of only a small featured subset.
- Plan now shows a clear weekly rhythm, Today action, professional progression rules, and a stronger 4-week premium bridge.
- Progress now emphasizes visible confidence progress, streak, next unlock, and return motivation.
- Accessibility/tap-target polish was added with stronger focus states and clearer interactive controls.

## 9. Definition of Done for 1.1

- New user is not lost on first open.
- User can understand the next best action within 5 seconds.
- Today tab is short, useful, and action-led.
- Vault is clearly for movement learning.
- Plan is clearly for structure.
- Progress gives a reason to return.
- Premium appears after value is felt.
- Privacy disclosures match the actual implementation.
- No App Store review mismatch.
