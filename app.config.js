// app.config.js

import 'dotenv/config';

export default {
  expo: {
    // All of your existing app.json content goes here
    name: "expo-tourist-app",
    slug: "expo-tourist-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "expotouristapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.vijay_talsangi.expotouristapp"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },

    // ✅ Add your environment variables here
    extra: {
      infuraProjectId: process.env.INFURA_PROJECT_ID,
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    },
  },
};