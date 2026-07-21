# Home Base — Setup & Contributor Guide

Home Base is a personal all-in-one iOS app: a Home screen made of six
widgets (events, quotes, tasks, habits, alerts, thoughts), each backed by
its own dedicated screen for adding, editing, and deleting entries. Built
with React Native + Expo, developed entirely on Windows (no Mac required
at any point, including TestFlight).

---

## 1. Prerequisites

- **Node.js 20 LTS — `20.20.2` specifically.** Not 22, not 24, not
  whatever the newest release is. See [Gotcha #1](#gotcha-1-node-version)
  below for exactly why — using a newer Node will crash the dev server.
- [VS Code](https://code.visualstudio.com) (or any editor)
- The **Expo Go** app on an iPhone, from the App Store — lets you preview
  the app live during development with no build step

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

**Alternative — direct download:** if you'd rather not use Chocolatey,
grab the **LTS** installer from [nodejs.org](https://nodejs.org) instead
(not **Current**). This won't pin the exact patch version, but any
Node 20.x should behave the same as `20.20.2` for this project.

Confirm either way with:

```powershell
node -v
```

If you ever need to switch between Node versions across different
projects, [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
lets you do that without reinstalling each time (`nvm install 20`,
`nvm use 20`).

**One more one-time Windows setting worth turning on** — this project's
dependency tree nests deep enough to occasionally exceed Windows'
default file path length limit. Run this once, in an **Administrator**
PowerShell window, then restart your terminal:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

---

## 2. Clone and install

```powershell
cd home-base
npm install
```

`package.json` already lists every dependency this project needs, so a
plain `npm install` pulls all of them in one shot — you don't need to
install each package individually. **If `npm install` throws `ERESOLVE`
errors**, see [Gotcha #2](#gotcha-2-eresolve-peer-dependency-errors) below.

### What's actually installed, and why

| Package | What it's for |
|---|---|
| `expo`, `react`, `react-native` | Core framework |
| `@react-navigation/native`, `@react-navigation/native-stack` | Screen navigation |
| `react-native-screens`, `react-native-safe-area-context` | Required by React Navigation |
| `@react-native-async-storage/async-storage` | All local data storage — the entire app's data layer runs on this |
| `@react-native-community/datetimepicker` | Date/time pickers (Events, Tasks, Alerts) |
| `@react-native-community/slider` | Habit Base's progress sliders |
| `react-native-get-random-values`, `uuid` | Generates unique IDs for every stored item |
| `expo-notifications` | Local push notifications for Alert Base |
| `expo-font`, `@expo-google-fonts/playfair-display` | The app's Playfair Display typeface |
| `react-native-svg` | Left over from a removed experimental feature (an animated mascot) — not currently used anywhere. Safe to `npm uninstall react-native-svg` if you want a leaner dependency list; harmless to leave installed either way. |

If you ever need to add a **new** native dependency, always use `npx expo
install <package>` rather than plain `npm install` — it picks the exact
version compatible with the current Expo SDK, which matters a lot (see
Gotcha #2).

**If `npm install` alone doesn't leave Habit Base's sliders working**
(a plain `npm install` should already cover this since it's in
`package.json`, but if it's ever missing or acting up after a clean
reinstall), reinstall it explicitly the Expo way:

```powershell
npx expo install @react-native-community/slider
```

---

## 3. Running the dev server

```powershell
npx expo start
```

This prints a QR code in the terminal. Scan it with the iPhone's Camera
app — it'll offer to open in Expo Go, and the app runs live on the phone.
Saving any code change shows up on the phone in about a second. This is
the entire development loop; no build, no Xcode, no Mac.

---

## 4. What's here — project structure

```
App.tsx                          Navigation entry point, theme provider,
                                  font loading, first-launch onboarding gate

screens/
  HomeScreen.tsx                  The dashboard - all 6 widget previews
  OnboardingScreen.tsx            First-launch "what's your name?" screen

  EventsScreen.tsx                Event Base    (widget 1)
  QuotesScreen.tsx                Quote Base    (widget 2)
  TasksScreen.tsx                 Task Base     (widget 3)
  HabitsScreen.tsx                Habit Base    (widget 4)
  AlertsScreen.tsx                Alert Base    (widget 5)
  ThoughtsScreen.tsx              Thought Base  (widget 6)

  SettingsScreen.tsx              Settings nav list (Profile/Theme/etc.)
  ProfileSettingsScreen.tsx       Name
  ThemeSettingsScreen.tsx         Dark Mode, Font Size, accent color
  NotificationSettingsScreen.tsx  Enable/disable, Vacation Mode
  DataSettingsScreen.tsx          Backup export/import
  AboutScreen.tsx                 In-app FAQ / user-facing documentation

lib/
  storage.ts                      Every piece of data logic lives here -
                                   one function per action (addEvent,
                                   toggleTaskDone, getHabitReport, etc.)
                                   Read this file first to understand the
                                   data model.
  notifications.ts                Schedules/cancels local notifications,
                                   including calendar-accurate recurrence
  theme.tsx                       App-wide theme (colors, dark mode, font
                                   scale) via React Context
  responsive.ts                   iPad/tablet width-scaling helper used
                                   by every screen
  activity.ts                     (legacy - currently unused, see note below)

types/models.ts                   Every TypeScript type and shared
                                   constant. Add a field here first when
                                   changing what an item stores.

components/
  AppText.tsx                     Drop-in replacement for RN's <Text> -
                                   auto-applies the Font Size setting.
                                   Every screen imports Text from here,
                                   not from 'react-native'.

assets/
  icon.png                        App icon (1024x1024, no transparency)
```

### Where to make common changes

- **Change what a widget does or how it looks** → its screen file in `screens/`
- **Change what data an item stores** → add the field in `types/models.ts`,
  then add/update the matching function in `lib/storage.ts`
- **Change global colors, dark mode, or the accent system** → `lib/theme.tsx`
- **Change notification behavior** → `lib/notifications.ts`
- **Change onboarding** → `screens/OnboardingScreen.tsx` and the gating
  logic in `App.tsx`'s `RootGate` component

---

## 5. Building for TestFlight

Not needed for day-to-day development — Expo Go covers that. When it's
time for an actual build:

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
```

This compiles on Expo's cloud servers (~10-20 min) and requires a paid
**Apple Developer Program** account ($99/year) — that requirement doesn't
go away, only the "you need a Mac" part does.

```powershell
eas submit --platform ios
```

Uploads to App Store Connect. Add yourself to an internal TestFlight
group there (web-based, works fine from Windows) — internal testing
skips App Review entirely.

**Before your first real build:** `app.json`'s `bundleIdentifier` and
`package` fields are still placeholders (`com.yourname.trackerapp`) —
set these to something real before building, since they become
permanent once registered with Apple.

---

## 6. Known setup gotchas

Real issues hit during development, kept here so nobody has to
rediscover them from scratch.

### Gotcha #1: Node version

Node 22+ enabled experimental automatic TypeScript stripping. Some Expo
packages ship `.ts` source files, and Node refuses to strip types for
anything inside `node_modules` — the result is a hard crash on
`npx expo start`:

```
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is
currently unsupported for files under node_modules
```

Fix: use Node 20 LTS specifically. See Section 1.

### Gotcha #2: ERESOLVE peer dependency errors

`npm install` sometimes refuses to resolve dependency trees on its own
in this ecosystem. Fix: create a `.npmrc` file in the project root
containing:

```
legacy-peer-deps=true
```

This makes `npm install` behave permanently like
`npm install --legacy-peer-deps` — safe here, since Expo's own installer
already validates the actual version set.

### Gotcha #3: Don't develop inside OneDrive

If the project folder lives inside a OneDrive-synced directory, OneDrive
tries to sync `node_modules` (tens of thousands of small files) while npm
is writing to it — causes random "file not found" / "directory not
empty" errors, especially when deleting `node_modules` to reinstall
clean. Keep the project somewhere plain, like `C:\dev\home-base`.

### Gotcha #4: Expo Go SDK mismatches

Apple's App Store review queue for the Expo Go app itself often lags
behind Expo's latest SDK release by several versions. If `expo start`
reports "Project is incompatible with this version of Expo Go" even
though you just installed Expo Go, it usually means the project's SDK is
newer than what's currently on the App Store — not a mistake in your
setup. Fix: `npx expo install expo@<older-version> --fix` to step the
project back to whatever SDK the App Store's Expo Go actually supports
right now.

### Gotcha #5: TypeScript files with JSX need `.tsx`, not `.ts`

Straightforward but easy to trip on: any file containing JSX syntax
(anything with `<Component>` tags) must use the `.tsx` extension.
`lib/theme.tsx` is named that way specifically because it renders a
`<Context.Provider>`.

---

## 7. Roadmap (intentionally not built yet)

Banked for later, not forgotten:

- In-app search, once Quote Base / Thought Base have enough entries to
  need it
- A cap on how far back Habit Report history grows before old entries
  get trimmed
- Real native iOS home-screen widgets (not just the in-app dashboard)
- A short guided tour after onboarding, pointing new users at the About
  page
