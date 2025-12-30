# VisionGuideAI
AI Companion for the Visually Impaired

VisionGuideAI is a mobile application built with React Native designed to assist visually impaired users. This README covers **Phase 0**: initial setup and project scaffolding.

---

## Prerequisites

- Node.js (v18+)
- React Native CLI
- Android Studio / Xcode (for mobile testing)

---

## Phase 0 Quick Setup

1. **Clone the repository**

```bash
git clone https://github.com/anb-sree/VisionGuideAI.git
cd VisionGuideAI

```

2. **Install dependencies**
```bash
npm install
```
3. **Run the app**
Android:
```bash
npx react-native run-android

```


ios:
```bash
npx react-native run-ios
``` 

### **Some changes to be done after initial setup"
After running npm install

Replace the function jcenter() with mavenCentral() in the following files in case of CMake error during build:

node_modules/react-native-tts/android/build.gradle

and node_modules/@react-native-voice/voice/android/build.gradle



In the following file

node_modules/react-native-voice/android/build.gradle

since the dependency is a bit older version.. please update the following

find the following part in the code:

dependencies {

    compile fileTree(dir: 'libs', include: ['*.jar'])
    
}


replace **compile** with **implementation**

and if its a double word with compile as the second word just as above replace it in camel case

Ex:

replace testCompile 'junit:junit:4.12'

**testCompile** with **testImplementation**




In the file:

node_modules/react-native-voice/android/src/main/java/com/wenkesj/voice/VoiceModule.java

replace the following part of import :

**android.support.annotation.NonNull**

with 

**androidx.annotation.NonNull**



### **To run the app, run the following commands**
In terminal 1:
```bash
cd yolo-server
python yolo_server.py
```

In terminal 2:
```bash
npx react-native start
```
Open the android simulator and keep any device running in the background (mandatory before running the next command)

In terminal 3:
```bash
npx react-native run android
```



### **To run the app, run the following commands**
In terminal 1:
```bash
cd yolo-server
python yolo_server.py
```

In terminal 2:
```bash
npx react-native start
```
Open the android simulator and keep any device running in the background (mandatory before running the next command)

In terminal 3:
```bash
npx react-native run android
```
