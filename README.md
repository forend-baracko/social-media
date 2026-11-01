This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Audius audio proxy

The app can stream Audius audio through the optional Express proxy:

1. Install dependencies with `npm install`.
2. Set `AUDIO_API_BASE_URL` in the root `.env` to the backend's reachable address, such as `http://localhost:3001` for an iOS simulator or `http://10.0.2.2:3001` for the standard Android emulator. For a physical device, use your computer's LAN IP.
3. Start the proxy with `npm run server`.
4. Start Metro and run the app as usual. Audius tracks use `/api/audio/tracks/:trackId` when configured; if the proxy is unavailable, the player automatically retries the direct Audius stream.

The proxy validates Audius track IDs, forwards byte-range requests for seeking, streams only audio responses, and reports upstream/network errors as gateway errors.

## MusicAPI library connection

MusicAPI can connect a user's existing music service and display that account's playlists and track metadata in **Your Library**. It does not provide full audio streams, so this feature does not make source-service tracks playable in Spotibai.

1. In the MusicAPI dashboard, create a Core API key and enable the music services you want users to connect.
2. Add `spotibai://musicapi/callback` under **Settings → Accepted Return URLs**.
3. Set `MUSICAPI_ACCOUNT_SLUG`, `MUSICAPI_CLIENT_ID`, `MUSICAPI_CLIENT_SECRET`, and a random `MUSICAPI_SESSION_SECRET` in the backend `.env`. Keep the Client Secret and session secret server-side only. The existing `FIREBASE_API_KEY` is used by the backend to verify Spotibai sign-ins.
4. Set `AUDIO_API_BASE_URL` in the app `.env` to the reachable Express server URL and run `npm run server`.
5. Rebuild the native app after adding the deep-link configuration, sign in, open **Your Library**, and choose **Connect a music service**.

MusicAPI verifies each hosted sign-in on the backend before issuing a time-limited, user-bound library session. Playlist and track lists are paginated; the app loads additional pages on request. Some MusicAPI accounts need their own music-service developer integration enabled before that source can be connected. Spotibai is not configured as a MusicAPI destination, so this integration browses source-library metadata rather than copying tracks into playable Spotibai playlists.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
