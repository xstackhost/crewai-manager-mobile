# Building the CrewAI Manager Mobile App

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Expo account (free): https://expo.dev/signup

## Setup
```bash
cd /opt/crewai-v2/mobile
npm install
```

## Run in development (browser preview)
```bash
npx expo start --web
```

## Build Android APK (no Google Play needed)
```bash
# Login to Expo
eas login

# Build APK directly (sideload install)
eas build --platform android --profile apk
```
The APK download link appears when build completes (~10-15 min on Expo servers).

## Build Android for Google Play (AAB)
```bash
eas build --platform android --profile production
```

## Build iOS (requires Apple Developer account $99/yr)
```bash
eas build --platform ios --profile production
```

## Configure your server
The first time the app opens it asks for your server URL.
Enter:  https://your-crewai-domain.com  or  http://YOUR-SERVER-IP:3002

## Environment variables
No env vars needed in the app — everything is stored in AsyncStorage on-device.
