if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
  console.warn(
    '\n EXPO_PUBLIC_GOOGLE_MAPS_API_KEY nije definisan. ' +
    'Kreiraj .env fajl na osnovu .env.example i unesi svoj Google Maps API ključ.\n'
  );
}

module.exports = {
  expo: {
    name: "Fitness Tracker",
    slug: "fitness-tracker",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#121212",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.fitnesstracker",
      permissions: ['android.permission.ACTIVITY_RECOGNITION'],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    androidStatusBar: {
      barStyle: "light-content",
      backgroundColor: "#121212",
      translucent: false
    },
    web: {
      favicon: "./assets/favicon.ico"
    },
    plugins: [
      "expo-sqlite",
      "expo-localization",
      "expo-status-bar",
      [
        'expo-sensors',
        {
          motionPermission: 'Aplikacija koristi senzor pokreta za brojanje koraka tokom treninga.',
        },
      ],
    ]
  }
}