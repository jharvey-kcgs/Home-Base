# Home Base — App Store Connect / TestFlight Reference

Everything below is written to be copy-pasted directly into the relevant
App Store Connect fields once your account is active. Edit freely — this
is a starting point, not a final draft you're locked into. A few fields
(marked below) need a real value from you before this is usable as-is.

---

## 1. Basic App Information

**App Name**
```
Home Base
```

**Subtitle** (30 characters max — App Store only, optional for TestFlight)
```
Plans, Habits & Reminders
```
(25 characters)

**SKU** (an internal identifier only you see — any unique string works)
```
homebase-2026-001
```

**Primary Language**
```
English (U.S.)
```

**Bundle ID**
```
com.JHarvey.HomeBase
```
(This should already be selectable in App Store Connect once your Apple
Developer account and EAS have registered it — matches what's in
`app.json`.)

---

## 2. Beta App Description (TestFlight — shown to testers, not the public)

This is what your friends actually see in the TestFlight app before installing:

```
Home Base is a personal all-in-one hub for the things that are easy to
lose track of — plans, tasks, habits, reminders, and passing thoughts,
all in one place.

Six widgets sit right on your Home screen: Event Base for dates worth
remembering, Quote Base for a daily pick-me-up, Task Base for to-dos
sorted by priority and due date, Habit Base for daily progress and
yes/no tracking, Alert Base for real reminders, and Thought Base for
anything else on your mind.

This is an early build — appreciate any bugs, confusing screens, or
"this should really do X" feedback you run into. Shake your phone or use
TestFlight's "Send Beta Feedback" to send a report directly, screenshot
included.
```

---

## 3. What to Test (per-build notes — update this each time you submit a new build)

This is the one field you'll actually revisit for every future build, not
just the first one. First-build version:

```
First build! A few things worth specifically trying:

- Enter your name during onboarding — confirm the Home screen reads
  "<Your Name>'s Base"
- Try creating one of each widget type (an Event, a Quote, a Task, a
  Habit, an Alert, a Thought) and confirm it shows up correctly on Home
- Set an Alert a few minutes out with a notification and confirm it
  actually arrives
- Try linking a reminder to an Event ("Also set a reminder")
- Try Settings > Theme — Dark Mode, a different accent color, a larger
  font size
- Try Settings > Data — export a backup, then try restoring it
- If anything crashes, looks broken, or is confusing, TestFlight's
  feedback button is the fastest way to report it
```

---

## 4. Full App Description (App Store listing — only needed if this ever goes
public; not required for TestFlight-only distribution, but good to have
ready)

```
Home Base is a personal hub for the things that are easy to lose track
of — plans, tasks, habits, and passing thoughts — organized the way a
real day actually works, not as six separate apps.

YOUR HOME, PERSONALIZED
Enter your name once, and your Home screen becomes "<Name>'s Base" — a
single dashboard previewing everything that matters today: today's
events, a quote to start the day, your next few tasks, today's habit
progress, upcoming reminders, and your latest thoughts.

SIX WIDGETS, ONE PLACE
Event Base for dates worth remembering, with optional recurring
reminders. Quote Base for a library of quotes with a new random pick
each day. Task Base for to-dos sorted by priority and due date. Habit
Base for daily progress tracking and simple yes/no habits, with a full
history log. Alert Base for real reminders that actually notify you.
Thought Base for anything else worth jotting down.

MADE YOURS
Dark Mode, a choice of accent colors, and adjustable text size — all
built with real accessibility contrast checking, not just a color
picker.

PRIVATE BY DESIGN
No account, no login, no ads, no tracking, no server. Everything lives
on your device and stays there, with a real backup and restore system in
Settings if you ever want a safety net.
```

---

## 5. App Privacy (the "Privacy Nutrition Label" questionnaire)

This app has an unusually simple answer here, worth knowing going in:
**Home Base collects no user data at all.** No accounts, no analytics,
no backend, no network requests that send anything about you anywhere.
Everything — events, tasks, habits, alerts, thoughts, and settings — is
stored locally on your own device (AsyncStorage), never transmitted
anywhere.

When App Store Connect's privacy questionnaire asks "Do you or your
third-party partners collect data from this app?", the honest answer is
**No**. That collapses nearly the entire rest of that section automatically.

One thing worth double-checking before you submit: Habit Base lets
someone track things like water intake, sleep, or medicine taken. That
data never leaves the device either, but if Apple's questionnaire asks
specifically about health-*adjacent* data categories, answer based on
what's actually true (collected locally only, never transmitted) rather
than defaulting to "No data of any kind" — worth a careful read of that
specific question rather than speed-running it.

---

## 6. Support URL / Contact / Marketing URL — needs your real values

*(These are the fields League Base already had real answers for, since
that repo is public. Home Base doesn't have an equivalent yet — fill
these in before submitting, since Apple requires a working Support URL.)*

**Contact email**:
```
[your email here]
```

**Support URL**: Apple requires this — something publicly viewable
without a login, where a user (or Apple's reviewer) could theoretically
reach you or find basic info about the app. Options, roughly easiest to
most effort:
- A public GitHub repo for Home Base (like League Base already has) —
  works even with just this README in it
- A single static page (a free GitHub Pages site, a Notion page set to
  public, etc.)
- Not your personal email as a bare URL — Apple wants an actual page,
  not just a `mailto:`

**Marketing URL**: optional in App Store Connect — the same Support URL
works here too if asked; no need for a second page.

---

## 7. Age Rating / Content

No user-generated content shared with others (everything in Home Base —
tasks, thoughts, habit data — stays private to that one device), no
in-app purchases, no ads, no violence, no gambling-adjacent mechanics.
Should qualify for the lowest available age rating tier (4+) when App
Store Connect's content questionnaire asks — answer "No" across the
board for content categories, since none of it applies here.

---

## 8. Category

**Primary**: Productivity
**Secondary** (optional): Lifestyle
