# VisionGuideAI
AI Companion for the Visually Impaired

# VisionGuideAI

**AI Companion for the Visually Impaired**

VisionGuideAI is a React Native mobile application designed to assist visually impaired users through AI-powered object detection and voice guidance.


---

## Important Note About API Keys

For security reasons, **Firebase API keys are NOT committed to this repository**.

Each contributor **must create/download their own Firebase configuration file** (`google-services.json`) before the app will run.

This is intentional and required.

---

## Prerequisites

* Node.js **v18+**
* React Native CLI
* Android Studio (for Android development)
* Python 3.8+ (for YOLO server)
* A Google account (for Firebase setup)

---

## Quick Setup

### 1. Clone the repository

```bash
git clone https://github.com/anb-sree/VisionGuideAI.git
cd VisionGuideAI
```

---

### 2. Install dependencies

```bash
npm install
```

---

## Firebase Setup (REQUIRED)

### Step 1: Create a Firebase project

1. Go to **Firebase Console**
2. Click **Add project**
3. Create a new project (or use an existing one)

---

### Step 2: Register Android app in Firebase

1. Open **Project Settings**
2. Click **Add app → Android**
3. Enter package name:

   ```
   com.visionguideai
   ```
4. Skip SHA-1 for now (you can add it later)
5. Download **google-services.json**

---

### Step 3: Place the Firebase config file

Move the downloaded file to:

```
android/app/google-services.json
```

**Do NOT commit this file**
It is already included in `.gitignore`.

---

### Step 4: (Recommended) Add SHA-1 fingerprint

For proper API key restriction:

```bash
cd android
./gradlew signingReport
```

Copy the **debug SHA-1** and add it in:

```
Firebase Console → Project Settings → Android app → Add fingerprint
```

Then **re-download `google-services.json`** and replace the old one.

---

## Running the App

### Android

```bash
npx react-native run-android
```
---

## Required Fixes After `npm install`

Some dependencies use deprecated Android configs. Apply the following fixes **once** after installation.

---

### Fix 1: Replace `jcenter()` with `mavenCentral()`

Update **both** files:

```
node_modules/react-native-tts/android/build.gradle
node_modules/@react-native-voice/voice/android/build.gradle
```

Replace:

```gradle
jcenter()
```

With:

```gradle
mavenCentral()
```

---

### Fix 2: Update deprecated `compile` dependencies

File:

```
node_modules/react-native-voice/android/build.gradle
```

Replace:

```gradle
compile fileTree(dir: 'libs', include: ['*.jar'])
```

With:

```gradle
implementation fileTree(dir: 'libs', include: ['*.jar'])
```

Also update:

* `testCompile` → `testImplementation`
* Any similar deprecated variants

---

### Fix 3: AndroidX import issue

File:

```
node_modules/react-native-voice/android/src/main/java/com/wenkesj/voice/VoiceModule.java
```

Replace:

```java
import android.support.annotation.NonNull;
```

With:

```java
import androidx.annotation.NonNull;
```

---

## YOLO Server (Required for Object Detection)

### Terminal 1 – Start YOLO server

```bash
cd yolo-server
python yolo_server.py
```

---

### Terminal 2 – Start Metro Bundler

```bash
npx react-native start
```

---

### Terminal 3 – Run Android app

> Ensure an Android emulator or physical device is already running.

```bash
npx react-native run-android
```





