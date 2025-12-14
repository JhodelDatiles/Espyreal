import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import TutorialOverlay from './(tabs)/TutorialOverlay';
import SplashScreen from './SplashScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/tutsFonts/SpaceMono-Regular.ttf'),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleSplashFinish = () => {
    console.log('Splash finished, showing tutorial');
    setShowSplash(false);
    setShowTutorial(true);
  };

  const handleTutorialFinish = () => {
    console.log('Tutorial finished');
    setShowTutorial(false);
  };

  // Show splash screen while fonts are loading OR during splash animation
  if (!loaded || showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      
      {/* Tutorial Overlay */}
      <TutorialOverlay 
        visible={showTutorial} 
        onClose={handleTutorialFinish} 
      />
    </ThemeProvider>
  );
}