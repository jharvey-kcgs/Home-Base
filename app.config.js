// Replaces the old static app.json. Two real, separate App Store Connect
// apps share this one codebase — UAT (TestFlight, all regular builds) and
// Store (App Store submission only) — distinguished purely by the
// APP_VARIANT env var eas.json's "store" build profile sets.
//
// Default (no env var — this is what a plain `eas build`, with no
// --profile flag, has always done and continues to do): UAT.
//   name: "Home Base (UAT)"
//   bundleIdentifier / package: com.JHarvey.HomeBase (unchanged — this
//     already has a real Apple Developer account and bundle ID behind
//     it; nothing about it changes here)
//
// APP_VARIANT=production (only ever set by `eas build --profile store`):
// Store.
//   name: "Home Base" (the real public name, matching
//     Home-Base-App-Store-Info.md exactly — this is NOT "My Home Base";
//     only the UAT variant gets a distinguishing name, so a real Store
//     install and a TestFlight install look different side by side on
//     your own device, but the actual public listing name stays plain)
//   bundleIdentifier / package: com.JHarvey.HomeBaseStore (new —
//     register fresh, only ever used for real App Store submissions)
//
// This is Expo's own recommended pattern for multiple app variants from
// one codebase — one EAS project (one projectId below) can produce builds
// for either bundle identifier; it's not tied permanently to one.

const IS_STORE = process.env.APP_VARIANT === 'production';

module.exports = {
  expo: {
    name: IS_STORE ? 'Home Base' : 'Home Base (UAT)',
    slug: 'home-base',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    assetBundlePatterns: ['**/*'],
    icon: './assets/icon.png',
    ios: {
      // Was false - meant the app only ever ran in iPhone-compatibility
      // mode on iPad (small, scaled, letterboxed), so the tablet-width
      // work done earlier in this project never actually got to render.
      supportsTablet: true,
      // Answers App Store Connect's encryption-compliance prompt
      // permanently, in the binary itself, instead of needing to answer
      // it manually on every future submission — accurate for Home
      // Base, which makes no network requests and uses no custom or
      // third-party encryption of any kind.
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      bundleIdentifier: IS_STORE ? 'com.JHarvey.HomeBaseStore' : 'com.JHarvey.HomeBase',
    },
    android: {
      package: IS_STORE ? 'com.JHarvey.HomeBaseStore' : 'com.JHarvey.HomeBase',
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#F7F3EC',
      },
    },
    plugins: [
      [
        'expo-notifications',
        {
          color: '#007AFF',
        },
      ],
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/icon.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: '#F7F3EC',
        },
      ],
    ],
    extra: {
      eas: {
          "projectId": "2d42ea73-9e51-455d-ae91-b1f26b9a1383"
      },
    },
  },
};
