# Ancestral Skies

A React Native mobile app that reconnects people to the cultural history of the land beneath their feet by revealing the unique celestial stories of Indigenous peoples.

## Features

- **Location-based Experience**: Uses GPS to determine your location and show culturally relevant celestial stories
- **Interactive Star Map**: Pan and zoom through a beautiful night sky with constellation overlays
- **Cultural Stories**: Discover the celestial folklore of the Tonkawa, Comanche, and other Indigenous peoples of Central Texas
- **Immersive UI**: Dark space theme with golden accents and smooth animations

## Technologies Used

- React Native
- Expo
- expo-location for geolocation
- react-native-svg for constellation rendering
- React Native Animations

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ancestral-skies
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## App Flow

1. **Loading Screen**: App requests location permissions with a pulsing star animation
2. **Welcome Screen**: Displays acknowledgment of Indigenous land and peoples (3-4 seconds)
3. **Star Map**: Interactive night sky with constellations
   - Tap constellation stars to view stories
   - Pan and zoom to explore
4. **Details Modal**: View constellation artwork, name, and cultural story

## Constellations Included

- **The Great Coyote**: Stories of the clever trickster
- **The Buffalo Spirit**: Sacred connection to the land
- **The Eagle's Flight**: Messages from ancestors
- **The Deer Star**: Harmony with nature
- **The Moon's Path**: Cycles of life and renewal

## Cultural Note

This app contains culturally inspired content based on publicly available information about Indigenous peoples of Central Texas. A production version would require direct consultation and partnership with tribal elders and cultural representatives.

## License

This project is for educational purposes as part of a hackathon prototype.