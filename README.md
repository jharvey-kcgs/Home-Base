# Home Base — Developer Guide & Documentation

*A solo-built project — this doc serves as both working documentation for
myself (commands, gotchas, decisions, what's still open) and an overview
for anyone else looking at the repo.*

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install](#2-install)
3. [Running the dev server](#3-running-the-dev-server)
4. [What's here — project structure](#4-whats-here--project-structure)
5. [Notifications & badge behavior](#5-notifications--badge-behavior)
6. [Color accessibility](#6-color-accessibility)
7. [Known setup gotchas](#7-known-setup-gotchas)
8. [TestFlight / Release readiness](#8-testflight--release-readiness)
9. [Roadmap (genuinely open, not yet built)](#9-roadmap-genuinely-open-not-yet-built)

Home Base is a personal all-in-one app — a Home screen made of six
widgets (Event Base, Quote Base, Task Base, Habit Base, Alert Base,
Thought Base), each with its own dedicated screen for adding, editing,
and deleting entries, plus a Settings area covering Profile, Theme,
Notifications, Data (backup/restore/reset), About, and FAQ.

Built with React Native + Expo, developed entirely on Windows — no Mac
required at any point, including getting to TestFlight. Everything runs
and stores locally on-device; there's no account, no backend, and nothing
this app collects or transmits about you.

**What's actually in here, for anyone skimming this for the first time:**
- Six independent widgets, each following the same add/edit/delete
  pattern (see [Section 4](#4-whats-here--project-structure)), previewed
  live on the Home screen
- A personalized Home screen — asks for a name on first launch, reads
  "*Name*'s Base" from then on
- Real local notifications for Alert Base, including calendar-accurate
  recurrence and an honestly-designed badge system (see
  [Section 5](#5-notifications--badge-behavior))
- Full theming — Dark Mode, a choice of 10 accent colors, and 3 font
  sizes, all backed by real WCAG contrast math rather than a guess (see
  [Section 6](#6-color-accessibility))
- A complete local backup system — export, import, and a two-step-confirm
  full reset, all in Settings → Data

**Where this stands right now:** every screen has been individually
tested, including a full round of bug-fixing across notifications, badge
behavior, dark mode, and theming. A `npx tsc --noEmit` pass across the
whole project currently returns zero errors. What's left is mostly
TestFlight logistics (Apple Developer Program enrollment, `eas build`,
TestFlight distribution — tracked in
[Section 8](#8-testflight--release-readiness)) plus one open item from
the accessibility pass (VoiceOver labeling, not yet started).

---

## 1. Prerequisites

- **Node.js 20 LTS — `20.20.2` specifically.** Not 22, not 24, not
  whatever the newest release is. See
  [Gotcha #1](#gotcha-1-node-version) below for exactly why — a newer
  Node crashes the dev server outright.
- [VS Code](https://code.visualstudio.com) (or any editor)
- The **Expo Go** app on an iPhone, from the App Store — lets you preview
  the app live during development with no build step. See
  [Gotcha #4](#gotcha-4-expo-go-sdk-mismatches) if it refuses to load the
  project.
- An **Apple Developer account** ($99/year) once you're past local
  testing and moving toward TestFlight — see
  [Section 8](#8-testflight--release-readiness).

**Installing Node 20.20.2 exactly (recommended — via Chocolatey):**

Pinning the exact version avoids any ambiguity about which Node 20.x
patch you end up with. Install Chocolatey first (skip if already
installed):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install the exact Node version:

```powershell
choco install nodejs --version="20.20.2"
```

**Alternative — direct download:** grab the **LTS** installer from
[nodejs.org](https://nodejs.org) instead (not **Current**). Won't pin the
exact patch version, but any Node 20.x behaves the same as `20.20.2` for
this project.

Confirm either way with:

```powershell
node -v
```

If you ever need to switch between Node versions across different
projects, [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
does that without reinstalling each time (`nvm install 20`, `nvm use 20`).

**One more one-time Windows setting worth turning on** — this project's
dependency tree nests deep enough to occasionally exceed Windows'
default file path length limit. Run this once, in an **Administrator**
PowerShell window, then restart your terminal:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

---

## 2. Install

```powershell
cd Home-Base
npm install
```

`package.json` already lists every dependency this project needs, so a
plain `npm install` pulls all of them in one shot. **If it throws
`ERESOLVE` errors**, see
[Gotcha #2](#gotcha-2-eresolve-peer-dependency-errors) below.

### What's actually installed, and why

| Package | What it's for |
|---|---|
| `expo`, `react`, `react-native` | Core framework |
| `@react-navigation/native`, `@react-navigation/native-stack` | Screen navigation |
| `react-native-screens`, `react-native-safe-area-context` | Required by React Navigation |
| `@react-native-async-storage/async-storage` | All local data storage — the entire app's data layer runs on this |
| `@react-native-community/datetimepicker` | Date/time pickers (Event Base, Task Base, Alert Base, Vacation Mode) |
| `@react-native-community/slider` | Habit Base's Progress sliders |
| `react-native-get-random-values`, `uuid` | Generates unique IDs for every stored item |
| `expo-notifications` | Local notifications for Alert Base — see [Section 5](#5-notifications--badge-behavior) |
| `expo-font`, `@expo-google-fonts/playfair-display` | The app's Playfair Display typeface |

If you ever need to add a **new** native dependency, always use
`npx expo install <package>` rather than plain `npm install` — it picks
the exact version compatible with the current Expo SDK, which matters a
lot (see [Gotcha #2](#gotcha-2-eresolve-peer-dependency-errors)).

---

## 3. Running the dev server

```powershell
npx expo start
```

Scan the QR code with the iPhone's Camera app — it offers to open in
Expo Go, and the app runs live on the phone. Saving any code change shows
up in about a second; this is the entire development loop, no build step
involved.

---

## 4. What's here — project structure

```
App.tsx                          Navigation entry point, ThemeProvider,
                                  font loading, first-launch onboarding
                                  gate, and the app-wide badge-clearing
                                  listeners (see Section 5)

screens/
  HomeScreen.tsx                  The dashboard - all 6 widget previews,
                                   personalized title ("<Name>'s Base")
  OnboardingScreen.tsx            First-launch name entry, then an
                                   optional "want a quick tour?" prompt
                                   that links straight into About

  EventsScreen.tsx                Event Base    (widget 1)
  QuotesScreen.tsx                Quote Base    (widget 2)
  TasksScreen.tsx                 Task Base     (widget 3)
  HabitsScreen.tsx                Habit Base    (widget 4)
  AlertsScreen.tsx                Alert Base    (widget 5)
  ThoughtsScreen.tsx              Thought Base  (widget 6)

  SettingsScreen.tsx              Settings nav list
  ProfileSettingsScreen.tsx       Name
  ThemeSettingsScreen.tsx         Dark Mode, Font Size, accent color
  NotificationSettingsScreen.tsx  Enable/disable, Vacation Mode
  DataSettingsScreen.tsx          Backup export/import/reset
  AboutScreen.tsx                 What each widget does, how editing works
  FAQScreen.tsx                   Common questions, split out from About
                                   as its own Settings page

lib/
  storage.ts                      Every piece of data logic - one
                                   function per action (addEvent,
                                   toggleTaskDone, getHabitReport, etc.)
                                   Read this file first to understand the
                                   data model.
  notifications.ts                Schedules/cancels local notifications,
                                   badge logic, permission handling - see
                                   Section 5 before touching this file
  theme.tsx                       App-wide theme via React Context -
                                   colors, dark mode, font scale,
                                   accentReadable - see Section 6
  responsive.ts                   iPad/tablet width-scaling helper used
                                   by every screen

types/models.ts                   Every TypeScript type and shared
                                   constant. Add a field here first when
                                   changing what an item stores.

components/
  AppText.tsx                     Drop-in replacement for RN's <Text> -
                                   auto-applies the Font Size setting and
                                   a default readable text color. Every
                                   screen imports Text from here, not
                                   from 'react-native'.

assets/
  icon.png                        App icon (1024x1024, no transparency)
```

### Where to make common changes

- **Change what a widget does or how it looks** → its screen file in
  `screens/`
- **Change what data an item stores** → add the field in
  `types/models.ts`, then add/update the matching function in
  `lib/storage.ts`
- **Change global colors, dark mode, or the accent system** →
  `lib/theme.tsx`
- **Change notification or badge behavior** → `lib/notifications.ts` —
  read [Section 5](#5-notifications--badge-behavior) first, several
  design decisions here look "wrong" until you know why
- **Change onboarding** → `screens/OnboardingScreen.tsx` and the gating
  logic in `App.tsx`'s `RootGate` component

---

## 5. Notifications & badge behavior

Alert Base schedules real local notifications via `expo-notifications` -
no backend, no push service. A few things about how this actually works
are worth knowing before changing anything in `lib/notifications.ts`:

**Recurrence uses calendar-accurate triggers.** Daily/weekly/monthly/
yearly repeats use Expo's `SchedulableTriggerInputTypes.DAILY` /
`WEEKLY` / `MONTHLY` / `YEARLY`, not a fixed-seconds repeat interval -
the latter would slowly drift from the actual calendar date over time
(a "yearly" reminder firing 365 days after whenever it happened to be
scheduled, not on the real anniversary).

**Permission is requested contextually, not on app launch.** Asking
immediately, before someone's seen anything, tends to get an automatic
"no." Instead, permission is requested the first time someone actually
sets up a notification (an Alert, or an Event's linked reminder). If
they'd already said no, the item still saves - a warning just points
them at Settings → Notifications instead of failing silently.

**Nothing schedules a notification without telling you, if it can't.**
`getAlertScheduleWarning()` checks two things before scheduling: whether
a "Notify" offset was actually picked, and whether the computed fire
time (alert time minus the offset) is already in the past. Either case
shows a plain-language warning instead of silently saving a reminder
that will never fire - this was a real bug, found and fixed after
testing showed alerts that looked correctly configured but never
notified.

**"None" was removed as a notify option on purpose.** Alerts exist to
alert you - a silently non-notifying "None" option was the actual root
cause of the bug above, and just confusing on top of that. Every timed
alert now defaults to "At the time" (0 minutes before) and always
notifies unless explicitly marked All Day.

**Events can auto-create a linked Alert.** The "Also set a reminder"
toggle in Event Base creates a real, separate Alert Base entry, editable
independently, that inherits the *event's own recurrence* - not an
assumption like "birthday = yearly." Editing or deleting the event keeps
the linked alert in sync automatically.

**The badge is intentionally a flat `1`, not a count.** This deserves
its own explanation because it looks like it could be "more correct,"
and isn't, for a real platform reason: local (non-push) notifications
have to be given a fixed badge number *at the moment they're scheduled*,
not when they actually fire. If several alerts are scheduled in advance
(the normal case - "remind me at 2, 3, and 4 o'clock," all set up in one
sitting), each one reads the same starting badge number, since none of
them have fired yet to change it. Multiple approaches were tried and
disproven by real device testing - counting scheduled notifications
(polluted by recurring alerts and stale test data), a separately-tracked
counter (drifted out of sync with the real device badge), and reading
the live badge count at schedule time (worked only if each alert was
created *after* the previous one had already fired, which isn't how
anyone actually uses a reminders app). A precise running count is
achievable on platforms like Teams or LinkedIn because a live server
computes it in real time at the moment of send - there's no equivalent
for a scheduled local notification with the app closed. Rather than show
a number that can be wrong, every alert sets the badge to a constant `1`
("something's waiting"), and clearing is handled thoroughly: on cold
launch, on returning to the foreground, and on receiving a notification
while already inside the app (all three needed - confirmed via testing
that any one alone leaves a gap).

---

## 6. Color accessibility

The app supports a user-selected accent color (10 options, including
White and Black) across both Light and Dark mode - which means the same
color has to stay legible in combinations that were never individually
designed for. A real WCAG audit (not a visual guess) found every single
accent color failed AA contrast (4.5:1) in at least one mode when used
as plain text, and the black-vs-white text-on-button picker was using a
crude brightness formula that was picking the *wrong* option for four
colors. The fix, in `lib/theme.tsx`:

- **`accentText`** - text sitting on top of a *filled* accent background
  (an active chip, a filled button). Picks whichever of black/white has
  the actual higher WCAG contrast ratio against that specific accent,
  not a brightness estimate.
- **`accentReadable`** - the accent color used as *plain text* on the
  screen's own background (back links, "•••" menus, Save buttons,
  badges). If the raw accent color doesn't hit 4.5:1 against the current
  background, this walks its HSL *lightness* up or down (preserving hue)
  until it does - so "Yellow" picked as an accent still reads as
  recognizably yellow, just a shade deep enough to actually be legible,
  rather than falling back to a generic black or white.
- **`accent`** stays the user's true, unmodified color choice - used for
  fills, swatches, and the habit slider tint, where contrast against a
  fixed background isn't the concern.

All 30 real combinations (10 colors × Light/Dark plain-text × button-fill
text) were verified passing after this fix, not just spot-checked.

**Still open**: a VoiceOver labeling pass (icon-only buttons like the
flower/house/"•••" currently rely on their visible glyph, with no
`accessibilityLabel`) and a check against iOS's own system-level "Larger
Text" accessibility setting, which can go further than this app's own
Large font tier. Neither has been started yet.

---

## 7. Known setup gotchas

Real issues hit during development, kept here so nobody has to
rediscover them from scratch.

### Gotcha #1: Node version

Node 22+ enabled experimental automatic TypeScript stripping. Some Expo
packages ship `.ts` source files, and Node refuses to strip types for
anything inside `node_modules` - hard crash on `npx expo start`:

```
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is
currently unsupported for files under node_modules
```

Fix: Node 20 LTS specifically. See [Section 1](#1-prerequisites).

### Gotcha #2: ERESOLVE peer dependency errors

If `npm install` refuses to resolve the dependency tree, create a
`.npmrc` file in the project root:

```
legacy-peer-deps=true
```

Safe here - Expo's own installer (`npx expo install`) validates the
actual version set independently.

### Gotcha #3: Don't develop inside OneDrive

If the project folder lives inside a OneDrive-synced directory, OneDrive
tries to sync `node_modules` (tens of thousands of small files) while
npm writes to it - random "file not found" / "directory not empty"
errors, especially deleting `node_modules` to reinstall clean. Keep the
project somewhere plain, like `C:\Development\Home-Base`.

### Gotcha #4: Expo Go SDK mismatches

Apple's App Store review queue for the Expo Go app itself often lags
behind Expo's latest SDK release by several versions. "Project is
incompatible with this version of Expo Go" usually means the project's
SDK is newer than what's currently on the App Store, not a setup
mistake. Fix: `npx expo install expo@<older-version> --fix` to step the
project back to whatever SDK the App Store's Expo Go currently supports.
This project currently targets **SDK 54** for exactly this reason.

### Gotcha #5: TypeScript files with JSX need `.tsx`, not `.ts`

Any file with JSX syntax (`<Component>` tags) must use `.tsx`.
`lib/theme.tsx` is named that way specifically because it renders a
`<Context.Provider>` - naming it `.ts` produces a build error the moment
JSX shows up in an otherwise-plain-logic file.

### Gotcha #6: `npm` ENOENT on `AppData\Roaming\npm`

```
npm error enoent ENOENT: no such file or directory, lstat
'C:\Users\<you>\AppData\Roaming\npm'
```

npm's global folder went missing (a Node reinstall that didn't fully set
up, antivirus/cleanup tooling, a profile hiccup). Fix: just recreate it -
`mkdir "C:\Users\<you>\AppData\Roaming\npm"` - then retry. If it
persists, check `npm config get prefix` points somewhere sensible.

### Gotcha #7: `npx expo start` offers to install a newer Expo than the project uses

```
Need to install the following packages:
expo@57.0.8
Ok to proceed? (y)
```

**Don't say yes.** This means `npx` couldn't find a *local* copy of Expo
in `node_modules` (usually because a previous `npm install` failed
partway through, often right after Gotcha #6) and is offering to fetch
whatever's newest on npm instead of the SDK 54 this project actually
depends on - accepting it reintroduces Gotcha #1's Node crash. Fix: get
a clean `npm install` to finish successfully first, then `npx expo
start` should launch directly with no prompt at all.

---

## 8. TestFlight / Release readiness

Current status, as of this writing:

- **Bundle identifier**: set (`com.JHarvey.HomeBase`, both iOS and
  Android, in `app.json`) - permanent once Apple registers it, so chosen
  deliberately rather than left as a placeholder.
- **App icon**: finalized - a sage-green house outline with a black
  play-button "door," on the app's own cream background color
  (`#F7F3EC`), matched consistently across the icon, the in-app Cream
  theme option, and the Android adaptive icon background.
- **Data safety**: full export/import backup system plus a two-step-
  confirm "Reset App Data," both in Settings → Data, tested working
  end-to-end (export → reset → restore, confirmed data and theme
  settings both come back correctly).
- **Notifications**: working and tested on-device - see
  [Section 5](#5-notifications--badge-behavior) for the badge design
  decisions specifically.
- **Accessibility**: color contrast pass complete and verified (see
  [Section 6](#6-color-accessibility)); VoiceOver labeling not yet
  started.
- **TypeScript**: `npx tsc --noEmit` currently returns zero errors
  across the whole project.
- **Splash screen**: not yet configured - currently just the default
  icon flash on launch, no dedicated `expo-splash-screen` setup.
- **App Store Connect metadata** (description, "What to Test" notes,
  privacy questionnaire guidance, support URL) - see `Path-To-Store.md`.
- **Apple Developer Program enrollment** - not yet started.
- **Not yet done**: `eas-cli` setup, `eas build:configure`, first real
  `eas build --platform ios`, TestFlight group setup.

---

## 9. Roadmap (genuinely open, not yet built)

- **In-app search** - once Quote Base or Thought Base have enough
  entries that scrolling to find one gets annoying. Not needed yet with
  light data.
- **A cap on Habit Report history** - every habit logs a new entry every
  day, indefinitely, with no cleanup yet. Fine for a long while, worth
  capping (e.g. last 90 days) eventually so storage doesn't grow forever.
- **Real native iOS home-screen widgets** - not just the in-app
  dashboard, an actual widget on the phone's home screen. A meaningfully
  bigger project on top of Expo, not a quick add.
- **Timezone handling** for recurring events and habit resets - untested
  if the app is ever used while traveling across timezones.
- **VoiceOver labeling** - the second half of the accessibility pass
  (see [Section 6](#6-color-accessibility)), not started.
