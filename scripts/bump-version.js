#!/usr/bin/env node
// scripts/bump-version.js
//
// Bumps this project's user-facing semantic version - the one shown in
// TestFlight, the App Store, and Google Play - in version.json.
// app.config.js requires version.json directly, so that's the only file
// this ever needs to touch for Expo/EAS's own purposes; it also mirrors
// the result into package.json's own "version" field purely so the two
// never drift apart when someone's just glancing at package.json.
//
// Why this exists at all: EAS's autoIncrement (see eas.json) only ever
// bumps the internal build number per profile/bundle identifier - it
// never moves this version string forward on its own. Wired into
// package.json's build:uat:*/build:store:* scripts so every real build
// bumps it automatically; same pattern as League Base and Cooking Base.
//
// Usage:
//   node scripts/bump-version.js          (bumps patch: 1.0.0 -> 1.0.1)
//   node scripts/bump-version.js minor    (1.0.5 -> 1.1.0, resets patch)
//   node scripts/bump-version.js major    (1.4.2 -> 2.0.0, resets minor+patch)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'version.json');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

const part = process.argv[2] || 'patch';
if (!['major', 'minor', 'patch'].includes(part)) {
  console.error(`Unknown version part "${part}" - use major, minor, or patch.`);
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
const [major, minor, patch] = versionData.version.split('.').map(Number);

let next;
if (part === 'major') next = `${major + 1}.0.0`;
else if (part === 'minor') next = `${major}.${minor + 1}.0`;
else next = `${major}.${minor}.${patch + 1}`;

const previous = versionData.version;
versionData.version = next;
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');

// Keep package.json's own "version" field in sync, cosmetic but avoids
// confusion for anyone just reading that file directly.
const packageData = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
packageData.version = next;
fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packageData, null, 2) + '\n');

console.log(`Version bumped (${part}): ${previous} -> ${next}`);